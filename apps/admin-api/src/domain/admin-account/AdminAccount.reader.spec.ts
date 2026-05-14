import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AdminAccountEntity } from '../../database/mysql/entity/admin-account/AdminAccount.entity';
import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';
import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminAccountStatusUnion } from '../../enum/AdminAccountStatus.enum';

import { AdminAccountReader } from './AdminAccount.reader';
import { AdminGetAccountListData } from './data/AdminGetAccountListData';

describe('AdminAccountReader', () => {
  let reader: AdminAccountReader;
  let adminAccountRepository: jest.Mocked<Pick<AdminAccountRepository, 'findById' | 'findByUserId' | 'findListWithPagination'>>;
  let adminPermissionRepository: jest.Mocked<Pick<AdminPermissionRepository, 'findManyByIds'>>;
  let adminPermissionPresetRepository: jest.Mocked<Pick<AdminPermissionPresetRepository, 'findManyByIds'>>;
  let adminAccountPermissionRepository: jest.Mocked<Pick<AdminAccountPermissionRepository, 'findPermissionIdsByAdminAccountId'>>;
  let adminAccountPresetRepository: jest.Mocked<Pick<AdminAccountPresetRepository, 'findPresetIdsByAdminAccountId'>>;
  let adminPermissionPresetItemRepository: jest.Mocked<Pick<AdminPermissionPresetItemRepository, 'findPermissionIdsByPresetIds'>>;

  const buildAdminAccount = (
    overrides: Partial<{ id: number; status: AdminAccountStatusUnion; memo: string | null; userId: number; userEmail: string }> = {},
  ): AdminAccountEntity =>
    ({
      id: overrides.id ?? 10,
      status: overrides.status ?? 'ACTIVE',
      memo: overrides.memo ?? null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      user: {
        id: overrides.userId ?? 1,
        email: overrides.userEmail ?? 'admin@test.local',
        firstname: 'Admin',
        lastname: 'User',
        avatarUrl: null,
      },
    }) as unknown as AdminAccountEntity;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAccountReader,
        {
          provide: AdminAccountRepository,
          useValue: { findById: jest.fn(), findByUserId: jest.fn(), findListWithPagination: jest.fn() },
        },
        { provide: AdminPermissionRepository, useValue: { findManyByIds: jest.fn() } },
        { provide: AdminPermissionPresetRepository, useValue: { findManyByIds: jest.fn() } },
        { provide: AdminAccountPermissionRepository, useValue: { findPermissionIdsByAdminAccountId: jest.fn() } },
        { provide: AdminAccountPresetRepository, useValue: { findPresetIdsByAdminAccountId: jest.fn() } },
        { provide: AdminPermissionPresetItemRepository, useValue: { findPermissionIdsByPresetIds: jest.fn() } },
      ],
    }).compile();

    reader = moduleRef.get(AdminAccountReader);
    adminAccountRepository = moduleRef.get(AdminAccountRepository);
    adminPermissionRepository = moduleRef.get(AdminPermissionRepository);
    adminPermissionPresetRepository = moduleRef.get(AdminPermissionPresetRepository);
    adminAccountPermissionRepository = moduleRef.get(AdminAccountPermissionRepository);
    adminAccountPresetRepository = moduleRef.get(AdminAccountPresetRepository);
    adminPermissionPresetItemRepository = moduleRef.get(AdminPermissionPresetItemRepository);
  });

  describe('findById', () => {
    it('존재하면 AdminAccountResult 반환', async () => {
      adminAccountRepository.findById.mockResolvedValue(buildAdminAccount({ id: 10, userId: 1 }));

      const result = await reader.findById(10);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(10);
      expect(result?.userId).toBe(1);
      expect(result?.isActive).toBe(true);
    });

    it('없으면 null', async () => {
      adminAccountRepository.findById.mockResolvedValue(null);

      const result = await reader.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('존재하면 AdminAccountResult 반환', async () => {
      adminAccountRepository.findByUserId.mockResolvedValue(buildAdminAccount({ id: 10, userId: 5 }));

      const result = await reader.findByUserId(5);

      expect(result?.userId).toBe(5);
    });

    it('없으면 null', async () => {
      adminAccountRepository.findByUserId.mockResolvedValue(null);

      expect(await reader.findByUserId(999)).toBeNull();
    });
  });

  describe('assertExistById', () => {
    it('존재하면 통과', async () => {
      adminAccountRepository.findById.mockResolvedValue(buildAdminAccount());

      await expect(reader.assertExistById(10)).resolves.toBeUndefined();
    });

    it('없으면 ADMIN_ACCOUNT_NOT_FOUND NotFoundException', async () => {
      adminAccountRepository.findById.mockResolvedValue(null);

      await expect(reader.assertExistById(999)).rejects.toMatchObject({
        constructor: NotFoundException,
        response: { errorType: { code: 'ADMIN_ACCOUNT_NOT_FOUND' } },
      });
    });
  });

  describe('assertNotExistByUserId', () => {
    it('없으면 통과', async () => {
      adminAccountRepository.findByUserId.mockResolvedValue(null);

      await expect(reader.assertNotExistByUserId(1)).resolves.toBeUndefined();
    });

    it('이미 있으면 ADMIN_ACCOUNT_ALREADY_EXISTS ConflictException', async () => {
      adminAccountRepository.findByUserId.mockResolvedValue(buildAdminAccount());

      await expect(reader.assertNotExistByUserId(1)).rejects.toMatchObject({
        constructor: ConflictException,
        response: { errorType: { code: 'ADMIN_ACCOUNT_ALREADY_EXISTS' } },
      });
    });
  });

  describe('getByIdOrThrow', () => {
    it('존재하면 직접/프리셋 권한 합산하여 AdminGetAccountResult 반환', async () => {
      adminAccountRepository.findById.mockResolvedValue(buildAdminAccount({ id: 10, userId: 1, userEmail: 'a@x.com' }));
      adminAccountPermissionRepository.findPermissionIdsByAdminAccountId.mockResolvedValue([1, 2]);
      adminAccountPresetRepository.findPresetIdsByAdminAccountId.mockResolvedValue([100]);
      adminPermissionRepository.findManyByIds.mockImplementation(async (ids: number[]) =>
        ids.map((id) => ({ id, code: `CODE_${id}` }) as unknown as never),
      );
      adminPermissionPresetRepository.findManyByIds.mockResolvedValue([
        { id: 100, code: 'PRESET_A', name: '프리셋 A' },
      ] as unknown as never);
      adminPermissionPresetItemRepository.findPermissionIdsByPresetIds.mockResolvedValue([2, 3]);

      const result = await reader.getByIdOrThrow(10);

      expect(result.id).toBe(10);
      expect(result.userEmail).toBe('a@x.com');
      expect(result.directPermissionCodes).toEqual(['CODE_1', 'CODE_2']);
      expect(result.appliedPresets).toEqual([{ id: 100, code: 'PRESET_A', name: '프리셋 A' }]);
      expect(result.effectivePermissionCodes).toEqual(expect.arrayContaining(['CODE_1', 'CODE_2', 'CODE_3']));
      expect(result.effectivePermissionCodes).toHaveLength(3);
    });

    it('직접/프리셋 권한 없으면 effective 도 빈 배열', async () => {
      adminAccountRepository.findById.mockResolvedValue(buildAdminAccount());
      adminAccountPermissionRepository.findPermissionIdsByAdminAccountId.mockResolvedValue([]);
      adminAccountPresetRepository.findPresetIdsByAdminAccountId.mockResolvedValue([]);
      adminPermissionRepository.findManyByIds.mockResolvedValue([]);
      adminPermissionPresetRepository.findManyByIds.mockResolvedValue([]);
      adminPermissionPresetItemRepository.findPermissionIdsByPresetIds.mockResolvedValue([]);

      const result = await reader.getByIdOrThrow(10);

      expect(result.directPermissionCodes).toEqual([]);
      expect(result.effectivePermissionCodes).toEqual([]);
      expect(result.appliedPresets).toEqual([]);
    });

    it('없으면 ADMIN_ACCOUNT_NOT_FOUND NotFoundException', async () => {
      adminAccountRepository.findById.mockResolvedValue(null);

      await expect(reader.getByIdOrThrow(999)).rejects.toMatchObject({
        constructor: NotFoundException,
        response: { errorType: { code: 'ADMIN_ACCOUNT_NOT_FOUND' } },
      });
    });
  });

  describe('findListWithPagination', () => {
    const buildData = (overrides: Partial<{ page: number; limit: number; keyword: string; status: AdminAccountStatusUnion | null }> = {}) =>
      AdminGetAccountListData.of({ page: 1, limit: 10, keyword: '', status: null, ...overrides });

    it('repo 결과를 ListItemResult 로 매핑 + totalPages 계산', async () => {
      adminAccountRepository.findListWithPagination.mockResolvedValue({
        items: [buildAdminAccount({ id: 1 }), buildAdminAccount({ id: 2 })],
        user: [],
        totalResults: 25,
      });

      const { list, totalPages, totalResults } = await reader.findListWithPagination(buildData({ limit: 10 }));

      expect(list).toHaveLength(2);
      expect(list[0].id).toBe(1);
      expect(totalResults).toBe(25);
      expect(totalPages).toBe(3);
    });

    it('빈 결과는 totalPages=0', async () => {
      adminAccountRepository.findListWithPagination.mockResolvedValue({ items: [], user: [], totalResults: 0 });

      const { list, totalPages } = await reader.findListWithPagination(buildData());

      expect(list).toEqual([]);
      expect(totalPages).toBe(0);
    });

    it('Data 의 인자를 repo 에 그대로 전달', async () => {
      adminAccountRepository.findListWithPagination.mockResolvedValue({ items: [], user: [], totalResults: 0 });

      await reader.findListWithPagination(buildData({ page: 3, limit: 5, keyword: 'k', status: 'SUSPENDED' }));

      expect(adminAccountRepository.findListWithPagination).toHaveBeenCalledWith({
        page: 3,
        limit: 5,
        keyword: 'k',
        status: 'SUSPENDED',
      });
    });
  });
});
