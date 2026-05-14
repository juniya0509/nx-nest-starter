import { Test, TestingModule } from '@nestjs/testing';

import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';
import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';

import { AdminAccountReader } from './AdminAccount.reader';
import { AdminAccountRemover } from './AdminAccount.remover';

describe('AdminAccountRemover', () => {
  let remover: AdminAccountRemover;
  let adminAccountReader: jest.Mocked<Pick<AdminAccountReader, 'assertExistById'>>;
  let adminAccountRepository: jest.Mocked<Pick<AdminAccountRepository, 'softDeleteById'>>;
  let adminAccountPermissionRepository: jest.Mocked<Pick<AdminAccountPermissionRepository, 'deleteByAdminAccountId'>>;
  let adminAccountPresetRepository: jest.Mocked<Pick<AdminAccountPresetRepository, 'deleteByAdminAccountId'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAccountRemover,
        { provide: AdminAccountReader, useValue: { assertExistById: jest.fn() } },
        { provide: AdminAccountRepository, useValue: { softDeleteById: jest.fn() } },
        { provide: AdminAccountPermissionRepository, useValue: { deleteByAdminAccountId: jest.fn() } },
        { provide: AdminAccountPresetRepository, useValue: { deleteByAdminAccountId: jest.fn() } },
      ],
    }).compile();

    remover = moduleRef.get(AdminAccountRemover);
    adminAccountReader = moduleRef.get(AdminAccountReader);
    adminAccountRepository = moduleRef.get(AdminAccountRepository);
    adminAccountPermissionRepository = moduleRef.get(AdminAccountPermissionRepository);
    adminAccountPresetRepository = moduleRef.get(AdminAccountPresetRepository);
  });

  describe('softDeleteById', () => {
    it('존재 검증 후 권한/프리셋/계정 순으로 삭제', async () => {
      adminAccountReader.assertExistById.mockResolvedValue(undefined);
      adminAccountPermissionRepository.deleteByAdminAccountId.mockResolvedValue(undefined);
      adminAccountPresetRepository.deleteByAdminAccountId.mockResolvedValue(undefined);
      adminAccountRepository.softDeleteById.mockResolvedValue(undefined);

      await remover.softDeleteById(7);

      expect(adminAccountReader.assertExistById).toHaveBeenCalledWith(7);
      expect(adminAccountPermissionRepository.deleteByAdminAccountId).toHaveBeenCalledWith(7);
      expect(adminAccountPresetRepository.deleteByAdminAccountId).toHaveBeenCalledWith(7);
      expect(adminAccountRepository.softDeleteById).toHaveBeenCalledWith(7);
    });

    it('존재 검증 실패 시 후속 삭제 없음', async () => {
      adminAccountReader.assertExistById.mockRejectedValue(new Error('not found'));

      await expect(remover.softDeleteById(999)).rejects.toThrow();
      expect(adminAccountPermissionRepository.deleteByAdminAccountId).not.toHaveBeenCalled();
      expect(adminAccountPresetRepository.deleteByAdminAccountId).not.toHaveBeenCalled();
      expect(adminAccountRepository.softDeleteById).not.toHaveBeenCalled();
    });
  });
});
