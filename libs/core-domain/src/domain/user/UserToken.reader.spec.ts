import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UserTokenEntity } from '@libs/core-database/src/mysql/entity/user/UserToken.entity';
import { UserTokenRepository } from '@libs/core-database/src/mysql/entity/user/UserToken.repository';

import { UserTokenReader } from './UserToken.reader';

describe('UserTokenReader', () => {
  let reader: UserTokenReader;
  let userTokenRepository: jest.Mocked<Pick<UserTokenRepository, 'findByRefreshToken'>>;

  const buildToken = (overrides: Partial<{ id: number; userId: number; refreshToken: string }> = {}): UserTokenEntity =>
    ({
      id: overrides.id ?? 1,
      refreshToken: overrides.refreshToken ?? 'rt-1',
      expiresAt: new Date('2026-12-01'),
      user: { id: overrides.userId ?? 7 },
    }) as unknown as UserTokenEntity;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UserTokenReader, { provide: UserTokenRepository, useValue: { findByRefreshToken: jest.fn() } }],
    }).compile();

    reader = moduleRef.get(UserTokenReader);
    userTokenRepository = moduleRef.get(UserTokenRepository);
  });

  describe('findByRefreshToken', () => {
    it('존재하면 GetUserTokenResult 반환', async () => {
      userTokenRepository.findByRefreshToken.mockResolvedValue(buildToken({ userId: 7, refreshToken: 'rt-1' }));

      const result = await reader.findByRefreshToken('rt-1');

      expect(result?.userId).toBe(7);
      expect(result?.refreshToken).toBe('rt-1');
    });

    it('없으면 null', async () => {
      userTokenRepository.findByRefreshToken.mockResolvedValue(null);

      expect(await reader.findByRefreshToken('orphan')).toBeNull();
    });
  });

  describe('getByRefreshTokenOrThrow', () => {
    it('존재하면 GetUserTokenResult 반환', async () => {
      userTokenRepository.findByRefreshToken.mockResolvedValue(buildToken());

      const result = await reader.getByRefreshTokenOrThrow('rt-1');

      expect(result.id).toBe(1);
    });

    it('없으면 USER_TOKEN_NOT_FOUND UnauthorizedException', async () => {
      userTokenRepository.findByRefreshToken.mockResolvedValue(null);

      await expect(reader.getByRefreshTokenOrThrow('orphan')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'USER_TOKEN_NOT_FOUND' } },
      });
    });
  });
});
