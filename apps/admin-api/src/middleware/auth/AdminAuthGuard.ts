import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';

import { AdminAuthService } from '../../domain/admin-auth/AdminAuth.service';
import { AdminContextResult } from '../../domain/admin-auth/result/AdminContextResult';
import { AdminApiError } from '../../support/error/AdminApiError';

import { ADMIN_AUTH_KEY, AdminAuthMetadata } from './AdminAuth.decorator';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<AdminAuthMetadata | undefined>(ADMIN_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!metadata) return true;

    const req = context.switchToHttp().getRequest<Request & { adminContext?: AdminContextResult }>();
    const authHeader = req.headers['authorization'];

    if (typeof authHeader !== 'string' || !authHeader.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException({ errorType: AdminApiError.NOT_LOGGED_IN });
    }

    const accessJwt = authHeader.slice(BEARER_PREFIX.length).trim();
    const adminContext = await this.adminAuthService.resolveAdminContextByAccessJwt(accessJwt);

    if (metadata.requireAllCodes.length > 0 && !adminContext.hasAllPermissions(metadata.requireAllCodes)) {
      throw new ForbiddenException({ errorType: AdminApiError.DO_NOT_HAVE_PERMISSION });
    }

    if (metadata.requireAnyCodes.length > 0 && !adminContext.hasAnyPermission(metadata.requireAnyCodes)) {
      throw new ForbiddenException({ errorType: AdminApiError.DO_NOT_HAVE_PERMISSION });
    }

    req.adminContext = adminContext;
    return true;
  }
}
