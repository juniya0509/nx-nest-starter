import { Injectable } from '@nestjs/common';

import { UserOauthRepository } from '@libs/core-database/src/mysql/entity/user/UserOauth.repository';

import { AuthProviderUnion } from '@libs/core-enum/src/AuthProvider.enum';

import { GetUserOauthResult } from './result/GetUserOauthResult';

@Injectable()
export class UserOauthReader {
  constructor(private readonly userOauthRepository: UserOauthRepository) {}

  async findByLogtoUserId(logtoUserId: string): Promise<GetUserOauthResult | null> {
    const userOauth = await this.userOauthRepository.findByLogtoUserId(logtoUserId);
    if (!userOauth) return null;

    return GetUserOauthResult.of({
      id: userOauth.id,
      userId: userOauth.user.id,
      logtoUserId: userOauth.logtoUserId,
      provider: userOauth.provider,
      providerUserId: userOauth.providerUserId,
    });
  }

  async findByUserIdAndProvider(userId: number, provider: AuthProviderUnion): Promise<GetUserOauthResult | null> {
    const userOauth = await this.userOauthRepository.findByUserIdAndProvider(userId, provider);
    if (!userOauth) return null;

    return GetUserOauthResult.of({
      id: userOauth.id,
      userId: userOauth.user.id,
      logtoUserId: userOauth.logtoUserId,
      provider: userOauth.provider,
      providerUserId: userOauth.providerUserId,
    });
  }
}
