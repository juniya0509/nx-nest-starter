import { Test, TestingModule } from '@nestjs/testing';

import { AdminPermissionEntity } from '../../database/mysql/entity/admin-permission/AdminPermission.entity';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermission } from '../../enum/AdminPermission.enum';

import { AdminPermissionCatalogSyncer } from './AdminPermissionCatalog.syncer';

describe('AdminPermissionCatalogSyncer', () => {
  let syncer: AdminPermissionCatalogSyncer;
  let adminPermissionRepository: jest.Mocked<Pick<AdminPermissionRepository, 'findAll' | 'insertIgnoreMany'>>;
  let consoleInfoSpy: jest.SpyInstance;

  const buildPermission = (overrides: Partial<AdminPermissionEntity>): AdminPermissionEntity =>
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
        AdminPermissionCatalogSyncer,
        { provide: AdminPermissionRepository, useValue: { findAll: jest.fn(), insertIgnoreMany: jest.fn() } },
      ],
    }).compile();

    syncer = moduleRef.get(AdminPermissionCatalogSyncer);
    adminPermissionRepository = moduleRef.get(AdminPermissionRepository);
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  describe('syncFromEnum', () => {
    it('catalog 가 비어있으면 enum 의 모든 권한을 insert 한다', async () => {
      adminPermissionRepository.findAll.mockResolvedValue([]);
      adminPermissionRepository.insertIgnoreMany.mockResolvedValue(undefined);

      await syncer.syncFromEnum();

      expect(adminPermissionRepository.insertIgnoreMany).toHaveBeenCalledTimes(1);
      const inserted = adminPermissionRepository.insertIgnoreMany.mock.calls[0][0];
      expect(inserted).toHaveLength(AdminPermission.values().length);
      expect(inserted.map((row) => row.code).sort()).toEqual(
        AdminPermission.values()
          .map((permission) => permission.code)
          .sort(),
      );
    });

    it('일부만 존재하면 누락된 enum 권한만 insert 한다', async () => {
      adminPermissionRepository.findAll.mockResolvedValue([
        buildPermission({ code: AdminPermission.USER_LIST.code }),
        buildPermission({ code: AdminPermission.USER_READ.code }),
      ]);
      adminPermissionRepository.insertIgnoreMany.mockResolvedValue(undefined);

      await syncer.syncFromEnum();

      const inserted = adminPermissionRepository.insertIgnoreMany.mock.calls[0][0];
      const insertedCodes = inserted.map((row) => row.code);

      expect(insertedCodes).not.toContain(AdminPermission.USER_LIST.code);
      expect(insertedCodes).not.toContain(AdminPermission.USER_READ.code);
      expect(insertedCodes).toContain(AdminPermission.ADMIN_ACCOUNT_MANAGE.code);
      expect(inserted).toHaveLength(AdminPermission.values().length - 2);
    });

    it('insert 데이터에 enum 의 group/description 이 그대로 매핑된다', async () => {
      adminPermissionRepository.findAll.mockResolvedValue([]);
      adminPermissionRepository.insertIgnoreMany.mockResolvedValue(undefined);

      await syncer.syncFromEnum();

      const inserted = adminPermissionRepository.insertIgnoreMany.mock.calls[0][0];
      const userListRow = inserted.find((row) => row.code === AdminPermission.USER_LIST.code);

      expect(userListRow).toEqual({
        code: AdminPermission.USER_LIST.code,
        groupCode: AdminPermission.USER_LIST.group,
        description: AdminPermission.USER_LIST.description,
      });
    });

    it('모든 enum 권한이 이미 존재하면 insert 호출 없음 (early return)', async () => {
      adminPermissionRepository.findAll.mockResolvedValue(
        AdminPermission.values().map((permission) => buildPermission({ code: permission.code })),
      );

      await syncer.syncFromEnum();

      expect(adminPermissionRepository.insertIgnoreMany).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('insert 후 console.info 로 동기화 개수 로그', async () => {
      adminPermissionRepository.findAll.mockResolvedValue([]);
      adminPermissionRepository.insertIgnoreMany.mockResolvedValue(undefined);

      await syncer.syncFromEnum();

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining(`Synced ${AdminPermission.values().length} admin permission`));
    });
  });
});
