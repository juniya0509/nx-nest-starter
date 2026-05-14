import { Test, TestingModule } from '@nestjs/testing';

import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminPermissionReader } from '../admin-permission/AdminPermission.reader';

import { AdminPermissionPresetReader } from './AdminPermissionPreset.reader';
import { AdminPermissionPresetUpdater } from './AdminPermissionPreset.updater';
import { AdminUpdatePermissionPresetData } from './data/AdminUpdatePermissionPresetData';

describe('AdminPermissionPresetUpdater', () => {
  let updater: AdminPermissionPresetUpdater;
  let presetRepository: jest.Mocked<Pick<AdminPermissionPresetRepository, 'updatePreset'>>;
  let presetItemRepository: jest.Mocked<Pick<AdminPermissionPresetItemRepository, 'replaceItems'>>;
  let presetReader: jest.Mocked<Pick<AdminPermissionPresetReader, 'assertExistById'>>;
  let permissionReader: jest.Mocked<Pick<AdminPermissionReader, 'findIdsByCodes'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPermissionPresetUpdater,
        { provide: AdminPermissionPresetRepository, useValue: { updatePreset: jest.fn() } },
        { provide: AdminPermissionPresetItemRepository, useValue: { replaceItems: jest.fn() } },
        { provide: AdminPermissionPresetReader, useValue: { assertExistById: jest.fn() } },
        { provide: AdminPermissionReader, useValue: { findIdsByCodes: jest.fn() } },
      ],
    }).compile();

    updater = moduleRef.get(AdminPermissionPresetUpdater);
    presetRepository = moduleRef.get(AdminPermissionPresetRepository);
    presetItemRepository = moduleRef.get(AdminPermissionPresetItemRepository);
    presetReader = moduleRef.get(AdminPermissionPresetReader);
    permissionReader = moduleRef.get(AdminPermissionReader);
  });

  it('정상: 존재 검증 → 메타 업데이트 → 권한 교체', async () => {
    const data = AdminUpdatePermissionPresetData.fromReqDto({
      name: '새이름',
      description: '설명',
      permissionCodes: ['USER_LIST'],
    });
    presetReader.assertExistById.mockResolvedValue(undefined);
    presetRepository.updatePreset.mockResolvedValue(undefined);
    permissionReader.findIdsByCodes.mockResolvedValue([10]);
    presetItemRepository.replaceItems.mockResolvedValue(undefined);

    await updater.update(7, data);

    expect(presetReader.assertExistById).toHaveBeenCalledWith(7);
    expect(presetRepository.updatePreset).toHaveBeenCalledWith(7, { name: '새이름', description: '설명' });
    expect(permissionReader.findIdsByCodes).toHaveBeenCalledWith(['USER_LIST']);
    expect(presetItemRepository.replaceItems).toHaveBeenCalledWith(7, [10]);
  });

  it('존재 검증 실패 시 후속 호출 없음', async () => {
    const data = AdminUpdatePermissionPresetData.fromReqDto({ name: 'n', description: null, permissionCodes: [] });
    presetReader.assertExistById.mockRejectedValue(new Error('not found'));

    await expect(updater.update(999, data)).rejects.toThrow();
    expect(presetRepository.updatePreset).not.toHaveBeenCalled();
    expect(presetItemRepository.replaceItems).not.toHaveBeenCalled();
  });

  it('빈 권한 코드는 빈 배열로 교체', async () => {
    const data = AdminUpdatePermissionPresetData.fromReqDto({ name: 'n', description: null, permissionCodes: [] });
    presetReader.assertExistById.mockResolvedValue(undefined);
    presetRepository.updatePreset.mockResolvedValue(undefined);
    permissionReader.findIdsByCodes.mockResolvedValue([]);
    presetItemRepository.replaceItems.mockResolvedValue(undefined);

    await updater.update(7, data);

    expect(presetItemRepository.replaceItems).toHaveBeenCalledWith(7, []);
  });
});
