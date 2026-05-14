import { Injectable } from '@nestjs/common';

import { UserTokenRepository } from '@libs/core-database/src/mysql/entity/user/UserToken.repository';

@Injectable()
export class UserTokenRemover {
  constructor(private readonly userTokenRepository: UserTokenRepository) {}

  async removeByUserId(userId: number): Promise<void> {
    await this.userTokenRepository.deleteByUserId(userId);
  }

  async removeByRefreshToken(refreshToken: string): Promise<void> {
    await this.userTokenRepository.deleteByRefreshToken(refreshToken);
  }

  /** batch cleanup: 만료된 refresh token 일괄 hard delete. 반환은 삭제된 row 수. */
  async removeExpired(now: Date = new Date()): Promise<number> {
    return this.userTokenRepository.hardDeleteExpired(now);
  }
}
