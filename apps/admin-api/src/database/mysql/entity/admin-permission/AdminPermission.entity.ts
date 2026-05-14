import { Column, Entity } from 'typeorm';

import { BaseEntity } from '@libs/core-database/src/mysql/entity/Base.entity';

@Entity({ name: 'admin_permission' })
export class AdminPermissionEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    unique: true,
    length: 100,
    comment: '권한 코드 (AdminPermission enum의 code)',
  })
  code!: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '권한 그룹 (AdminPermission enum의 group)',
  })
  groupCode!: string;

  @Column({
    type: 'varchar',
    length: 200,
    comment: '권한 표시명',
  })
  description!: string;
}
