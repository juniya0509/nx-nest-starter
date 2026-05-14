import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminApiError } from '../../support/error/AdminApiError';

import { AdminGetPermissionPresetResult } from './result/AdminGetPermissionPresetResult';
import { AdminPermissionPresetListItemResult } from './result/AdminPermissionPresetListItemResult';

@Injectable()
export class AdminPermissionPresetReader {
  constructor(
    private readonly adminPermissionPresetRepository: AdminPermissionPresetRepository,
    private readonly adminPermissionPresetItemRepository: AdminPermissionPresetItemRepository,
    private readonly adminPermissionRepository: AdminPermissionRepository,
  ) {}

  async findAll(): Promise<AdminPermissionPresetListItemResult[]> {
    const presets = await this.adminPermissionPresetRepository.findAll();
    if (presets.length === 0) return [];

    const presetIds = presets.map((preset) => preset.id);
    const countByPresetId = await this.adminPermissionPresetItemRepository.countByPresetIds(presetIds);

    return presets.map((preset) =>
      AdminPermissionPresetListItemResult.of({
        id: preset.id,
        code: preset.code,
        name: preset.name,
        description: preset.description,
        permissionCount: countByPresetId.get(preset.id) ?? 0,
        createdAt: preset.createdAt,
      }),
    );
  }

  async assertNotExistByCode(code: string): Promise<void> {
    const existing = await this.adminPermissionPresetRepository.findByCode(code);
    if (existing) {
      throw new ConflictException({ errorType: AdminApiError.PERMISSION_PRESET_CODE_DUPLICATE });
    }
  }

  async assertExistById(id: number): Promise<void> {
    const existing = await this.adminPermissionPresetRepository.findById(id);
    if (!existing) {
      throw new NotFoundException({ errorType: AdminApiError.PERMISSION_PRESET_NOT_FOUND });
    }
  }

  async assertExistByIds(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    const presets = await this.adminPermissionPresetRepository.findManyByIds(ids);
    if (presets.length !== ids.length) {
      throw new BadRequestException({ errorType: AdminApiError.INVALID_PRESET_ID });
    }
  }

  async getByIdOrThrow(id: number): Promise<AdminGetPermissionPresetResult> {
    const preset = await this.adminPermissionPresetRepository.findById(id);
    if (!preset) {
      throw new NotFoundException({ errorType: AdminApiError.PERMISSION_PRESET_NOT_FOUND });
    }

    const permissionIds = await this.adminPermissionPresetItemRepository.findPermissionIdsByPresetId(id);
    const permissions = permissionIds.length > 0 ? await this.adminPermissionRepository.findManyByIds(permissionIds) : [];

    return AdminGetPermissionPresetResult.of({
      id: preset.id,
      code: preset.code,
      name: preset.name,
      description: preset.description,
      permissionCodes: permissions.map((permission) => permission.code),
      createdAt: preset.createdAt,
    });
  }
}
