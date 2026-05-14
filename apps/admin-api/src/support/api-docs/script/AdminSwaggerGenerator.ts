import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import { INestApplication, Module, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryModule, DiscoveryService, MetadataScanner, NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import { initializeTransactionalContext } from 'typeorm-transactional';

import { languageCodeList } from '@libs/core-enum/src/Language.enum';

import { AdminApiAppModule } from '../../../module/AdminApiApp.module';
import { ADMIN_SWAGGER_ACCESS_ROLES_METADATA_KEY, AdminSwaggerAccessRolesMetadata } from '../AdminSwaggerApiAccessRoles';

initializeTransactionalContext();

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

type SecurityRequirement = Record<string, string[]>;
type Parameter = Record<string, unknown>;
type Operation = {
  description?: string;
  security?: SecurityRequirement[];
  parameters?: Parameter[];
};
type PathItem = Partial<Record<HttpMethod, Operation>>;
type SecurityScheme = Record<string, unknown>;

type SwaggerDocument = {
  paths: Record<string, PathItem>;
  components?: {
    securitySchemes?: Record<string, SecurityScheme>;
  };
  security?: SecurityRequirement[];
};

// NOTE: Swagger 문서를 후처리해서 security 명시
function applySecurityRules(document: SwaggerDocument): SwaggerDocument {
  const securityKey = 'Access JWT';

  for (const methods of Object.values(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = methods[method];
      if (!operation) continue;

      const hasSecurity = operation.security?.some((sec) => sec[securityKey] !== undefined);
      operation.security = hasSecurity ? [{ [securityKey]: [] }] : [];
    }
  }

  delete document.security;

  return document;
}

// NOTE: 모든 API에 x-user-lang 헤더 파라미터 추가
function applyGlobalHeaderParameter(document: SwaggerDocument): SwaggerDocument {
  const langHeaderParam: Parameter = {
    required: true,
    name: 'x-user-lang',
    in: 'header',
    schema: {
      type: 'string',
      enum: languageCodeList,
    },
    description: '사용자의 언어 코드',
  };

  for (const methods of Object.values(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = methods[method];
      if (!operation) continue;

      if (!operation.parameters) operation.parameters = [];
      operation.parameters.push(langHeaderParam);
    }
  }

  return document;
}

const REQUEST_METHOD_TO_HTTP: Partial<Record<RequestMethod, HttpMethod>> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.DELETE]: 'delete',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.OPTIONS]: 'options',
  [RequestMethod.HEAD]: 'head',
};

function normalizePathSegments(...segments: string[]): string {
  const joined = segments
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment.length > 0)
    .join('/');

  const withLeadingSlash = `/${joined}`;
  // NestJS는 :param, OpenAPI는 {param} 형태이므로 변환
  return withLeadingSlash.replace(/:([^/]+)/g, '{$1}');
}

function formatPermissionLines(metadata: AdminSwaggerAccessRolesMetadata): string[] {
  const lines: string[] = [];

  if (metadata.requireAll.length > 0) {
    const items = metadata.requireAll.map((p) => `\`${p.code}\` (${p.description})`).join(', ');
    lines.push(`**Required Permissions (ALL):** ${items}`);
  }

  if (metadata.requireAny.length > 0) {
    const items = metadata.requireAny.map((p) => `\`${p.code}\` (${p.description})`).join(', ');
    lines.push(`**Required Permissions (ANY):** ${items}`);
  }

  return lines;
}

// NOTE: @AdminAuth가 기록한 access-roles 메타데이터를 Operation.description에 Markdown으로 합쳐 표시
function applyAdminAccessRoles(app: INestApplication, document: SwaggerDocument): SwaggerDocument {
  const discoveryService = app.get(DiscoveryService);
  const metadataScanner = app.get(MetadataScanner);

  const controllers = discoveryService.getControllers();

  for (const wrapper of controllers) {
    const { instance, metatype } = wrapper;
    if (!instance || !metatype) continue;

    const controllerPath = (Reflect.getMetadata(PATH_METADATA, metatype) as string | string[] | undefined) ?? '';
    const controllerPathStr = Array.isArray(controllerPath) ? (controllerPath[0] ?? '') : controllerPath;
    const prototype = Object.getPrototypeOf(instance) as object;

    metadataScanner.getAllMethodNames(prototype).forEach((methodName) => {
      const handler = (prototype as Record<string, unknown>)[methodName];
      if (typeof handler !== 'function') return;

      const accessMeta = Reflect.getMetadata(ADMIN_SWAGGER_ACCESS_ROLES_METADATA_KEY, handler) as
        | AdminSwaggerAccessRolesMetadata
        | undefined;
      if (!accessMeta) return;

      const lines = formatPermissionLines(accessMeta);
      if (lines.length === 0) return;

      const methodPath = (Reflect.getMetadata(PATH_METADATA, handler) as string | undefined) ?? '';
      const methodVerb = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
      if (methodVerb === undefined) return;

      const verb = REQUEST_METHOD_TO_HTTP[methodVerb];
      if (!verb) return;

      const fullPath = normalizePathSegments(controllerPathStr, methodPath);
      const operation = document.paths[fullPath]?.[verb];
      if (!operation) return;

      const existing = operation.description ?? '';
      operation.description = existing.length > 0 ? `${existing}\n\n${lines.join('\n\n')}` : lines.join('\n\n');
    });
  }

  return document;
}

// NOTE: Apidog 호환을 위한 x-apidog 확장 필드 추가
function applyApidogExtensions(document: SwaggerDocument): SwaggerDocument {
  const scheme = document.components?.securitySchemes?.['Access JWT'];
  if (!scheme) return document;

  scheme['x-apidog'] = {
    authType: 'bearer',
    addTokenTo: 'header',
    headerPrefix: 'Bearer',
    token: '{{bearerToken}}',
  };

  return document;
}

@Module({ imports: [DiscoveryModule, AdminApiAppModule] })
class AdminSwaggerBootstrapModule {}

async function adminGenerateSwagger() {
  const app = await NestFactory.create(AdminSwaggerBootstrapModule);

  const config = new DocumentBuilder()
    .setTitle('Nx Nest Starter Admin API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        name: 'Access JWT',
        type: 'http',
        in: 'header',
        scheme: 'bearer',
        description: 'Access JWT for user authentication',
      },
      'Access JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config) as OpenAPIObject & SwaggerDocument;

  // NOTE: bearerFormat을 제거 하지 않으면 Apidog에서 JWT로 인식 함
  const accessJwt = document.components?.securitySchemes?.['Access JWT'];
  if (accessJwt) {
    delete accessJwt['bearerFormat'];
  }

  const withAccessRoles = applyAdminAccessRoles(app, document);
  const withSecurity = applySecurityRules(withAccessRoles);
  const withHeaders = applyGlobalHeaderParameter(withSecurity);
  const withApidog = applyApidogExtensions(withHeaders);

  const cwd = process.cwd();
  const isInAppDir = cwd.endsWith('apps/admin-api');

  const outputDir = isInAppDir ? resolve(cwd, 'src/support/api-docs') : resolve(cwd, 'apps/admin-api/src/support/api-docs');

  const outputPath = join(outputDir, 'swagger.json');

  mkdirSync(outputDir, { recursive: true });

  writeFileSync(outputPath, JSON.stringify(withApidog, null, 2));

  console.log(`Swagger document generated at: ${outputPath}`);

  await app.close();
}

adminGenerateSwagger();
