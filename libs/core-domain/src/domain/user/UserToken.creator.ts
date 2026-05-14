import { Injectable } from '@nestjs/common';

import { UserTokenRepository } from '@libs/core-database/src/mysql/entity/user/UserToken.repository';

import { CreateUserTokenData } from './data/CreateUserTokenData';
import { GetUserTokenResult } from './result/GetUserTokenResult';

@Injectable()
export class UserTokenCreator {
  constructor(private readonly userTokenRepository: UserTokenRepository) {}

  async createUserToken(data: CreateUserTokenData): Promise<GetUserTokenResult> {
    const created = await this.userTokenRepository.createUserToken({
      userId: data.userId,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    });

    return GetUserTokenResult.of({
      id: created.id,
      userId: data.userId,
      refreshToken: created.refreshToken,
      expiresAt: created.expiresAt,
    });
  }
}
