import { Test, TestingModule } from '@nestjs/testing';

import { UserDeviceRepository } from '@libs/core-database/src/mysql/entity/user/UserDevice.repository';

import { UserDeviceRemover } from './UserDevice.remover';

describe('UserDeviceRemover', () => {
  let remover: UserDeviceRemover;
  let repo: jest.Mocked<Pick<UserDeviceRepository, 'removeByPushToken'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UserDeviceRemover, { provide: UserDeviceRepository, useValue: { removeByPushToken: jest.fn() } }],
    }).compile();

    remover = moduleRef.get(UserDeviceRemover);
    repo = moduleRef.get(UserDeviceRepository);
  });

  it('removeByPushToken 위임', async () => {
    await remover.removeByPushToken('tok-1');
    expect(repo.removeByPushToken).toHaveBeenCalledWith('tok-1');
  });
});
