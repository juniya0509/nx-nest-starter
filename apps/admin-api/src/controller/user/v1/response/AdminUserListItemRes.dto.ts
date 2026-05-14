import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { CountryCallingCodeUnion, CountryCodeUnion } from '@libs/core-enum/src/Country.enum';
import { userStatusList, UserStatusUnion } from '@libs/core-enum/src/UserStatus.enum';

import { AdminUserListItemResult } from '../../../../domain/user/result/AdminUserListItemResult';

export class AdminUserListItemRes {
  @Exclude() private readonly _id: number;
  @Exclude() private readonly _email: string;
  @Exclude() private readonly _firstname: string | null;
  @Exclude() private readonly _lastname: string | null;
  @Exclude() private readonly _fullname: string;
  @Exclude() private readonly _avatarUrl: string | null;
  @Exclude() private readonly _status: UserStatusUnion;
  @Exclude() private readonly _countryCode: CountryCodeUnion | null;
  @Exclude() private readonly _countryCallingCode: CountryCallingCodeUnion | null;
  @Exclude() private readonly _phoneNumber: string | null;
  @Exclude() private readonly _createdAt: Date;

  constructor(result: AdminUserListItemResult) {
    this._id = result.id;
    this._email = result.email;
    this._firstname = result.firstname;
    this._lastname = result.lastname;
    this._fullname = result.fullname;
    this._avatarUrl = result.avatarUrl;
    this._status = result.status;
    this._countryCode = result.countryCode;
    this._countryCallingCode = result.countryCallingCode;
    this._phoneNumber = result.phoneNumber;
    this._createdAt = result.createdAt;
  }

  @Expose()
  @ApiProperty({ type: 'integer', description: '유저 ID' })
  get id(): number {
    return this._id;
  }

  @Expose()
  @ApiProperty({ type: 'string', description: '이메일' })
  get email(): string {
    return this._email;
  }

  @Expose()
  @ApiProperty({ type: 'string', nullable: true, description: '이름' })
  get firstname(): string | null {
    return this._firstname;
  }

  @Expose()
  @ApiProperty({ type: 'string', nullable: true, description: '성' })
  get lastname(): string | null {
    return this._lastname;
  }

  @Expose()
  @ApiProperty({ type: 'string', description: 'firstname + lastname (둘 다 없으면 빈 문자열)' })
  get fullname(): string {
    return this._fullname;
  }

  @Expose()
  @ApiProperty({ type: 'string', nullable: true, description: '아바타 URL' })
  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  @Expose()
  @ApiProperty({ enum: userStatusList, description: '유저 상태' })
  get status(): UserStatusUnion {
    return this._status;
  }

  @Expose()
  @ApiProperty({ type: 'string', nullable: true, description: '국가 코드 (ISO 3166-1 alpha-2)' })
  get countryCode(): CountryCodeUnion | null {
    return this._countryCode;
  }

  @Expose()
  @ApiProperty({ type: 'string', nullable: true, description: '국가 전화 코드 (예: +82)' })
  get countryCallingCode(): CountryCallingCodeUnion | null {
    return this._countryCallingCode;
  }

  @Expose()
  @ApiProperty({ type: 'string', nullable: true, description: '전화번호' })
  get phoneNumber(): string | null {
    return this._phoneNumber;
  }

  @Expose()
  @ApiProperty({ type: 'string', format: 'date-time', description: '가입 일시' })
  get createdAt(): Date {
    return this._createdAt;
  }

  static of(result: AdminUserListItemResult): AdminUserListItemRes {
    return new AdminUserListItemRes(result);
  }
}
