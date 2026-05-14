import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { GetUserResult } from '@libs/core-domain/src/domain/user/result/GetUserResult';

import { UserStatus, UserStatusUnion } from '@libs/core-enum/src/UserStatus.enum';

export class GetMeRes {
  @Exclude() private readonly _id: number;
  @Exclude() private readonly _email: string;
  @Exclude() private readonly _firstname: string | null;
  @Exclude() private readonly _lastname: string | null;
  @Exclude() private readonly _fullname: string;
  @Exclude() private readonly _avatarUrl: string | null;
  @Exclude() private readonly _status: UserStatusUnion;
  @Exclude() private readonly _createdAt: Date;

  constructor(user: GetUserResult) {
    this._id = user.id;
    this._email = user.email;
    this._firstname = user.firstname;
    this._lastname = user.lastname;
    this._fullname = user.fullname;
    this._avatarUrl = user.avatarUrl;
    this._status = user.status;
    this._createdAt = user.createdAt;
  }

  @ApiProperty({ type: 'integer', description: '유저 ID' })
  @Expose()
  get id(): number {
    return this._id;
  }

  @ApiProperty({ type: 'string', description: '이메일' })
  @Expose()
  get email(): string {
    return this._email;
  }

  @ApiProperty({ type: 'string', nullable: true, description: '이름' })
  @Expose()
  get firstname(): string | null {
    return this._firstname;
  }

  @ApiProperty({ type: 'string', nullable: true, description: '성' })
  @Expose()
  get lastname(): string | null {
    return this._lastname;
  }

  @ApiProperty({ type: 'string', description: 'firstname + lastname (둘 다 없으면 빈 문자열)' })
  @Expose()
  get fullname(): string {
    return this._fullname;
  }

  @ApiProperty({ type: 'string', nullable: true, description: '아바타 이미지 URL' })
  @Expose()
  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  @ApiProperty({ enum: UserStatus.keys(), description: '계정 상태' })
  @Expose()
  get status(): UserStatusUnion {
    return this._status;
  }

  @ApiProperty({ type: 'string', format: 'date-time', description: '가입 일시' })
  @Expose()
  get createdAt(): Date {
    return this._createdAt;
  }

  static of(user: GetUserResult): GetMeRes {
    return new GetMeRes(user);
  }
}
