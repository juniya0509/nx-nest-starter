import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import { initializeTransactionalContext } from 'typeorm-transactional';

import { languageCodeList } from '@libs/core-enum/src/Language.enum';

import { ApiAppModule } from '../../../module/ApiApp.module';

initializeTransactionalContext();

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

type SecurityRequirement = Record<string, string[]>;
type Parameter = Record<string, unknown>;
type Operation = {
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

async function generateSwagger() {
  const app = await NestFactory.create(ApiAppModule);

  const config = new DocumentBuilder()
    .setTitle('Nx Nest Starter Core API')
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

  const withSecurity = applySecurityRules(document);
  const withHeaders = applyGlobalHeaderParameter(withSecurity);
  const withApidog = applyApidogExtensions(withHeaders);

  const cwd = process.cwd();
  const isInAppDir = cwd.endsWith('apps/core-api');

  const outputDir = isInAppDir ? resolve(cwd, 'src/support/api-docs') : resolve(cwd, 'apps/core-api/src/support/api-docs');

  const outputPath = join(outputDir, 'swagger.json');

  mkdirSync(outputDir, { recursive: true });

  writeFileSync(outputPath, JSON.stringify(withApidog, null, 2));

  console.log(`Swagger document generated at: ${outputPath}`);

  await app.close();
}

generateSwagger();
