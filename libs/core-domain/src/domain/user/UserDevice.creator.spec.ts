import { Test, TestingModule } from '@nestjs/testing';

import { UserDeviceEntity } from '@libs/core-database/src/mysql/entity/user/UserDevice.entity';
import { UserDeviceRepository } from '@libs/core-database/src/mysql/entity/user/UserDevice.repository';

import { UpsertUserDeviceData } from './data/UpsertUserDeviceData';
import { UserDeviceCreator } from './UserDevice.creator';

describe('UserDeviceCreator', () => {
  let creator: UserDeviceCreator;
  let repo: jest.Mocked<Pick<UserDeviceRepository, 'findByPushToken' | 'createDevice' | 'save'>>;

  const buildData = (overrides: Partial<{ userId: number; pushToken: string }> = {}) =>
    UpsertUserDeviceData.of({
      userId: overrides.userId ?? 1,
      deviceType: 'IOS_APP',
      pushToken: overrides.pushToken ?? 'tok-1',
      language: 'en-US',
    });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserDeviceCreator,
        { provide: UserDeviceRepository, useValue: { findByPushToken: jest.fn(), createDevice: jest.fn(), save: jest.fn() } },
      ],
    }).compile();

    creator = moduleRef.get(UserDeviceCreator);
    repo = moduleRef.get(UserDeviceRepository);
  });

  it('동일 pushToken 미존재: createDevice 호출 (insert)', async () => {
    repo.findByPushToken.mockResolvedValue(null);

    await creator.upsertByPushToken(buildData());

    expect(repo.createDevice).toHaveBeenCalledWith({
      userId: 1,
      deviceType: 'IOS_APP',
      pushToken: 'tok-1',
      language: 'en-US',
    });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('동일 pushToken 존재: 기존 row 의 user/lang/type 을 갱신 후 save (다른 user 로 양도된 device 시나리오)', async () => {
    const existing = {
      id: 99,
      user: { id: 7 },
      deviceType: 'ANDROID_APP',
      pushToken: 'tok-1',
      language: 'ja',
    } as unknown as UserDeviceEntity;
    repo.findByPushToken.mockResolvedValue(existing);

    await creator.upsertByPushToken(buildData({ userId: 1 }));

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 99, user: { id: 1 }, deviceType: 'IOS_APP', language: 'en-US' }),
    );
    expect(repo.createDevice).not.toHaveBeenCalled();
  });
});
