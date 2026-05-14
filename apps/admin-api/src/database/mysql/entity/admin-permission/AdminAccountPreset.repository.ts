import { Repository } from 'typeorm';

import { CustomRepository } from '@libs/core-database/src/mysql/decorator/TypeOrmCustomRepository.decorator';

import { AdminAccountPresetEntity } from './AdminAccountPreset.entity';

@CustomRepository(AdminAccountPresetEntity)
export class AdminAccountPresetRepository extends Repository<AdminAccountPresetEntity> {
  async findPresetIdsByAdminAccountId(adminAccountId: number): Promise<number[]> {
    const rows = await this.createQueryBuilder('item')
      .select('item.preset_id', 'presetId')
      .where('item.admin_account_id = :adminAccountId', { adminAccountId })
      .getRawMany<{ presetId: number }>();

    return rows.map((row) => row.presetId);
  }

  async replacePresets(adminAccountId: number, presetIds: number[]): Promise<void> {
    await this.delete({ adminAccount: { id: adminAccountId } });

    if (presetIds.length === 0) return;

    const rows = presetIds.map((presetId) => this.create({ adminAccount: { id: adminAccountId }, preset: { id: presetId } }));
    await this.save(rows);
  }

  async deleteByAdminAccountId(adminAccountId: number): Promise<void> {
    await this.delete({ adminAccount: { id: adminAccountId } });
  }

  async deleteByPresetId(presetId: number): Promise<void> {
    await this.delete({ preset: { id: presetId } });
  }
}
