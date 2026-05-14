import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const USER_AUTH_OPTIONAL_KEY = 'USER_AUTH_OPTIONAL';

/**
 * 옵션 인증.
 * - Authorization 헤더 없으면: req.user = undefined → @RequestUser()는 null 반환 (no throw)
 * - Authorization 헤더 있으면: 정식 검증 (UserAuthGuard와 동일). 토큰/상태 문제는 401로 throw.
 */
export function UserAuthGuardOptional(): MethodDecorator & ClassDecorator {
  return applyDecorators(SetMetadata(USER_AUTH_OPTIONAL_KEY, true), ApiBearerAuth('Access JWT'));
}
