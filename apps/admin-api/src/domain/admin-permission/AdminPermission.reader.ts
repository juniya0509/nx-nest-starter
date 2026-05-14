import { Injectable } from '@nestjs/common';

import { In } from 'typeorm';

import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';

import { AdminPermissionResult } from './result/AdminPermissionResult';

@Injectable()
export class AdminPermissionReader {
  constructor(
    private readonly adminPermissionRepository: AdminPermissionRepository,
    private readonly adminAccountPermissionRepository: AdminAccountPermissionRepository,
    private readonly adminAccountPresetRepository: AdminAccountPresetRepository,
    private readonly adminPermissionPresetItemRepository: AdminPermissionPresetItemRepository,
  ) {}

  async findAllFromCatalog(): Promise<AdminPermissionResult[]> {
    const permissions = await this.adminPermissionRepository.findAll();
    return permissions.map((permission) =>
      AdminPermissionResult.of({
        id: permission.id,
        code: permission.code,
        groupCode: permission.groupCode,
        description: permission.description,
      }),
    );
  }

  async findIdsByCodes(codes: string[]): Promise<number[]> {
    if (codes.length === 0) return [];

    const permissions = await this.adminPermissionRepository.findByCodes(codes);
    return permissions.map((permission) => permission.id);
  }

  async findEffectivePermissionCodesByAdminAccountId(adminAccountId: number): Promise<Set<string>> {
    const directPermissionIds = await this.adminAccountPermissionRepository.findPermissionIdsByAdminAccountId(adminAccountId);
    const presetIds = await this.adminAccountPresetRepository.findPresetIdsByAdminAccountId(adminAccountId);
    const presetPermissionIds = await this.adminPermissionPresetItemRepository.findPermissionIdsByPresetIds(presetIds);

    const allPermissionIds = Array.from(new Set([...directPermissionIds, ...presetPermissionIds]));
    if (allPermissionIds.length === 0) return new Set();

    const permissions = await this.adminPermissionRepository.findBy({ id: In(allPermissionIds) });

    return new Set(permissions.map((permission) => permission.code));
  }
}
