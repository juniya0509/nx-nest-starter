import { Test, TestingModule } from '@nestjs/testing';

import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';

import { AdminAccountPresetUpdater } from './AdminAccountPreset.updater';

describe('AdminAccountPresetUpdater', () => {
  let updater: AdminAccountPresetUpdater;
  let repository: jest.Mocked<Pick<AdminAccountPresetRepository, 'replacePresets'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AdminAccountPresetUpdater, { provide: AdminAccountPresetRepository, useValue: { replacePresets: jest.fn() } }],
    }).compile();

    updater = moduleRef.get(AdminAccountPresetUpdater);
    repository = moduleRef.get(AdminAccountPresetRepository);
  });

  it('repo.replacePresets 위임', async () => {
    repository.replacePresets.mockResolvedValue(undefined);

    await updater.replacePresets(7, [100, 200]);

    expect(repository.replacePresets).toHaveBeenCalledWith(7, [100, 200]);
  });
});
