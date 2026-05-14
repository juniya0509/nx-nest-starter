import { Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '@libs/core-database/src/mysql/entity/Base.entity';

import { AdminPermissionEntity } from './AdminPermission.entity';
import { AdminPermissionPresetEntity } from './AdminPermissionPreset.entity';

@Entity({ name: 'admin_permission_preset_item' })
@Unique('UQ_admin_permission_preset_item_preset_permission', ['preset', 'permission'])
export class AdminPermissionPresetItemEntity extends BaseEntity {
  @ManyToOne(() => AdminPermissionPresetEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'preset_id', referencedColumnName: 'id' })
  preset!: AdminPermissionPresetEntity;

  @ManyToOne(() => AdminPermissionEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'permission_id', referencedColumnName: 'id' })
  permission!: AdminPermissionEntity;
}
