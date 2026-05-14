import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';
import { UserDeviceTypeUnion } from '@libs/core-enum/src/UserDeviceType.enum';

import { BaseEntity } from '../Base.entity';

import { UserEntity } from './User.entity';

@Entity({ name: 'user_device' })
@Index('IDX_user_device_user_id', ['user'])
export class UserDeviceEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserEntity;

  @Column({
    type: 'varchar',
    length: 30,
    comment: '디바이스 타입 (WEB_BROWSER / IOS_APP / ANDROID_APP)',
  })
  deviceType!: UserDeviceTypeUnion;

  @Column({
    type: 'varchar',
    length: 500,
    unique: true,
    comment: 'FCM registration token. device 고유 → 동일 token 이 다른 user 로 들어오면 upsert 로 user/lang/type 갱신.',
  })
  pushToken!: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'en-US',
    comment: '이 device 의 언어. push 등 device 단위 채널에서 사용 (메일은 user.defaultLanguage 사용).',
  })
  language!: LanguageCodeUnion;
}
