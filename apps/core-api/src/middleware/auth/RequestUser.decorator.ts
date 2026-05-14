import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { GetUserResult } from '@libs/core-domain/src/domain/user/result/GetUserResult';

export type RequestUserPayload = GetUserResult | null;

export const RequestUser = createParamDecorator((_: unknown, context: ExecutionContext): RequestUserPayload => {
  const req = context.switchToHttp().getRequest<{ user?: GetUserResult }>();
  return req.user ?? null;
});
