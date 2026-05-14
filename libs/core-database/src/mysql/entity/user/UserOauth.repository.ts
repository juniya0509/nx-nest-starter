import { Repository } from 'typeorm';

import { AuthProviderUnion } from '@libs/core-enum/src/AuthProvider.enum';

import { CustomRepository } from '../../decorator/TypeOrmCustomRepository.decorator';

import { UserOauthEntity } from './UserOauth.entity';

@CustomRepository(UserOauthEntity)
export class UserOauthRepository extends Repository<UserOauthEntity> {
  async findByLogtoUserId(logtoUserId: string): Promise<UserOauthEntity | null> {
    const userOauth = await this.findOne({
      where: { logtoUserId },
      relations: { user: true },
    });

    if (!userOauth?.user) return null;

    return userOauth;
  }

  async findByUserId(userId: number): Promise<UserOauthEntity | null> {
    const userOauth = await this.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });

    if (!userOauth?.user) return null;

    return userOauth;
  }

  async findByUserIdAndProvider(userId: number, provider: AuthProviderUnion): Promise<UserOauthEntity | null> {
    const userOauth = await this.findOne({
      where: { user: { id: userId }, provider },
      relations: { user: true },
    });

    if (!userOauth?.user) return null;

    return userOauth;
  }

  async createUserOauth(createUserOauthData: {
    readonly userId: number;
    readonly logtoUserId: string;
    readonly provider: AuthProviderUnion;
    readonly providerUserId: string | null;
  }): Promise<UserOauthEntity> {
    const { userId, logtoUserId, provider, providerUserId } = createUserOauthData;

    const createdUserOauth = await this.save(
      this.create({
        user: { id: userId },
        logtoUserId,
        provider,
        providerUserId,
      }),
    );

    return createdUserOauth;
  }
}
