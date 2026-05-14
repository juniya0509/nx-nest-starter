import { Injectable } from '@nestjs/common';

import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';

@Injectable()
export class AdminAccountPresetUpdater {
  constructor(private readonly adminAccountPresetRepository: AdminAccountPresetRepository) {}

  async replacePresets(adminAccountId: number, presetIds: number[]): Promise<void> {
    await this.adminAccountPresetRepository.replacePresets(adminAccountId, presetIds);
  }
}
