export const ADMIN_SWAGGER_ACCESS_ROLES_METADATA_KEY = 'admin:swagger:access-roles';

export type AdminSwaggerAccessRolesMetadata = {
  readonly requireAll: { readonly code: string; readonly description: string }[];
  readonly requireAny: { readonly code: string; readonly description: string }[];
};
