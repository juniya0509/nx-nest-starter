import { Test, TestingModule } from '@nestjs/testing';

import { AdminPermissionPresetEntity } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.entity';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminPermissionReader } from '../admin-permission/AdminPermission.reader';

import { AdminPermissionPresetCreator } from './AdminPermissionPreset.creator';
import { AdminPermissionPresetReader } from './AdminPermissionPreset.reader';
import { AdminCreatePermissionPresetData } from './data/AdminCreatePermissionPresetData';

describe('AdminPermissionPresetCreator', () => {
  let creator: AdminPermissionPresetCreator;
  let presetRepository: jest.Mocked<Pick<AdminPermissionPresetRepository, 'createPreset'>>;
  let presetItemRepository: jest.Mocked<Pick<AdminPermissionPresetItemRepository, 'replaceItems'>>;
  let presetReader: jest.Mocked<Pick<AdminPermissionPresetReader, 'assertNotExistByCode'>>;
  let permissionReader: jest.Mocked<Pick<AdminPermissionReader, 'findIdsByCodes'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPermissionPresetCreator,
        { provide: AdminPermissionPresetRepository, useValue: { createPreset: jest.fn() } },
        { provide: AdminPermissionPresetItemRepository, useValue: { replaceItems: jest.fn() } },
        { provide: AdminPermissionPresetReader, useValue: { assertNotExistByCode: jest.fn() } },
        { provide: AdminPermissionReader, useValue: { findIdsByCodes: jest.fn() } },
      ],
    }).compile();

    creator = moduleRef.get(AdminPermissionPresetCreator);
    presetRepository = moduleRef.get(AdminPermissionPresetRepository);
    presetItemRepository = moduleRef.get(AdminPermissionPresetItemRepository);
    presetReader = moduleRef.get(AdminPermissionPresetReader);
    permissionReader = moduleRef.get(AdminPermissionReader);
  });

  it('정상: code 중복 검증 → 프리셋 생성 → 권한 매핑 → id 반환', async () => {
    const data = AdminCreatePermissionPresetData.fromReqDto({
      code: 'P1',
      name: '프리셋',
      description: null,
      permissionCodes: ['USER_LIST', 'USER_READ'],
    });
    presetReader.assertNotExistByCode.mockResolvedValue(undefined);
    presetRepository.createPreset.mockResolvedValue({ id: 100 } as unknown as AdminPermissionPresetEntity);
    permissionReader.findIdsByCodes.mockResolvedValue([10, 20]);
    presetItemRepository.replaceItems.mockResolvedValue(undefined);

    const result = await creator.create(data);

    expect(result).toBe(100);
    expect(presetReader.assertNotExistByCode).toHaveBeenCalledWith('P1');
    expect(presetRepository.createPreset).toHaveBeenCalledWith({ code: 'P1', name: '프리셋', description: null });
    expect(permissionReader.findIdsByCodes).toHaveBeenCalledWith(['USER_LIST', 'USER_READ']);
    expect(presetItemRepository.replaceItems).toHaveBeenCalledWith(100, [10, 20]);
  });

  it('permissionCodes 가 비어있으면 replaceItems 호출 없음', async () => {
    const data = AdminCreatePermissionPresetData.fromReqDto({ code: 'P1', name: 'p', description: null, permissionCodes: [] });
    presetReader.assertNotExistByCode.mockResolvedValue(undefined);
    presetRepository.createPreset.mockResolvedValue({ id: 100 } as unknown as AdminPermissionPresetEntity);
    permissionReader.findIdsByCodes.mockResolvedValue([]);

    await creator.create(data);

    expect(presetItemRepository.replaceItems).not.toHaveBeenCalled();
  });

  it('code 중복 시 후속 호출 없음', async () => {
    const data = AdminCreatePermissionPresetData.fromReqDto({ code: 'DUP', name: 'p', description: null, permissionCodes: [] });
    presetReader.assertNotExistByCode.mockRejectedValue(new Error('duplicate'));

    await expect(creator.create(data)).rejects.toThrow();
    expect(presetRepository.createPreset).not.toHaveBeenCalled();
  });
});
