import { Injectable, NotFoundException } from '@nestjs/common';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';
import { AdminUserRepository } from '../../database/mysql/entity/user/AdminUser.repository';

import { AdminGetUserListData } from './data/AdminGetUserListData';
import { AdminGetUserResult } from './result/AdminGetUserResult';
import { AdminUserListItemResult } from './result/AdminUserListItemResult';

@Injectable()
export class AdminUserReader {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminAccountRepository: AdminAccountRepository,
  ) {}

  async getByIdOrThrow(id: number): Promise<AdminGetUserResult> {
    const user = await this.adminUserRepository.findById(id);
    if (!user) {
      throw new NotFoundException({ errorType: CoreDomainError.USER_NOT_FOUND });
    }

    const adminAccount = await this.adminAccountRepository.findByUserId(id);

    return AdminGetUserResult.of({
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      avatarUrl: user.avatarUrl,
      status: user.status,
      countryCode: user.countryCode,
      countryCallingCode: user.countryCallingCode,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isAdmin: adminAccount !== null,
    });
  }

  async findListWithPagination(
    data: AdminGetUserListData,
  ): Promise<{ readonly list: AdminUserListItemResult[]; readonly totalPages: number; readonly totalResults: number }> {
    const { items, totalResults } = await this.adminUserRepository.findListWithPagination({
      page: data.page,
      limit: data.limit,
      keyword: data.keyword,
      status: data.status,
    });
    const totalPages = Math.ceil(totalResults / data.limit);

    const list = items.map((user) =>
      AdminUserListItemResult.of({
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        avatarUrl: user.avatarUrl,
        status: user.status,
        countryCode: user.countryCode,
        countryCallingCode: user.countryCallingCode,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      }),
    );

    return { list, totalPages, totalResults };
  }
}
