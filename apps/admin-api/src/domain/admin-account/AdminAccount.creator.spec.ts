import { Test, TestingModule } from '@nestjs/testing';

import { GetUserResult } from '@libs/core-domain/src/domain/user/result/GetUserResult';
import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';

import { AdminAccountEntity } from '../../database/mysql/entity/admin-account/AdminAccount.entity';
import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';

import { AdminAccountCreator } from './AdminAccount.creator';
import { AdminAccountReader } from './AdminAccount.reader';
import { AdminCreateAccountData } from './data/AdminCreateAccountData';

describe('AdminAccountCreator', () => {
  let creator: AdminAccountCreator;
  let adminAccountRepository: jest.Mocked<Pick<AdminAccountRepository, 'createAdminAccount'>>;
  let userReader: jest.Mocked<Pick<UserReader, 'getByIdOrThrow'>>;
  let adminAccountReader: jest.Mocked<Pick<AdminAccountReader, 'assertNotExistByUserId'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAccountCreator,
        { provide: AdminAccountRepository, useValue: { createAdminAccount: jest.fn() } },
        { provide: UserReader, useValue: { getByIdOrThrow: jest.fn() } },
        { provide: AdminAccountReader, useValue: { assertNotExistByUserId: jest.fn() } },
      ],
    }).compile();

    creator = moduleRef.get(AdminAccountCreator);
    adminAccountRepository = moduleRef.get(AdminAccountRepository);
    userReader = moduleRef.get(UserReader);
    adminAccountReader = moduleRef.get(AdminAccountReader);
  });

  describe('create', () => {
    it('user 존재 + admin 미존재 검증 후 repo.createAdminAccount 호출 + id 반환', async () => {
      const data = AdminCreateAccountData.fromReqDto({ userId: 1, memo: 'm' });
      userReader.getByIdOrThrow.mockResolvedValue({} as GetUserResult);
      adminAccountReader.assertNotExistByUserId.mockResolvedValue(undefined);
      adminAccountRepository.createAdminAccount.mockResolvedValue({ id: 42 } as unknown as AdminAccountEntity);

      const result = await creator.create(data);

      expect(result).toBe(42);
      expect(userReader.getByIdOrThrow).toHaveBeenCalledWith(1);
      expect(adminAccountReader.assertNotExistByUserId).toHaveBeenCalledWith(1);
      expect(adminAccountRepository.createAdminAccount).toHaveBeenCalledWith({ userId: 1, memo: 'm' });
    });

    it('user 미존재 시 후속 호출 없음', async () => {
      const data = AdminCreateAccountData.fromReqDto({ userId: 999, memo: null });
      userReader.getByIdOrThrow.mockRejectedValue(new Error('USER_NOT_FOUND'));

      await expect(creator.create(data)).rejects.toThrow();
      expect(adminAccountReader.assertNotExistByUserId).not.toHaveBeenCalled();
      expect(adminAccountRepository.createAdminAccount).not.toHaveBeenCalled();
    });

    it('admin 이미 존재 시 repo.createAdminAccount 호출 없음', async () => {
      const data = AdminCreateAccountData.fromReqDto({ userId: 1, memo: null });
      userReader.getByIdOrThrow.mockResolvedValue({} as GetUserResult);
      adminAccountReader.assertNotExistByUserId.mockRejectedValue(new Error('ALREADY_EXISTS'));

      await expect(creator.create(data)).rejects.toThrow();
      expect(adminAccountRepository.createAdminAccount).not.toHaveBeenCalled();
    });
  });
});
