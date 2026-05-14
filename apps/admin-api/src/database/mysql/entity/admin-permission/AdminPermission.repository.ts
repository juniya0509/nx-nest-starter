import { In, Repository } from 'typeorm';

import { CustomRepository } from '@libs/core-database/src/mysql/decorator/TypeOrmCustomRepository.decorator';

import { AdminPermissionEntity } from './AdminPermission.entity';

@CustomRepository(AdminPermissionEntity)
export class AdminPermissionRepository extends Repository<AdminPermissionEntity> {
  async findAll(): Promise<AdminPermissionEntity[]> {
    const permissions = await this.find({ order: { groupCode: 'ASC', code: 'ASC' } });

    return permissions;
  }

  async findByCodes(codes: string[]): Promise<AdminPermissionEntity[]> {
    if (codes.length === 0) return [];

    const permissions = await this.find({
      where: { code: In(codes) },
    });

    return permissions;
  }

  async findManyByIds(ids: number[]): Promise<AdminPermissionEntity[]> {
    if (ids.length === 0) return [];

    const permissions = await this.find({
      where: { id: In(ids) },
    });

    return permissions;
  }

  async insertIgnoreMany(rows: { readonly code: string; readonly groupCode: string; readonly description: string }[]): Promise<void> {
    if (rows.length === 0) return;

    await this.createQueryBuilder().insert().into(AdminPermissionEntity).values(rows).orIgnore().execute();
  }
}
