import { Column, Entity } from 'typeorm';

import { BaseEntity } from '@libs/core-database/src/mysql/entity/Base.entity';

@Entity({ name: 'admin_permission_preset' })
export class AdminPermissionPresetEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    unique: true,
    length: 100,
    comment: '프리셋 코드 (ex: ROOT)',
  })
  code!: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '프리셋 표시명',
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '프리셋 설명',
  })
  description!: string | null;
}
