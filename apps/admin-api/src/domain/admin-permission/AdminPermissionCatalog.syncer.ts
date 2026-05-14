import { Injectable } from '@nestjs/common';

import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermission } from '../../enum/AdminPermission.enum';

@Injectable()
export class AdminPermissionCatalogSyncer {
  constructor(private readonly adminPermissionRepository: AdminPermissionRepository) {}

  async syncFromEnum(): Promise<void> {
    const allPermissions = AdminPermission.values();
    const existing = await this.adminPermissionRepository.findAll();
    const existingCodeSet = new Set(existing.map((permission) => permission.code));

    const rowsToInsert = allPermissions
      .filter((permission) => !existingCodeSet.has(permission.code))
      .map((permission) => ({
        code: permission.code,
        groupCode: permission.group,
        description: permission.description,
      }));

    if (rowsToInsert.length === 0) return;

    await this.adminPermissionRepository.insertIgnoreMany(rowsToInsert);

    console.info(`Synced ${rowsToInsert.length} admin permission(s) from enum to catalog`);
  }
}
