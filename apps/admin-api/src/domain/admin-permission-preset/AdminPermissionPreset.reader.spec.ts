import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AdminPermissionEntity } from '../../database/mysql/entity/admin-permission/AdminPermission.entity';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetEntity } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.entity';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';

import { AdminPermissionPresetReader } from './AdminPermissionPreset.reader';

describe('AdminPermissionPresetReader', () => {
  let reader: AdminPermissionPresetReader;
  let presetRepository: jest.Mocked<Pick<AdminPermissionPresetRepository, 'findAll' | 'findByCode' | 'findById' | 'findManyByIds'>>;
  let presetItemRepository: jest.Mocked<Pick<AdminPermissionPresetItemRepository, 'countByPresetIds' | 'findPermissionIdsByPresetId'>>;
  let permissionRepository: jest.Mocked<Pick<AdminPermissionRepository, 'findManyByIds'>>;

  const buildPreset = (overrides: Partial<AdminPermissionPresetEntity> = {}): AdminPermissionPresetEntity =>
    ({
      id: 1,
      code: 'PRESET_A',
      name: 'Preset A',
      description: null,
      createdAt: new Date('2026-01-01'),
      ...overrides,
    }) as unknown as AdminPermissionPresetEntity;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPermissionPresetReader,
        {
          provide: AdminPermissionPresetRepository,
          useValue: { findAll: jest.fn(), findByCode: jest.fn(), findById: jest.fn(), findManyByIds: jest.fn() },
        },
        {
          provide: AdminPermissionPresetItemRepository,
          useValue: { countByPresetIds: jest.fn(), findPermissionIdsByPresetId: jest.fn() },
        },
        { provide: AdminPermissionRepository, useValue: { findManyByIds: jest.fn() } },
      ],
    }).compile();

    reader = moduleRef.get(AdminPermissionPresetReader);
    presetRepository = moduleRef.get(AdminPermissionPresetRepository);
    presetItemRepository = moduleRef.get(AdminPermissionPresetItemRepository);
    permissionRepository = moduleRef.get(AdminPermissionRepository);
  });

  describe('findAll', () => {
    it('빈 결과', async () => {
      presetRepository.findAll.mockResolvedValue([]);

      expect(await reader.findAll()).toEqual([]);
      expect(presetItemRepository.countByPresetIds).not.toHaveBeenCalled();
    });

    it('각 프리셋의 permissionCount 매핑', async () => {
      presetRepository.findAll.mockResolvedValue([buildPreset({ id: 1 }), buildPreset({ id: 2 })]);
      presetItemRepository.countByPresetIds.mockResolvedValue(new Map([[1, 3]]));

      const result = await reader.findAll();

      expect(result[0].permissionCount).toBe(3);
      expect(result[1].permissionCount).toBe(0);
    });
  });

  describe('assertNotExistByCode', () => {
    it('없으면 통과', async () => {
      presetRepository.findByCode.mockResolvedValue(null);

      await expect(reader.assertNotExistByCode('CODE_X')).resolves.toBeUndefined();
    });

    it('이미 있으면 PERMISSION_PRESET_CODE_DUPLICATE ConflictException', async () => {
      presetRepository.findByCode.mockResolvedValue(buildPreset());

      await expect(reader.assertNotExistByCode('CODE_X')).rejects.toMatchObject({
        constructor: ConflictException,
        response: { errorType: { code: 'PERMISSION_PRESET_CODE_DUPLICATE' } },
      });
    });
  });

  describe('assertExistById', () => {
    it('있으면 통과', async () => {
      presetRepository.findById.mockResolvedValue(buildPreset());

      await expect(reader.assertExistById(1)).resolves.toBeUndefined();
    });

    it('없으면 PERMISSION_PRESET_NOT_FOUND NotFoundException', async () => {
      presetRepository.findById.mockResolvedValue(null);

      await expect(reader.assertExistById(999)).rejects.toMatchObject({
        constructor: NotFoundException,
        response: { errorType: { code: 'PERMISSION_PRESET_NOT_FOUND' } },
      });
    });
  });

  describe('assertExistByIds', () => {
    it('빈 배열은 short-circuit', async () => {
      await expect(reader.assertExistByIds([])).resolves.toBeUndefined();
      expect(presetRepository.findManyByIds).not.toHaveBeenCalled();
    });

    it('전부 존재하면 통과', async () => {
      presetRepository.findManyByIds.mockResolvedValue([buildPreset({ id: 1 }), buildPreset({ id: 2 })]);

      await expect(reader.assertExistByIds([1, 2])).resolves.toBeUndefined();
    });

    it('일부 누락이면 INVALID_PRESET_ID BadRequestException', async () => {
      presetRepository.findManyByIds.mockResolvedValue([buildPreset({ id: 1 })]);

      await expect(reader.assertExistByIds([1, 2])).rejects.toMatchObject({
        constructor: BadRequestException,
        response: { errorType: { code: 'INVALID_PRESET_ID' } },
      });
    });
  });

  describe('getByIdOrThrow', () => {
    it('정상: 권한 코드 함께 반환', async () => {
      presetRepository.findById.mockResolvedValue(buildPreset({ id: 1, code: 'P1', name: 'P1' }));
      presetItemRepository.findPermissionIdsByPresetId.mockResolvedValue([10, 20]);
      permissionRepository.findManyByIds.mockResolvedValue([
        { id: 10, code: 'USER_LIST' },
        { id: 20, code: 'USER_READ' },
      ] as unknown as AdminPermissionEntity[]);

      const result = await reader.getByIdOrThrow(1);

      expect(result.code).toBe('P1');
      expect(result.permissionCodes).toEqual(['USER_LIST', 'USER_READ']);
    });

    it('권한이 없으면 빈 코드 배열 + permission repo 미호출', async () => {
      presetRepository.findById.mockResolvedValue(buildPreset());
      presetItemRepository.findPermissionIdsByPresetId.mockResolvedValue([]);

      const result = await reader.getByIdOrThrow(1);

      expect(result.permissionCodes).toEqual([]);
      expect(permissionRepository.findManyByIds).not.toHaveBeenCalled();
    });

    it('없으면 PERMISSION_PRESET_NOT_FOUND NotFoundException', async () => {
      presetRepository.findById.mockResolvedValue(null);

      await expect(reader.getByIdOrThrow(999)).rejects.toMatchObject({
        constructor: NotFoundException,
        response: { errorType: { code: 'PERMISSION_PRESET_NOT_FOUND' } },
      });
    });
  });
});
