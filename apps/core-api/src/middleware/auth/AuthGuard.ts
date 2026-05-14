import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';

import { AuthService } from '@libs/core-domain/src/domain/auth/Auth.service';
import { GetUserResult } from '@libs/core-domain/src/domain/user/result/GetUserResult';

import { ApiError } from '../../support/error/ApiError';

import { USER_AUTH_KEY } from './UserAuthGuard.decorator';
import { USER_AUTH_OPTIONAL_KEY } from './UserAuthGuardOptional.decorator';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireAuth = this.reflector.get<boolean>(USER_AUTH_KEY, context.getHandler());
    const optionalAuth = this.reflector.get<boolean>(USER_AUTH_OPTIONAL_KEY, context.getHandler());

    if (!requireAuth && !optionalAuth) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: GetUserResult }>();
    const authHeader = req.headers['authorization'];

    if (typeof authHeader !== 'string' || !authHeader.startsWith(BEARER_PREFIX)) {
      // 헤더 없음:
      //   - required → 401
      //   - optional → 익명 통과 (req.user 미세팅 → @RequestUser()가 null 반환)
      if (optionalAuth) return true;
      throw new UnauthorizedException({ errorType: ApiError.NON_EXISTENT_USER });
    }

    const accessJwt = authHeader.slice(BEARER_PREFIX.length).trim();
    const requestUser = await this.authService.getVerifiedUserByAccessJwt(accessJwt);

    if (requestUser.status === 'WITHDRAWN' || requestUser.status === 'DELETED') {
      throw new UnauthorizedException({ errorType: ApiError.NOT_ACTIVED_USER });
    }

    // TODO: 활동 정지 기능 구현 후 errorData를 실제 restriction 레코드로 채울 것
    if (requestUser.status === 'SUSPENDED') {
      throw new UnauthorizedException({
        errorType: ApiError.SUSPENDED_USER,
        errorData: {
          restrictionId: 'RST_placeholder',
          type: 'LOGIN_BLOCK',
          status: 'ACTIVE',
        },
      });
    }

    req.user = requestUser;
    return true;
  }
}
