import { Injectable } from '@nestjs/common';

import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';

import { AdminPermissionPresetReader } from './AdminPermissionPreset.reader';

@Injectable()
export class AdminPermissionPresetRemover {
  constructor(
    private readonly adminPermissionPresetRepository: AdminPermissionPresetRepository,
    private readonly adminPermissionPresetItemRepository: AdminPermissionPresetItemRepository,
    private readonly adminAccountPresetRepository: AdminAccountPresetRepository,
    private readonly adminPermissionPresetReader: AdminPermissionPresetReader,
  ) {}

  async softDeleteById(presetId: number): Promise<void> {
    await this.adminPermissionPresetReader.assertExistById(presetId);

    await this.adminPermissionPresetItemRepository.deleteByPresetId(presetId);
    await this.adminAccountPresetRepository.deleteByPresetId(presetId);
    await this.adminPermissionPresetRepository.softDeleteById(presetId);
  }
}
