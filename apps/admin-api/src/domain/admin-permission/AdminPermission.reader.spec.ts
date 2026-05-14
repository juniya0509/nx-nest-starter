import { Test, TestingModule } from '@nestjs/testing';

import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionEntity } from '../../database/mysql/entity/admin-permission/AdminPermission.entity';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';

import { AdminPermissionReader } from './AdminPermission.reader';

describe('AdminPermissionReader', () => {
  let reader: AdminPermissionReader;
  let adminPermissionRepository: jest.Mocked<Pick<AdminPermissionRepository, 'findAll' | 'findByCodes' | 'findBy'>>;
  let adminAccountPermissionRepository: jest.Mocked<Pick<AdminAccountPermissionRepository, 'findPermissionIdsByAdminAccountId'>>;
  let adminAccountPresetRepository: jest.Mocked<Pick<AdminAccountPresetRepository, 'findPresetIdsByAdminAccountId'>>;
  let adminPermissionPresetItemRepository: jest.Mocked<Pick<AdminPermissionPresetItemRepository, 'findPermissionIdsByPresetIds'>>;

  const buildPermission = (overrides: Partial<AdminPermissionEntity> = {}): AdminPermissionEntity =>
    ({
      id: 1,
      code: 'USER_LIST',
      groupCode: 'user',
      description: '유저 목록 조회',
      ...overrides,
    }) as unknown as AdminPermissionEntity;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPermissionReader,
        {
          provide: AdminPermissionRepository,
          useValue: { findAll: jest.fn(), findByCodes: jest.fn(), findBy: jest.fn() },
        },
        {
          provide: AdminAccountPermissionRepository,
          useValue: { findPermissionIdsByAdminAccountId: jest.fn() },
        },
        {
          provide: AdminAccountPresetRepository,
          useValue: { findPresetIdsByAdminAccountId: jest.fn() },
        },
        {
          provide: AdminPermissionPresetItemRepository,
          useValue: { findPermissionIdsByPresetIds: jest.fn() },
        },
      ],
    }).compile();

    reader = moduleRef.get(AdminPermissionReader);
    adminPermissionRepository = moduleRef.get(AdminPermissionRepository);
    adminAccountPermissionRepository = moduleRef.get(AdminAccountPermissionRepository);
    adminAccountPresetRepository = moduleRef.get(AdminAccountPresetRepository);
    adminPermissionPresetItemRepository = moduleRef.get(AdminPermissionPresetItemRepository);
  });

  describe('findAllFromCatalog', () => {
    it('repo 결과를 AdminPermissionResult 로 매핑한다', async () => {
      adminPermissionRepository.findAll.mockResolvedValue([
        buildPermission({ id: 1, code: 'USER_LIST', groupCode: 'user', description: '유저 목록' }),
        buildPermission({ id: 2, code: 'ADMIN_ACCOUNT_MANAGE', groupCode: 'admin-management', description: '관리자 관리' }),
      ]);

      const result = await reader.findAllFromCatalog();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 1, code: 'USER_LIST', groupCode: 'user', description: '유저 목록' });
      expect(result[1]).toMatchObject({ id: 2, code: 'ADMIN_ACCOUNT_MANAGE', groupCode: 'admin-management', description: '관리자 관리' });
    });

    it('빈 결과는 빈 배열', async () => {
      adminPermissionRepository.findAll.mockResolvedValue([]);

      const result = await reader.findAllFromCatalog();

      expect(result).toEqual([]);
    });
  });

  describe('findIdsByCodes', () => {
    it('빈 codes 면 repo 호출 없이 빈 배열 반환 (short-circuit)', async () => {
      const result = await reader.findIdsByCodes([]);

      expect(result).toEqual([]);
      expect(adminPermissionRepository.findByCodes).not.toHaveBeenCalled();
    });

    it('codes 와 매칭되는 권한들의 id 배열을 반환', async () => {
      adminPermissionRepository.findByCodes.mockResolvedValue([
        buildPermission({ id: 10, code: 'USER_LIST' }),
        buildPermission({ id: 20, code: 'USER_READ' }),
      ]);

      const result = await reader.findIdsByCodes(['USER_LIST', 'USER_READ']);

      expect(result).toEqual([10, 20]);
      expect(adminPermissionRepository.findByCodes).toHaveBeenCalledWith(['USER_LIST', 'USER_READ']);
    });
  });

  describe('findEffectivePermissionCodesByAdminAccountId', () => {
    it('직접 권한만 있을 때 직접 권한 코드 Set 반환', async () => {
      adminAccountPermissionRepository.findPermissionIdsByAdminAccountId.mockResolvedValue([1, 2]);
      adminAccountPresetRepository.findPresetIdsByAdminAccountId.mockResolvedValue([]);
      adminPermissionPresetItemRepository.findPermissionIdsByPresetIds.mockResolvedValue([]);
      adminPermissionRepository.findBy.mockResolvedValue([
        buildPermission({ id: 1, code: 'USER_LIST' }),
        buildPermission({ id: 2, code: 'USER_READ' }),
      ]);

      const result = await reader.findEffectivePermissionCodesByAdminAccountId(10);

      expect(result).toEqual(new Set(['USER_LIST', 'USER_READ']));
    });

    it('프리셋 권한도 합산하여 중복 없는 Set 반환', async () => {
      adminAccountPermissionRepository.findPermissionIdsByAdminAccountId.mockResolvedValue([1, 2]);
      adminAccountPresetRepository.findPresetIdsByAdminAccountId.mockResolvedValue([100]);
      adminPermissionPresetItemRepository.findPermissionIdsByPresetIds.mockResolvedValue([2, 3]);
      adminPermissionRepository.findBy.mockResolvedValue([
        buildPermission({ id: 1, code: 'USER_LIST' }),
        buildPermission({ id: 2, code: 'USER_READ' }),
        buildPermission({ id: 3, code: 'USER_SUSPEND' }),
      ]);

      const result = await reader.findEffectivePermissionCodesByAdminAccountId(10);

      expect(result).toEqual(new Set(['USER_LIST', 'USER_READ', 'USER_SUSPEND']));
    });

    it('직접/프리셋 권한 모두 없으면 빈 Set + repo.findBy 미호출', async () => {
      adminAccountPermissionRepository.findPermissionIdsByAdminAccountId.mockResolvedValue([]);
      adminAccountPresetRepository.findPresetIdsByAdminAccountId.mockResolvedValue([]);
      adminPermissionPresetItemRepository.findPermissionIdsByPresetIds.mockResolvedValue([]);

      const result = await reader.findEffectivePermissionCodesByAdminAccountId(10);

      expect(result).toEqual(new Set());
      expect(adminPermissionRepository.findBy).not.toHaveBeenCalled();
    });
  });
});
