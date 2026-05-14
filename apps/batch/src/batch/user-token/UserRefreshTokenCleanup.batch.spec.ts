import { Test, TestingModule } from '@nestjs/testing';

import { UserTokenRemover } from '@libs/core-domain/src/domain/user/UserToken.remover';

import { UserRefreshTokenCleanupBatch } from './UserRefreshTokenCleanup.batch';

describe('UserRefreshTokenCleanupBatch', () => {
  let batch: UserRefreshTokenCleanupBatch;
  let remover: jest.Mocked<Pick<UserTokenRemover, 'removeExpired'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UserRefreshTokenCleanupBatch, { provide: UserTokenRemover, useValue: { removeExpired: jest.fn() } }],
    }).compile();

    batch = moduleRef.get(UserRefreshTokenCleanupBatch);
    remover = moduleRef.get(UserTokenRemover);
  });

  it('run: remover.removeExpired 호출 후 정상 완료 (반환값 없음)', async () => {
    remover.removeExpired.mockResolvedValue(7);

    await expect(batch.run()).resolves.toBeUndefined();
    expect(remover.removeExpired).toHaveBeenCalledTimes(1);
  });

  it('run: remover 가 throw 하면 그대로 propagate (Sentry/log 가 받도록)', async () => {
    remover.removeExpired.mockRejectedValue(new Error('db down'));

    await expect(batch.run()).rejects.toThrow('db down');
  });
});
