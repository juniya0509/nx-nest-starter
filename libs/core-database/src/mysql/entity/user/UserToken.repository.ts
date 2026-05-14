import { LessThan, Repository } from 'typeorm';

import { CustomRepository } from '../../decorator/TypeOrmCustomRepository.decorator';

import { UserTokenEntity } from './UserToken.entity';

@CustomRepository(UserTokenEntity)
export class UserTokenRepository extends Repository<UserTokenEntity> {
  async findByRefreshToken(refreshToken: string): Promise<UserTokenEntity | null> {
    const userToken = await this.findOne({
      where: { refreshToken },
      relations: { user: true },
    });

    return userToken;
  }

  async createUserToken(createUserTokenData: {
    readonly userId: number;
    readonly refreshToken: string;
    readonly expiresAt: Date;
  }): Promise<UserTokenEntity> {
    const { userId, refreshToken, expiresAt } = createUserTokenData;

    const createdUserToken = await this.save(
      this.create({
        user: { id: userId },
        refreshToken,
        expiresAt,
      }),
    );

    return createdUserToken;
  }

  async deleteByUserId(userId: number): Promise<void> {
    await this.softDelete({ user: { id: userId } });
  }

  async deleteByRefreshToken(refreshToken: string): Promise<void> {
    await this.softDelete({ refreshToken });
  }

  /**
   * 만료된 refresh token row 일괄 hard delete (batch cleanup 용).
   * - `expires_at < now` 인 row 만 대상
   * - `IDX_user_token_expires_at` range scan 활용
   * - 반환: 실제 삭제된 row 수
   */
  async hardDeleteExpired(now: Date): Promise<number> {
    const result = await this.delete({ expiresAt: LessThan(now) });
    return result.affected ?? 0;
  }
}
