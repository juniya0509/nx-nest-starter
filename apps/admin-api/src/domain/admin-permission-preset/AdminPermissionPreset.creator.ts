import { Injectable } from '@nestjs/common';

import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminPermissionReader } from '../admin-permission/AdminPermission.reader';

import { AdminPermissionPresetReader } from './AdminPermissionPreset.reader';
import { AdminCreatePermissionPresetData } from './data/AdminCreatePermissionPresetData';

@Injectable()
export class AdminPermissionPresetCreator {
  constructor(
    private readonly adminPermissionPresetRepository: AdminPermissionPresetRepository,
    private readonly adminPermissionPresetItemRepository: AdminPermissionPresetItemRepository,
    private readonly adminPermissionPresetReader: AdminPermissionPresetReader,
    private readonly adminPermissionReader: AdminPermissionReader,
  ) {}

  async create(data: AdminCreatePermissionPresetData): Promise<number> {
    await this.adminPermissionPresetReader.assertNotExistByCode(data.code);

    const created = await this.adminPermissionPresetRepository.createPreset({
      code: data.code,
      name: data.name,
      description: data.description,
    });

    const permissionIds = await this.adminPermissionReader.findIdsByCodes(data.permissionCodes);
    if (permissionIds.length > 0) {
      await this.adminPermissionPresetItemRepository.replaceItems(created.id, permissionIds);
    }

    return created.id;
  }
}
