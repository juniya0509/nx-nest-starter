import { Injectable } from '@nestjs/common';

import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminPermissionReader } from '../admin-permission/AdminPermission.reader';

import { AdminPermissionPresetReader } from './AdminPermissionPreset.reader';
import { AdminUpdatePermissionPresetData } from './data/AdminUpdatePermissionPresetData';

@Injectable()
export class AdminPermissionPresetUpdater {
  constructor(
    private readonly adminPermissionPresetRepository: AdminPermissionPresetRepository,
    private readonly adminPermissionPresetItemRepository: AdminPermissionPresetItemRepository,
    private readonly adminPermissionPresetReader: AdminPermissionPresetReader,
    private readonly adminPermissionReader: AdminPermissionReader,
  ) {}

  async update(presetId: number, data: AdminUpdatePermissionPresetData): Promise<void> {
    await this.adminPermissionPresetReader.assertExistById(presetId);

    await this.adminPermissionPresetRepository.updatePreset(presetId, {
      name: data.name,
      description: data.description,
    });

    const permissionIds = await this.adminPermissionReader.findIdsByCodes(data.permissionCodes);
    await this.adminPermissionPresetItemRepository.replaceItems(presetId, permissionIds);
  }
}
