import { Injectable } from '@nestjs/common';

import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';

import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';

import { AdminAccountReader } from './AdminAccount.reader';
import { AdminCreateAccountData } from './data/AdminCreateAccountData';

@Injectable()
export class AdminAccountCreator {
  constructor(
    private readonly adminAccountRepository: AdminAccountRepository,
    private readonly userReader: UserReader,
    private readonly adminAccountReader: AdminAccountReader,
  ) {}

  async create(data: AdminCreateAccountData): Promise<number> {
    await this.userReader.getByIdOrThrow(data.userId);
    await this.adminAccountReader.assertNotExistByUserId(data.userId);

    const created = await this.adminAccountRepository.createAdminAccount({
      userId: data.userId,
      memo: data.memo,
    });

    return created.id;
  }
}
