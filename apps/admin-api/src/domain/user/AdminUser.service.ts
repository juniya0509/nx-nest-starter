import { Injectable } from '@nestjs/common';

import { AdminUserReader } from './AdminUser.reader';
import { AdminGetUserListData } from './data/AdminGetUserListData';
import { AdminGetUserResult } from './result/AdminGetUserResult';
import { AdminUserListItemResult } from './result/AdminUserListItemResult';

@Injectable()
export class AdminUserService {
  constructor(private readonly adminUserReader: AdminUserReader) {}

  async getUserList(
    data: AdminGetUserListData,
  ): Promise<{ readonly list: AdminUserListItemResult[]; readonly totalPages: number; readonly totalResults: number }> {
    return this.adminUserReader.findListWithPagination(data);
  }

  async getUser(id: number): Promise<AdminGetUserResult> {
    return this.adminUserReader.getByIdOrThrow(id);
  }
}
