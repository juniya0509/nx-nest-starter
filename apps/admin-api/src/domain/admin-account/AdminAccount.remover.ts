import { Injectable } from '@nestjs/common';

import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';
import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';

import { AdminAccountReader } from './AdminAccount.reader';

@Injectable()
export class AdminAccountRemover {
  constructor(
    private readonly adminAccountReader: AdminAccountReader,
    private readonly adminAccountRepository: AdminAccountRepository,
    private readonly adminAccountPermissionRepository: AdminAccountPermissionRepository,
    private readonly adminAccountPresetRepository: AdminAccountPresetRepository,
  ) {}

  async softDeleteById(adminAccountId: number): Promise<void> {
    await this.adminAccountReader.assertExistById(adminAccountId);

    await this.adminAccountPermissionRepository.deleteByAdminAccountId(adminAccountId);
    await this.adminAccountPresetRepository.deleteByAdminAccountId(adminAccountId);
    await this.adminAccountRepository.softDeleteById(adminAccountId);
  }
}
