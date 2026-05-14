import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AdminContextResult } from '../../domain/admin-auth/result/AdminContextResult';

export type AdminRequestUserPayload = AdminContextResult | null;

export const AdminRequestUser = createParamDecorator((_: unknown, context: ExecutionContext): AdminRequestUserPayload => {
  const req = context.switchToHttp().getRequest<{ adminContext?: AdminContextResult }>();
  return req.adminContext ?? null;
});
