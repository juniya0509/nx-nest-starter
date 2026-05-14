import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserTokenRepository } from '@libs/core-database/src/mysql/entity/user/UserToken.repository';

import { CoreDomainError } from '../../support/error/CoreDomainError';

import { GetUserTokenResult } from './result/GetUserTokenResult';

@Injectable()
export class UserTokenReader {
  constructor(private readonly userTokenRepository: UserTokenRepository) {}

  async findByRefreshToken(refreshToken: string): Promise<GetUserTokenResult | null> {
    const userToken = await this.userTokenRepository.findByRefreshToken(refreshToken);
    if (!userToken) return null;

    return GetUserTokenResult.of({
      id: userToken.id,
      userId: userToken.user.id,
      refreshToken: userToken.refreshToken,
      expiresAt: userToken.expiresAt,
    });
  }

  async getByRefreshTokenOrThrow(refreshToken: string): Promise<GetUserTokenResult> {
    const userToken = await this.findByRefreshToken(refreshToken);
    if (!userToken) {
      throw new UnauthorizedException({ errorType: CoreDomainError.USER_TOKEN_NOT_FOUND });
    }
    return userToken;
  }
}
