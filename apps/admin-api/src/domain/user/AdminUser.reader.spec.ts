import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UserEntity } from '@libs/core-database/src/mysql/entity/user/User.entity';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminAccountEntity } from '../../database/mysql/entity/admin-account/AdminAccount.entity';
import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';
import { AdminUserRepository } from '../../database/mysql/entity/user/AdminUser.repository';

import { AdminUserReader } from './AdminUser.reader';
import { AdminGetUserListData } from './data/AdminGetUserListData';

describe('AdminUserReader', () => {
  let reader: AdminUserReader;
  let adminUserRepository: jest.Mocked<Pick<AdminUserRepository, 'findById' | 'findListWithPagination'>>;
  let adminAccountRepository: jest.Mocked<Pick<AdminAccountRepository, 'findByUserId'>>;

  const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
    ({
      id: 1,
      email: 'user@example.com',
      firstname: 'John',
      lastname: 'Doe',
      avatarUrl: null,
      status: 'ACTIVE',
      countryCode: null,
      countryCallingCode: null,
      phoneNumber: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      ...overrides,
    }) as unknown as UserEntity;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUserReader,
        {
          provide: AdminUserRepository,
          useValue: { findById: jest.fn(), findListWithPagination: jest.fn() },
        },
        {
          provide: AdminAccountRepository,
          useValue: { findByUserId: jest.fn() },
        },
      ],
    }).compile();

    reader = moduleRef.get(AdminUserReader);
    adminUserRepository = moduleRef.get(AdminUserRepository);
    adminAccountRepository = moduleRef.get(AdminAccountRepository);
  });

  describe('getByIdOrThrow', () => {
    it('관리자 계정이 없는 유저는 isAdmin=false 로 반환한다', async () => {
      adminUserRepository.findById.mockResolvedValue(buildUser());
      adminAccountRepository.findByUserId.mockResolvedValue(null);

      const result = await reader.getByIdOrThrow(1);

      expect(result.id).toBe(1);
      expect(result.fullname).toBe('John Doe');
      expect(result.isAdmin).toBe(false);
      expect(adminUserRepository.findById).toHaveBeenCalledWith(1);
      expect(adminAccountRepository.findByUserId).toHaveBeenCalledWith(1);
    });

    it('관리자 계정이 있는 유저는 isAdmin=true 로 반환한다', async () => {
      adminUserRepository.findById.mockResolvedValue(buildUser());
      adminAccountRepository.findByUserId.mockResolvedValue({ id: 99 } as unknown as AdminAccountEntity);

      const result = await reader.getByIdOrThrow(1);

      expect(result.isAdmin).toBe(true);
    });

    it('유저가 없으면 USER_NOT_FOUND NotFoundException 을 던진다', async () => {
      adminUserRepository.findById.mockResolvedValue(null);

      await expect(reader.getByIdOrThrow(999)).rejects.toMatchObject({
        constructor: NotFoundException,
        response: { errorType: CoreDomainError.USER_NOT_FOUND },
      });
      expect(adminAccountRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('findListWithPagination', () => {
    const buildData = (overrides: Partial<{ page: number; limit: number; keyword: string; status: null }> = {}) =>
      AdminGetUserListData.of({
        page: 1,
        limit: 10,
        keyword: '',
        status: null,
        ...overrides,
      });

    it('repo 결과를 ListItemResult 로 매핑한다', async () => {
      adminUserRepository.findListWithPagination.mockResolvedValue({
        items: [buildUser({ id: 1 }), buildUser({ id: 2, firstname: null, lastname: null })],
        totalResults: 2,
      });

      const { list, totalPages, totalResults } = await reader.findListWithPagination(buildData());

      expect(list).toHaveLength(2);
      expect(list[0].id).toBe(1);
      expect(list[0].fullname).toBe('John Doe');
      expect(list[1].id).toBe(2);
      expect(list[1].fullname).toBe('');
      expect(totalResults).toBe(2);
      expect(totalPages).toBe(1);
    });

    it('totalPages 는 ceil(totalResults / limit) 로 계산된다', async () => {
      adminUserRepository.findListWithPagination.mockResolvedValue({ items: [], totalResults: 25 });

      const { totalPages } = await reader.findListWithPagination(buildData({ limit: 10 }));

      expect(totalPages).toBe(3);
    });

    it('totalResults 0 이면 totalPages 도 0 이다', async () => {
      adminUserRepository.findListWithPagination.mockResolvedValue({ items: [], totalResults: 0 });

      const { list, totalPages, totalResults } = await reader.findListWithPagination(buildData());

      expect(list).toEqual([]);
      expect(totalPages).toBe(0);
      expect(totalResults).toBe(0);
    });

    it('Data 의 페이지/필터 값을 repo 에 그대로 전달한다', async () => {
      adminUserRepository.findListWithPagination.mockResolvedValue({ items: [], totalResults: 0 });

      await reader.findListWithPagination(buildData({ page: 3, limit: 5, keyword: 'john', status: null }));

      expect(adminUserRepository.findListWithPagination).toHaveBeenCalledWith({
        page: 3,
        limit: 5,
        keyword: 'john',
        status: null,
      });
    });
  });
});
