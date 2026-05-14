import { Test, TestingModule } from '@nestjs/testing';

import { UserTokenRepository } from '@libs/core-database/src/mysql/entity/user/UserToken.repository';

import { UserTokenRemover } from './UserToken.remover';

describe('UserTokenRemover', () => {
  let remover: UserTokenRemover;
  let userTokenRepository: jest.Mocked<Pick<UserTokenRepository, 'deleteByUserId' | 'deleteByRefreshToken' | 'hardDeleteExpired'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserTokenRemover,
        {
          provide: UserTokenRepository,
          useValue: { deleteByUserId: jest.fn(), deleteByRefreshToken: jest.fn(), hardDeleteExpired: jest.fn() },
        },
      ],
    }).compile();

    remover = moduleRef.get(UserTokenRemover);
    userTokenRepository = moduleRef.get(UserTokenRepository);
  });

  it('removeByUserId: repo.deleteByUserId 위임', async () => {
    userTokenRepository.deleteByUserId.mockResolvedValue(undefined);

    await remover.removeByUserId(7);

    expect(userTokenRepository.deleteByUserId).toHaveBeenCalledWith(7);
  });

  it('removeByRefreshToken: repo.deleteByRefreshToken 위임', async () => {
    userTokenRepository.deleteByRefreshToken.mockResolvedValue(undefined);

    await remover.removeByRefreshToken('rt-x');

    expect(userTokenRepository.deleteByRefreshToken).toHaveBeenCalledWith('rt-x');
  });

  it('removeExpired: 기본 now 인자로 hardDeleteExpired 위임 + affected 반환', async () => {
    userTokenRepository.hardDeleteExpired.mockResolvedValue(42);

    const before = new Date();
    const affected = await remover.removeExpired();
    const after = new Date();

    expect(affected).toBe(42);
    expect(userTokenRepository.hardDeleteExpired).toHaveBeenCalledTimes(1);
    const usedNow = userTokenRepository.hardDeleteExpired.mock.calls[0]![0];
    expect(usedNow.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(usedNow.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('removeExpired: 명시 now 인자가 그대로 repo 로 전달', async () => {
    userTokenRepository.hardDeleteExpired.mockResolvedValue(0);
    const fixedNow = new Date('2026-05-08T19:00:00Z');

    await remover.removeExpired(fixedNow);

    expect(userTokenRepository.hardDeleteExpired).toHaveBeenCalledWith(fixedNow);
  });
});
