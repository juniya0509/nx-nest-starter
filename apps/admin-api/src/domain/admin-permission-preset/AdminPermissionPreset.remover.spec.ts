import { Test, TestingModule } from '@nestjs/testing';

import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';

import { AdminPermissionPresetReader } from './AdminPermissionPreset.reader';
import { AdminPermissionPresetRemover } from './AdminPermissionPreset.remover';

describe('AdminPermissionPresetRemover', () => {
  let remover: AdminPermissionPresetRemover;
  let presetRepository: jest.Mocked<Pick<AdminPermissionPresetRepository, 'softDeleteById'>>;
  let presetItemRepository: jest.Mocked<Pick<AdminPermissionPresetItemRepository, 'deleteByPresetId'>>;
  let accountPresetRepository: jest.Mocked<Pick<AdminAccountPresetRepository, 'deleteByPresetId'>>;
  let presetReader: jest.Mocked<Pick<AdminPermissionPresetReader, 'assertExistById'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPermissionPresetRemover,
        { provide: AdminPermissionPresetRepository, useValue: { softDeleteById: jest.fn() } },
        { provide: AdminPermissionPresetItemRepository, useValue: { deleteByPresetId: jest.fn() } },
        { provide: AdminAccountPresetRepository, useValue: { deleteByPresetId: jest.fn() } },
        { provide: AdminPermissionPresetReader, useValue: { assertExistById: jest.fn() } },
      ],
    }).compile();

    remover = moduleRef.get(AdminPermissionPresetRemover);
    presetRepository = moduleRef.get(AdminPermissionPresetRepository);
    presetItemRepository = moduleRef.get(AdminPermissionPresetItemRepository);
    accountPresetRepository = moduleRef.get(AdminAccountPresetRepository);
    presetReader = moduleRef.get(AdminPermissionPresetReader);
  });

  it('정상: 존재 검증 → item / accountPreset / preset 순으로 삭제', async () => {
    presetReader.assertExistById.mockResolvedValue(undefined);
    presetItemRepository.deleteByPresetId.mockResolvedValue(undefined);
    accountPresetRepository.deleteByPresetId.mockResolvedValue(undefined);
    presetRepository.softDeleteById.mockResolvedValue(undefined);

    await remover.softDeleteById(7);

    expect(presetReader.assertExistById).toHaveBeenCalledWith(7);
    expect(presetItemRepository.deleteByPresetId).toHaveBeenCalledWith(7);
    expect(accountPresetRepository.deleteByPresetId).toHaveBeenCalledWith(7);
    expect(presetRepository.softDeleteById).toHaveBeenCalledWith(7);
  });

  it('존재 검증 실패 시 후속 삭제 없음', async () => {
    presetReader.assertExistById.mockRejectedValue(new Error('not found'));

    await expect(remover.softDeleteById(999)).rejects.toThrow();
    expect(presetItemRepository.deleteByPresetId).not.toHaveBeenCalled();
    expect(accountPresetRepository.deleteByPresetId).not.toHaveBeenCalled();
    expect(presetRepository.softDeleteById).not.toHaveBeenCalled();
  });
});
