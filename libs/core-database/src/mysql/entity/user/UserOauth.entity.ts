import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { AuthProviderUnion } from '@libs/core-enum/src/AuthProvider.enum';

import { BaseEntity } from '../Base.entity';

import { UserEntity } from './User.entity';

@Entity({ name: 'user_oauth' })
@Unique('UQ_user_oauth_user_provider', ['user', 'provider'])
@Index('IDX_user_oauth_logto_user_id', ['logtoUserId'])
export class UserOauthEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserEntity;

  @Column({
    type: 'varchar',
    length: 64,
    comment: 'Logto 사용자 식별자 (Logto가 동일 user에 여러 provider 연결 시 같은 sub 공유 가능)',
  })
  logtoUserId!: string;

  @Column({
    type: 'varchar',
    length: 30,
    comment: '로그인 수단 (KAKAO/NAVER/APPLE/GOOGLE/EMAIL)',
  })
  provider!: AuthProviderUnion;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '소셜 측 사용자 식별자 (이메일 OTP는 null)',
  })
  providerUserId!: string | null;
}
