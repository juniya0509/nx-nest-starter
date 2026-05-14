import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { AdminPermission } from '../../enum/AdminPermission.enum';
import {
  ADMIN_SWAGGER_ACCESS_ROLES_METADATA_KEY,
  AdminSwaggerAccessRolesMetadata,
} from '../../support/api-docs/AdminSwaggerApiAccessRoles';

export const ADMIN_AUTH_KEY = 'ADMIN_AUTH_GUARD';

type AdminAuthOptions = {
  readonly requireAll?: AdminPermission[];
  readonly requireAny?: AdminPermission[];
};

export type AdminAuthMetadata = {
  readonly requireAllCodes: string[];
  readonly requireAnyCodes: string[];
};

export function AdminAuth(options?: AdminAuthOptions): MethodDecorator & ClassDecorator {
  const requireAll = options?.requireAll ?? [];
  const requireAny = options?.requireAny ?? [];

  const guardMetadata: AdminAuthMetadata = {
    requireAllCodes: requireAll.map((permission) => permission.code),
    requireAnyCodes: requireAny.map((permission) => permission.code),
  };

  const swaggerMetadata: AdminSwaggerAccessRolesMetadata = {
    requireAll: requireAll.map((permission) => ({ code: permission.code, description: permission.description })),
    requireAny: requireAny.map((permission) => ({ code: permission.code, description: permission.description })),
  };

  return applyDecorators(
    SetMetadata(ADMIN_AUTH_KEY, guardMetadata),
    SetMetadata(ADMIN_SWAGGER_ACCESS_ROLES_METADATA_KEY, swaggerMetadata),
    ApiBearerAuth('Access JWT'),
  );
}
