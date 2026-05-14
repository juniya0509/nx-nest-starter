import { In, Repository } from 'typeorm';

import { CustomRepository } from '@libs/core-database/src/mysql/decorator/TypeOrmCustomRepository.decorator';

import { AdminPermissionPresetEntity } from './AdminPermissionPreset.entity';

@CustomRepository(AdminPermissionPresetEntity)
export class AdminPermissionPresetRepository extends Repository<AdminPermissionPresetEntity> {
  async findById(id: number): Promise<AdminPermissionPresetEntity | null> {
    const preset = await this.findOne({ where: { id } });

    return preset;
  }

  async findManyByIds(ids: number[]): Promise<AdminPermissionPresetEntity[]> {
    if (ids.length === 0) return [];

    const presets = await this.find({ where: { id: In(ids) } });

    return presets;
  }

  async findByCode(code: string): Promise<AdminPermissionPresetEntity | null> {
    const preset = await this.findOne({ where: { code } });

    return preset;
  }

  async findAll(): Promise<AdminPermissionPresetEntity[]> {
    const presets = await this.find({ order: { id: 'DESC' } });

    return presets;
  }

  async createPreset(data: {
    readonly code: string;
    readonly name: string;
    readonly description: string | null;
  }): Promise<AdminPermissionPresetEntity> {
    const created = await this.save(
      this.create({
        code: data.code,
        name: data.name,
        description: data.description,
      }),
    );

    return created;
  }

  async updatePreset(id: number, data: { readonly name: string; readonly description: string | null }): Promise<void> {
    await this.update({ id }, { name: data.name, description: data.description });
  }

  async softDeleteById(id: number): Promise<void> {
    await this.softDelete({ id });
  }
}
