import { Injectable } from '@nestjs/common';

import { UserOauthRepository } from '@libs/core-database/src/mysql/entity/user/UserOauth.repository';

import { CreateUserOauthData } from './data/CreateUserOauthData';
import { GetUserOauthResult } from './result/GetUserOauthResult';

@Injectable()
export class UserOauthCreator {
  constructor(private readonly userOauthRepository: UserOauthRepository) {}

  async createUserOauth(data: CreateUserOauthData): Promise<GetUserOauthResult> {
    const created = await this.userOauthRepository.createUserOauth({
      userId: data.userId,
      logtoUserId: data.logtoUserId,
      provider: data.provider,
      providerUserId: data.providerUserId,
    });

    return GetUserOauthResult.of({
      id: created.id,
      userId: data.userId,
      logtoUserId: created.logtoUserId,
      provider: created.provider,
      providerUserId: created.providerUserId,
    });
  }
}
