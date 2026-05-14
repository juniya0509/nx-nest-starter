import { Injectable } from '@nestjs/common';

import { Transactional } from 'typeorm-transactional';

import { AdminPermissionPresetCreator } from './AdminPermissionPreset.creator';
import { AdminPermissionPresetReader } from './AdminPermissionPreset.reader';
import { AdminPermissionPresetRemover } from './AdminPermissionPreset.remover';
import { AdminPermissionPresetUpdater } from './AdminPermissionPreset.updater';
import { AdminCreatePermissionPresetData } from './data/AdminCreatePermissionPresetData';
import { AdminUpdatePermissionPresetData } from './data/AdminUpdatePermissionPresetData';
import { AdminGetPermissionPresetResult } from './result/AdminGetPermissionPresetResult';
import { AdminPermissionPresetListItemResult } from './result/AdminPermissionPresetListItemResult';

@Injectable()
export class AdminPermissionPresetService {
  constructor(
    private readonly adminPermissionPresetReader: AdminPermissionPresetReader,
    private readonly adminPermissionPresetCreator: AdminPermissionPresetCreator,
    private readonly adminPermissionPresetUpdater: AdminPermissionPresetUpdater,
    private readonly adminPermissionPresetRemover: AdminPermissionPresetRemover,
  ) {}

  @Transactional()
  async createPreset(data: AdminCreatePermissionPresetData): Promise<number> {
    return this.adminPermissionPresetCreator.create(data);
  }

  async getPresetList(): Promise<AdminPermissionPresetListItemResult[]> {
    return this.adminPermissionPresetReader.findAll();
  }

  async getPreset(id: number): Promise<AdminGetPermissionPresetResult> {
    return this.adminPermissionPresetReader.getByIdOrThrow(id);
  }

  @Transactional()
  async updatePreset(id: number, data: AdminUpdatePermissionPresetData): Promise<void> {
    return this.adminPermissionPresetUpdater.update(id, data);
  }

  @Transactional()
  async deletePreset(id: number): Promise<void> {
    return this.adminPermissionPresetRemover.softDeleteById(id);
  }
}
