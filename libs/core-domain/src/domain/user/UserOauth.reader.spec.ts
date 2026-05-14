import { Test, TestingModule } from '@nestjs/testing';

import { UserOauthEntity } from '@libs/core-database/src/mysql/entity/user/UserOauth.entity';
import { UserOauthRepository } from '@libs/core-database/src/mysql/entity/user/UserOauth.repository';

import { UserOauthReader } from './UserOauth.reader';

describe('UserOauthReader', () => {
  let reader: UserOauthReader;
  let userOauthRepository: jest.Mocked<Pick<UserOauthRepository, 'findByLogtoUserId' | 'findByUserIdAndProvider'>>;

  const buildOauth = (overrides: Partial<{ id: number; userId: number; logtoUserId: string; provider: string }> = {}): UserOauthEntity =>
    ({
      id: overrides.id ?? 1,
      logtoUserId: overrides.logtoUserId ?? 'logto-1',
      provider: overrides.provider ?? 'KAKAO',
      providerUserId: 'k_1',
      user: { id: overrides.userId ?? 7 },
    }) as unknown as UserOauthEntity;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserOauthReader,
        { provide: UserOauthRepository, useValue: { findByLogtoUserId: jest.fn(), findByUserIdAndProvider: jest.fn() } },
      ],
    }).compile();

    reader = moduleRef.get(UserOauthReader);
    userOauthRepository = moduleRef.get(UserOauthRepository);
  });

  describe('findByLogtoUserId', () => {
    it('존재하면 GetUserOauthResult 반환', async () => {
      userOauthRepository.findByLogtoUserId.mockResolvedValue(buildOauth({ logtoUserId: 'logto-1', userId: 7 }));

      const result = await reader.findByLogtoUserId('logto-1');

      expect(result?.userId).toBe(7);
      expect(result?.logtoUserId).toBe('logto-1');
    });

    it('없으면 null', async () => {
      userOauthRepository.findByLogtoUserId.mockResolvedValue(null);

      expect(await reader.findByLogtoUserId('none')).toBeNull();
    });
  });

  describe('findByUserIdAndProvider', () => {
    it('존재하면 GetUserOauthResult 반환', async () => {
      userOauthRepository.findByUserIdAndProvider.mockResolvedValue(buildOauth({ userId: 7, provider: 'NAVER' }));

      const result = await reader.findByUserIdAndProvider(7, 'NAVER');

      expect(result?.provider).toBe('NAVER');
      expect(userOauthRepository.findByUserIdAndProvider).toHaveBeenCalledWith(7, 'NAVER');
    });

    it('없으면 null', async () => {
      userOauthRepository.findByUserIdAndProvider.mockResolvedValue(null);

      expect(await reader.findByUserIdAndProvider(7, 'KAKAO')).toBeNull();
    });
  });
});
