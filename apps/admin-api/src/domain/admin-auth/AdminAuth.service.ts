import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtVerifier } from '@libs/core-domain/src/domain/auth/Jwt.verifier';
import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminApiError } from '../../support/error/AdminApiError';
import { AdminAccountReader } from '../admin-account/AdminAccount.reader';
import { AdminPermissionReader } from '../admin-permission/AdminPermission.reader';

import { AdminContextResult } from './result/AdminContextResult';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly jwtVerifier: JwtVerifier,
    private readonly userReader: UserReader,
    private readonly adminAccountReader: AdminAccountReader,
    private readonly adminPermissionReader: AdminPermissionReader,
  ) {}

  async resolveAdminContextByAccessJwt(accessJwt: string): Promise<AdminContextResult> {
    const verifyResult = await this.jwtVerifier.verifyAccessToken(accessJwt);
    if (verifyResult.isErr()) {
      const errorType =
        verifyResult.error === 'expired' ? CoreDomainError.EXPIRED_JWT_ACCESS_TOKEN : CoreDomainError.INVALID_JWT_ACCESS_TOKEN;
      throw new UnauthorizedException({ errorType });
    }

    const user = await this.userReader.getByIdOrThrow(verifyResult.value.userId);

    if (user.status === 'WITHDRAWN' || user.status === 'DELETED') {
      throw new UnauthorizedException({ errorType: AdminApiError.NOT_ACTIVED_USER });
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException({ errorType: AdminApiError.SUSPENDED_USER });
    }

    const adminAccount = await this.adminAccountReader.findByUserId(user.id);
    if (!adminAccount) {
      throw new UnauthorizedException({ errorType: AdminApiError.DO_NOT_HAVE_PERMISSION });
    }

    if (!adminAccount.isActive) {
      throw new UnauthorizedException({ errorType: AdminApiError.DO_NOT_HAVE_PERMISSION });
    }

    const permissionCodes = await this.adminPermissionReader.findEffectivePermissionCodesByAdminAccountId(adminAccount.id);

    return AdminContextResult.of({
      user,
      adminAccount,
      permissionCodes,
    });
  }
}
