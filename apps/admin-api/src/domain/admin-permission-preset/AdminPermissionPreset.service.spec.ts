import { Test, TestingModule } from '@nestjs/testing';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => {},
  initializeTransactionalContext: () => {},
}));

import { AdminPermissionPresetCreator } from './AdminPermissionPreset.creator';
import { AdminPermissionPresetReader } from './AdminPermissionPreset.reader';
import { AdminPermissionPresetRemover } from './AdminPermissionPreset.remover';
import { AdminPermissionPresetService } from './AdminPermissionPreset.service';
import { AdminPermissionPresetUpdater } from './AdminPermissionPreset.updater';
import { AdminCreatePermissionPresetData } from './data/AdminCreatePermissionPresetData';
import { AdminUpdatePermissionPresetData } from './data/AdminUpdatePermissionPresetData';
import { AdminGetPermissionPresetResult } from './result/AdminGetPermissionPresetResult';

describe('AdminPermissionPresetService', () => {
  let service: AdminPermissionPresetService;
  let reader: jest.Mocked<Pick<AdminPermissionPresetReader, 'findAll' | 'getByIdOrThrow'>>;
  let creator: jest.Mocked<Pick<AdminPermissionPresetCreator, 'create'>>;
  let updater: jest.Mocked<Pick<AdminPermissionPresetUpdater, 'update'>>;
  let remover: jest.Mocked<Pick<AdminPermissionPresetRemover, 'softDeleteById'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPermissionPresetService,
        { provide: AdminPermissionPresetReader, useValue: { findAll: jest.fn(), getByIdOrThrow: jest.fn() } },
        { provide: AdminPermissionPresetCreator, useValue: { create: jest.fn() } },
        { provide: AdminPermissionPresetUpdater, useValue: { update: jest.fn() } },
        { provide: AdminPermissionPresetRemover, useValue: { softDeleteById: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AdminPermissionPresetService);
    reader = moduleRef.get(AdminPermissionPresetReader);
    creator = moduleRef.get(AdminPermissionPresetCreator);
    updater = moduleRef.get(AdminPermissionPresetUpdater);
    remover = moduleRef.get(AdminPermissionPresetRemover);
  });

  it('createPreset 위임 + id 반환', async () => {
    const data = AdminCreatePermissionPresetData.fromReqDto({ code: 'P1', name: 'preset', description: null, permissionCodes: [] });
    creator.create.mockResolvedValue(42);

    expect(await service.createPreset(data)).toBe(42);
    expect(creator.create).toHaveBeenCalledWith(data);
  });

  it('getPresetList 위임', async () => {
    reader.findAll.mockResolvedValue([]);
    expect(await service.getPresetList()).toEqual([]);
    expect(reader.findAll).toHaveBeenCalled();
  });

  it('getPreset 위임', async () => {
    const expected = {} as AdminGetPermissionPresetResult;
    reader.getByIdOrThrow.mockResolvedValue(expected);

    expect(await service.getPreset(7)).toBe(expected);
    expect(reader.getByIdOrThrow).toHaveBeenCalledWith(7);
  });

  it('updatePreset 위임', async () => {
    const data = AdminUpdatePermissionPresetData.fromReqDto({ name: 'n', description: null, permissionCodes: [] });
    updater.update.mockResolvedValue(undefined);

    await service.updatePreset(7, data);

    expect(updater.update).toHaveBeenCalledWith(7, data);
  });

  it('deletePreset 위임', async () => {
    remover.softDeleteById.mockResolvedValue(undefined);

    await service.deletePreset(7);

    expect(remover.softDeleteById).toHaveBeenCalledWith(7);
  });
});
