import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const USER_AUTH_KEY = 'USER_AUTH_GUARD';

export function UserAuthGuard(): MethodDecorator & ClassDecorator {
  return applyDecorators(SetMetadata(USER_AUTH_KEY, true), ApiBearerAuth('Access JWT'));
}
