import { Repository } from 'typeorm';

import { CustomRepository } from '@libs/core-database/src/mysql/decorator/TypeOrmCustomRepository.decorator';

import { AdminAccountPermissionEntity } from './AdminAccountPermission.entity';

@CustomRepository(AdminAccountPermissionEntity)
export class AdminAccountPermissionRepository extends Repository<AdminAccountPermissionEntity> {
  async findPermissionIdsByAdminAccountId(adminAccountId: number): Promise<number[]> {
    const rows = await this.createQueryBuilder('item')
      .select('item.permission_id', 'permissionId')
      .where('item.admin_account_id = :adminAccountId', { adminAccountId })
      .getRawMany<{ permissionId: number }>();

    return rows.map((row) => row.permissionId);
  }

  async replacePermissions(adminAccountId: number, permissionIds: number[]): Promise<void> {
    await this.delete({ adminAccount: { id: adminAccountId } });

    if (permissionIds.length === 0) return;

    const rows = permissionIds.map((permissionId) =>
      this.create({ adminAccount: { id: adminAccountId }, permission: { id: permissionId } }),
    );
    await this.save(rows);
  }

  async deleteByAdminAccountId(adminAccountId: number): Promise<void> {
    await this.delete({ adminAccount: { id: adminAccountId } });
  }
}
