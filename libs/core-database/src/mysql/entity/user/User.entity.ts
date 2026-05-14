import { Column, Entity, Index } from 'typeorm';

import { CountryCallingCodeUnion, CountryCodeUnion } from '@libs/core-enum/src/Country.enum';
import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';
import { UserStatusUnion } from '@libs/core-enum/src/UserStatus.enum';

import { BaseEntity } from '../Base.entity';

@Entity({ name: 'user' })
@Index('IDX_user_calling_code_phone', ['countryCallingCode', 'phoneNumber'])
export class UserEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    unique: true,
    length: 300,
    comment: '이메일',
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '이름(이름)',
  })
  firstname!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '이름(성)',
  })
  lastname!: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '아바타 URL',
  })
  avatarUrl!: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    comment: '사용자 상태',
  })
  status!: UserStatusUnion;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '국가 전화 코드',
  })
  countryCallingCode!: CountryCallingCodeUnion | null;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    comment: '전화번호',
  })
  phoneNumber!: string | null;

  @Column({
    type: 'varchar',
    length: 2,
    nullable: true,
    comment: '국가 코드',
  })
  countryCode!: CountryCodeUnion | null;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'en-US',
    // "default" 인 이유: push 알림은 사용자가 등록한 device 단위로 별도 lang 을 보관해야 하므로
    // (한 사용자가 여러 기기에서 다른 언어 사용 가능), user 차원의 값은 "기본값" 으로만 의미를 가진다.
    // 메일 등 device 무관 채널에서는 이 값을 사용한다.
    comment: '사용자 기본 언어 코드. push 등 device 별 언어는 user_device 에서 별도 관리.',
  })
  defaultLanguage!: LanguageCodeUnion;
}
