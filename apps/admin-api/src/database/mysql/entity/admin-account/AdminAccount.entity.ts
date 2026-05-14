import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';

import { BaseEntity } from '@libs/core-database/src/mysql/entity/Base.entity';
import { UserEntity } from '@libs/core-database/src/mysql/entity/user/User.entity';

import { AdminAccountStatusUnion } from '../../../../enum/AdminAccountStatus.enum';

@Entity({ name: 'admin_account' })
@Unique('UQ_admin_account_user_id', ['user'])
export class AdminAccountEntity extends BaseEntity {
  @OneToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserEntity;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'ACTIVE',
    comment: '관리자 상태 (ACTIVE/SUSPENDED)',
  })
  status!: AdminAccountStatusUnion;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '관리자 메모',
  })
  memo!: string | null;
}
