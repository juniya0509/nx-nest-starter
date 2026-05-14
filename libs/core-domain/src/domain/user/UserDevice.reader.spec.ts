import { Test, TestingModule } from '@nestjs/testing';

import { UserDeviceEntity } from '@libs/core-database/src/mysql/entity/user/UserDevice.entity';
import { UserDeviceRepository } from '@libs/core-database/src/mysql/entity/user/UserDevice.repository';

import { UserDeviceReader } from './UserDevice.reader';

describe('UserDeviceReader', () => {
  let reader: UserDeviceReader;
  let repo: jest.Mocked<Pick<UserDeviceRepository, 'findByUserId'>>;

  const buildEntity = (overrides: Partial<{ id: number; userId: number; pushToken: string }> = {}): UserDeviceEntity =>
    ({
      id: overrides.id ?? 1,
      user: { id: overrides.userId ?? 1 },
      deviceType: 'IOS_APP',
      pushToken: overrides.pushToken ?? 'tok-1',
      language: 'en-US',
    }) as unknown as UserDeviceEntity;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UserDeviceReader, { provide: UserDeviceRepository, useValue: { findByUserId: jest.fn() } }],
    }).compile();

    reader = moduleRef.get(UserDeviceReader);
    repo = moduleRef.get(UserDeviceRepository);
  });

  it('findByUserId 가 entity 를 GetUserDeviceResult 로 변환 (user.id → userId 평탄화)', async () => {
    repo.findByUserId.mockResolvedValue([buildEntity({ id: 1, userId: 5 }), buildEntity({ id: 2, userId: 5, pushToken: 'tok-2' })]);

    const result = await reader.findByUserId(5);

    expect(result).toHaveLength(2);
    expect(result[0]!.userId).toBe(5);
    expect(result[0]!.pushToken).toBe('tok-1');
    expect(result[1]!.pushToken).toBe('tok-2');
  });

  it('findByUserIds: 빈 배열이면 repo 호출 없이 빈 결과', async () => {
    const result = await reader.findByUserIds([]);

    expect(result).toEqual([]);
    expect(repo.findByUserId).not.toHaveBeenCalled();
  });

  it('findByUserIds: 각 userId 에 대해 repo 호출 후 flat 결과', async () => {
    repo.findByUserId.mockImplementation(async (userId) => [buildEntity({ id: userId, userId, pushToken: `tok-${userId}` })]);

    const result = await reader.findByUserIds([1, 2, 3]);

    expect(result).toHaveLength(3);
    expect(result.map((d) => d.pushToken)).toEqual(['tok-1', 'tok-2', 'tok-3']);
  });
});
