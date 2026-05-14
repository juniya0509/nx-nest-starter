import { Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '@libs/core-database/src/mysql/entity/Base.entity';

import { AdminAccountEntity } from '../admin-account/AdminAccount.entity';

import { AdminPermissionPresetEntity } from './AdminPermissionPreset.entity';

@Entity({ name: 'admin_account_preset' })
@Unique('UQ_admin_account_preset_account_preset', ['adminAccount', 'preset'])
export class AdminAccountPresetEntity extends BaseEntity {
  @ManyToOne(() => AdminAccountEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'admin_account_id', referencedColumnName: 'id' })
  adminAccount!: AdminAccountEntity;

  @ManyToOne(() => AdminPermissionPresetEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'preset_id', referencedColumnName: 'id' })
  preset!: AdminPermissionPresetEntity;
}
