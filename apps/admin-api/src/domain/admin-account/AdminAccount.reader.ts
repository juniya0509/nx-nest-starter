import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';
import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminApiError } from '../../support/error/AdminApiError';

import { AdminGetAccountListData } from './data/AdminGetAccountListData';
import { AdminAccountListItemResult } from './result/AdminAccountListItemResult';
import { AdminAccountResult } from './result/AdminAccountResult';
import { AdminGetAccountResult } from './result/AdminGetAccountResult';

@Injectable()
export class AdminAccountReader {
  constructor(
    private readonly adminAccountRepository: AdminAccountRepository,
    private readonly adminPermissionRepository: AdminPermissionRepository,
    private readonly adminPermissionPresetRepository: AdminPermissionPresetRepository,
    private readonly adminAccountPermissionRepository: AdminAccountPermissionRepository,
    private readonly adminAccountPresetRepository: AdminAccountPresetRepository,
    private readonly adminPermissionPresetItemRepository: AdminPermissionPresetItemRepository,
  ) {}

  async findById(id: number): Promise<AdminAccountResult | null> {
    const adminAccount = await this.adminAccountRepository.findById(id);
    if (!adminAccount) return null;

    return AdminAccountResult.of({
      id: adminAccount.id,
      userId: adminAccount.user.id,
      status: adminAccount.status,
      memo: adminAccount.memo,
      createdAt: adminAccount.createdAt,
    });
  }

  async findByUserId(userId: number): Promise<AdminAccountResult | null> {
    const adminAccount = await this.adminAccountRepository.findByUserId(userId);
    if (!adminAccount) return null;

    return AdminAccountResult.of({
      id: adminAccount.id,
      userId: adminAccount.user.id,
      status: adminAccount.status,
      memo: adminAccount.memo,
      createdAt: adminAccount.createdAt,
    });
  }

  async assertExistById(id: number): Promise<void> {
    const existing = await this.adminAccountRepository.findById(id);
    if (!existing) {
      throw new NotFoundException({ errorType: AdminApiError.ADMIN_ACCOUNT_NOT_FOUND });
    }
  }

  async assertNotExistByUserId(userId: number): Promise<void> {
    const existing = await this.adminAccountRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictException({ errorType: AdminApiError.ADMIN_ACCOUNT_ALREADY_EXISTS });
    }
  }

  async getByIdOrThrow(id: number): Promise<AdminGetAccountResult> {
    const adminAccount = await this.adminAccountRepository.findById(id);
    if (!adminAccount) {
      throw new NotFoundException({ errorType: AdminApiError.ADMIN_ACCOUNT_NOT_FOUND });
    }

    const userEntity = adminAccount.user;

    const directPermissionIds = await this.adminAccountPermissionRepository.findPermissionIdsByAdminAccountId(id);
    const appliedPresetIds = await this.adminAccountPresetRepository.findPresetIdsByAdminAccountId(id);

    const directPermissions = await this.adminPermissionRepository.findManyByIds(directPermissionIds);
    const appliedPresets = await this.adminPermissionPresetRepository.findManyByIds(appliedPresetIds);

    const presetPermissionIds = await this.adminPermissionPresetItemRepository.findPermissionIdsByPresetIds(appliedPresetIds);
    const allPermissionIds = Array.from(new Set([...directPermissionIds, ...presetPermissionIds]));
    const allPermissions = allPermissionIds.length > 0 ? await this.adminPermissionRepository.findManyByIds(allPermissionIds) : [];

    return AdminGetAccountResult.of({
      id: adminAccount.id,
      userId: userEntity.id,
      userEmail: userEntity.email,
      userFirstname: userEntity.firstname,
      userLastname: userEntity.lastname,
      userAvatarUrl: userEntity.avatarUrl,
      status: adminAccount.status,
      memo: adminAccount.memo,
      createdAt: adminAccount.createdAt,
      directPermissionCodes: directPermissions.map((permission) => permission.code),
      appliedPresets: appliedPresets.map((preset) => ({ id: preset.id, code: preset.code, name: preset.name })),
      effectivePermissionCodes: allPermissions.map((permission) => permission.code),
    });
  }

  async findListWithPagination(
    data: AdminGetAccountListData,
  ): Promise<{ readonly list: AdminAccountListItemResult[]; readonly totalPages: number; readonly totalResults: number }> {
    const { items, totalResults } = await this.adminAccountRepository.findListWithPagination({
      page: data.page,
      limit: data.limit,
      keyword: data.keyword,
      status: data.status,
    });
    const totalPages = Math.ceil(totalResults / data.limit);

    const list = items.map((adminAccount) =>
      AdminAccountListItemResult.of({
        id: adminAccount.id,
        userId: adminAccount.user.id,
        userEmail: adminAccount.user.email,
        userFirstname: adminAccount.user.firstname,
        userLastname: adminAccount.user.lastname,
        userAvatarUrl: adminAccount.user.avatarUrl,
        status: adminAccount.status,
        memo: adminAccount.memo,
        createdAt: adminAccount.createdAt,
      }),
    );

    return { list, totalPages, totalResults };
  }
}
