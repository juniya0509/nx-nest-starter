import { Repository } from 'typeorm';

import { CustomRepository } from '@libs/core-database/src/mysql/decorator/TypeOrmCustomRepository.decorator';

import { AdminPermissionPresetItemEntity } from './AdminPermissionPresetItem.entity';

@CustomRepository(AdminPermissionPresetItemEntity)
export class AdminPermissionPresetItemRepository extends Repository<AdminPermissionPresetItemEntity> {
  async findPermissionIdsByPresetId(presetId: number): Promise<number[]> {
    const rows = await this.createQueryBuilder('item')
      .select('item.permission_id', 'permissionId')
      .where('item.preset_id = :presetId', { presetId })
      .getRawMany<{ permissionId: number }>();

    return rows.map((row) => row.permissionId);
  }

  async findPermissionIdsByPresetIds(presetIds: number[]): Promise<number[]> {
    if (presetIds.length === 0) return [];

    const rows = await this.createQueryBuilder('item')
      .select('item.permission_id', 'permissionId')
      .where('item.preset_id IN (:...presetIds)', { presetIds })
      .getRawMany<{ permissionId: number }>();

    return rows.map((row) => row.permissionId);
  }

  async countByPresetIds(presetIds: number[]): Promise<Map<number, number>> {
    if (presetIds.length === 0) return new Map();

    const rows = await this.createQueryBuilder('item')
      .select('item.preset_id', 'presetId')
      .where('item.preset_id IN (:...presetIds)', { presetIds })
      .getRawMany<{ presetId: number }>();

    const countByPresetId = new Map<number, number>();
    for (const row of rows) {
      countByPresetId.set(row.presetId, (countByPresetId.get(row.presetId) ?? 0) + 1);
    }

    return countByPresetId;
  }

  async replaceItems(presetId: number, permissionIds: number[]): Promise<void> {
    await this.delete({ preset: { id: presetId } });

    if (permissionIds.length === 0) return;

    const rows = permissionIds.map((permissionId) => this.create({ preset: { id: presetId }, permission: { id: permissionId } }));
    await this.save(rows);
  }

  async deleteByPresetId(presetId: number): Promise<void> {
    await this.delete({ preset: { id: presetId } });
  }
}
