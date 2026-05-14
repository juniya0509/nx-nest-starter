import { Injectable } from '@nestjs/common';

import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';

@Injectable()
export class AdminAccountPermissionUpdater {
  constructor(private readonly adminAccountPermissionRepository: AdminAccountPermissionRepository) {}

  async replacePermissions(adminAccountId: number, permissionIds: number[]): Promise<void> {
    await this.adminAccountPermissionRepository.replacePermissions(adminAccountId, permissionIds);
  }
}
