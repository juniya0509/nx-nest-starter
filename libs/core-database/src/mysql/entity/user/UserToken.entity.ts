import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../Base.entity';

import { UserEntity } from './User.entity';

@Entity({ name: 'user_token' })
@Index('IDX_user_token_user_id', ['user'])
@Index('IDX_user_token_expires_at', ['expiresAt'])
export class UserTokenEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserEntity;

  @Column({
    type: 'varchar',
    length: 500,
    unique: true,
    comment: '발급된 refresh token',
  })
  refreshToken!: string;

  @Column({
    type: 'datetime',
    comment: 'refresh token 만료 시각',
  })
  expiresAt!: Date;
}
