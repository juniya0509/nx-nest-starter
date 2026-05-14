import { Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '@libs/core-database/src/mysql/entity/Base.entity';

import { AdminAccountEntity } from '../admin-account/AdminAccount.entity';

import { AdminPermissionEntity } from './AdminPermission.entity';

@Entity({ name: 'admin_account_permission' })
@Unique('UQ_admin_account_permission_account_permission', ['adminAccount', 'permission'])
export class AdminAccountPermissionEntity extends BaseEntity {
  @ManyToOne(() => AdminAccountEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'admin_account_id', referencedColumnName: 'id' })
  adminAccount!: AdminAccountEntity;

  @ManyToOne(() => AdminPermissionEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'permission_id', referencedColumnName: 'id' })
  permission!: AdminPermissionEntity;
}
