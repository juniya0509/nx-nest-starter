import { Test, TestingModule } from '@nestjs/testing';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => {},
  initializeTransactionalContext: () => {},
}));

import { AdminPermissionReader } from '../admin-permission/AdminPermission.reader';
import { AdminPermissionPresetReader } from '../admin-permission-preset/AdminPermissionPreset.reader';

import { AdminAccountCreator } from './AdminAccount.creator';
import { AdminAccountReader } from './AdminAccount.reader';
import { AdminAccountRemover } from './AdminAccount.remover';
import { AdminAccountService } from './AdminAccount.service';
import { AdminAccountPermissionUpdater } from './AdminAccountPermission.updater';
import { AdminAccountPresetUpdater } from './AdminAccountPreset.updater';
import { AdminCreateAccountData } from './data/AdminCreateAccountData';
import { AdminGetAccountListData } from './data/AdminGetAccountListData';
import { AdminGetAccountResult } from './result/AdminGetAccountResult';

describe('AdminAccountService', () => {
  let service: AdminAccountService;
  let reader: jest.Mocked<Pick<AdminAccountReader, 'findListWithPagination' | 'getByIdOrThrow' | 'assertExistById'>>;
  let creator: jest.Mocked<Pick<AdminAccountCreator, 'create'>>;
  let remover: jest.Mocked<Pick<AdminAccountRemover, 'softDeleteById'>>;
  let permissionUpdater: jest.Mocked<Pick<AdminAccountPermissionUpdater, 'replacePermissions'>>;
  let presetUpdater: jest.Mocked<Pick<AdminAccountPresetUpdater, 'replacePresets'>>;
  let permissionReader: jest.Mocked<Pick<AdminPermissionReader, 'findIdsByCodes'>>;
  let presetReader: jest.Mocked<Pick<AdminPermissionPresetReader, 'assertExistByIds'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAccountService,
        {
          provide: AdminAccountReader,
          useValue: { findListWithPagination: jest.fn(), getByIdOrThrow: jest.fn(), assertExistById: jest.fn() },
        },
        { provide: AdminAccountCreator, useValue: { create: jest.fn() } },
        { provide: AdminAccountRemover, useValue: { softDeleteById: jest.fn() } },
        { provide: AdminAccountPermissionUpdater, useValue: { replacePermissions: jest.fn() } },
        { provide: AdminAccountPresetUpdater, useValue: { replacePresets: jest.fn() } },
        { provide: AdminPermissionReader, useValue: { findIdsByCodes: jest.fn() } },
        { provide: AdminPermissionPresetReader, useValue: { assertExistByIds: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AdminAccountService);
    reader = moduleRef.get(AdminAccountReader);
    creator = moduleRef.get(AdminAccountCreator);
    remover = moduleRef.get(AdminAccountRemover);
    permissionUpdater = moduleRef.get(AdminAccountPermissionUpdater);
    presetUpdater = moduleRef.get(AdminAccountPresetUpdater);
    permissionReader = moduleRef.get(AdminPermissionReader);
    presetReader = moduleRef.get(AdminPermissionPresetReader);
  });

  describe('createAdminAccount', () => {
    it('creator.create 위임 + 생성된 id 반환', async () => {
      const data = AdminCreateAccountData.fromReqDto({ userId: 1, memo: 'memo' });
      creator.create.mockResolvedValue(42);

      const result = await service.createAdminAccount(data);

      expect(result).toBe(42);
      expect(creator.create).toHaveBeenCalledWith(data);
    });
  });

  describe('getAdminAccountList', () => {
    it('reader.findListWithPagination 위임', async () => {
      const data = AdminGetAccountListData.of({ page: 1, limit: 20, keyword: '', status: null });
      const expected = { list: [], totalPages: 0, totalResults: 0 };
      reader.findListWithPagination.mockResolvedValue(expected);

      const result = await service.getAdminAccountList(data);

      expect(result).toBe(expected);
      expect(reader.findListWithPagination).toHaveBeenCalledWith(data);
    });
  });

  describe('getAdminAccount', () => {
    it('reader.getByIdOrThrow 위임', async () => {
      const expected = {} as AdminGetAccountResult;
      reader.getByIdOrThrow.mockResolvedValue(expected);

      const result = await service.getAdminAccount(7);

      expect(result).toBe(expected);
      expect(reader.getByIdOrThrow).toHaveBeenCalledWith(7);
    });
  });

  describe('deleteAdminAccount', () => {
    it('remover.softDeleteById 위임', async () => {
      remover.softDeleteById.mockResolvedValue(undefined);

      await service.deleteAdminAccount(7);

      expect(remover.softDeleteById).toHaveBeenCalledWith(7);
    });
  });

  describe('replaceDirectPermissions', () => {
    it('대상 admin 존재 검증 후 코드→id 변환하여 updater 위임', async () => {
      reader.assertExistById.mockResolvedValue(undefined);
      permissionReader.findIdsByCodes.mockResolvedValue([10, 20]);
      permissionUpdater.replacePermissions.mockResolvedValue(undefined);

      await service.replaceDirectPermissions(7, ['USER_LIST', 'USER_READ']);

      expect(reader.assertExistById).toHaveBeenCalledWith(7);
      expect(permissionReader.findIdsByCodes).toHaveBeenCalledWith(['USER_LIST', 'USER_READ']);
      expect(permissionUpdater.replacePermissions).toHaveBeenCalledWith(7, [10, 20]);
    });

    it('admin 존재 검증 실패 시 후속 호출 없음', async () => {
      reader.assertExistById.mockRejectedValue(new Error('not found'));

      await expect(service.replaceDirectPermissions(7, ['USER_LIST'])).rejects.toThrow();
      expect(permissionReader.findIdsByCodes).not.toHaveBeenCalled();
      expect(permissionUpdater.replacePermissions).not.toHaveBeenCalled();
    });
  });

  describe('replaceAppliedPresets', () => {
    it('admin + preset 존재 검증 후 updater 위임', async () => {
      reader.assertExistById.mockResolvedValue(undefined);
      presetReader.assertExistByIds.mockResolvedValue(undefined);
      presetUpdater.replacePresets.mockResolvedValue(undefined);

      await service.replaceAppliedPresets(7, [100, 200]);

      expect(reader.assertExistById).toHaveBeenCalledWith(7);
      expect(presetReader.assertExistByIds).toHaveBeenCalledWith([100, 200]);
      expect(presetUpdater.replacePresets).toHaveBeenCalledWith(7, [100, 200]);
    });

    it('preset 존재 검증 실패 시 updater 호출 없음', async () => {
      reader.assertExistById.mockResolvedValue(undefined);
      presetReader.assertExistByIds.mockRejectedValue(new Error('not found'));

      await expect(service.replaceAppliedPresets(7, [100])).rejects.toThrow();
      expect(presetUpdater.replacePresets).not.toHaveBeenCalled();
    });
  });
});
