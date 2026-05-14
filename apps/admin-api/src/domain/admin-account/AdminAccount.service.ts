import { Injectable } from '@nestjs/common';

import { Transactional } from 'typeorm-transactional';

import { AdminPermissionReader } from '../admin-permission/AdminPermission.reader';
import { AdminPermissionPresetReader } from '../admin-permission-preset/AdminPermissionPreset.reader';

import { AdminAccountCreator } from './AdminAccount.creator';
import { AdminAccountReader } from './AdminAccount.reader';
import { AdminAccountRemover } from './AdminAccount.remover';
import { AdminAccountPermissionUpdater } from './AdminAccountPermission.updater';
import { AdminAccountPresetUpdater } from './AdminAccountPreset.updater';
import { AdminCreateAccountData } from './data/AdminCreateAccountData';
import { AdminGetAccountListData } from './data/AdminGetAccountListData';
import { AdminAccountListItemResult } from './result/AdminAccountListItemResult';
import { AdminGetAccountResult } from './result/AdminGetAccountResult';

@Injectable()
export class AdminAccountService {
  constructor(
    private readonly adminAccountReader: AdminAccountReader,
    private readonly adminAccountCreator: AdminAccountCreator,
    private readonly adminAccountRemover: AdminAccountRemover,
    private readonly adminAccountPermissionUpdater: AdminAccountPermissionUpdater,
    private readonly adminAccountPresetUpdater: AdminAccountPresetUpdater,
    private readonly adminPermissionReader: AdminPermissionReader,
    private readonly adminPermissionPresetReader: AdminPermissionPresetReader,
  ) {}

  @Transactional()
  async createAdminAccount(data: AdminCreateAccountData): Promise<number> {
    return this.adminAccountCreator.create(data);
  }

  async getAdminAccountList(
    data: AdminGetAccountListData,
  ): Promise<{ readonly list: AdminAccountListItemResult[]; readonly totalPages: number; readonly totalResults: number }> {
    return this.adminAccountReader.findListWithPagination(data);
  }

  async getAdminAccount(id: number): Promise<AdminGetAccountResult> {
    return this.adminAccountReader.getByIdOrThrow(id);
  }

  @Transactional()
  async deleteAdminAccount(id: number): Promise<void> {
    return this.adminAccountRemover.softDeleteById(id);
  }

  @Transactional()
  async replaceDirectPermissions(adminAccountId: number, permissionCodes: string[]): Promise<void> {
    await this.adminAccountReader.assertExistById(adminAccountId);
    const permissionIds = await this.adminPermissionReader.findIdsByCodes(permissionCodes);

    await this.adminAccountPermissionUpdater.replacePermissions(adminAccountId, permissionIds);
  }

  @Transactional()
  async replaceAppliedPresets(adminAccountId: number, presetIds: number[]): Promise<void> {
    await this.adminAccountReader.assertExistById(adminAccountId);
    await this.adminPermissionPresetReader.assertExistByIds(presetIds);

    await this.adminAccountPresetUpdater.replacePresets(adminAccountId, presetIds);
  }
}
