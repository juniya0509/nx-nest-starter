import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { AdminAccountListItemResult } from '../../../../domain/admin-account/result/AdminAccountListItemResult';
import { AdminAccountStatusUnion } from '../../../../enum/AdminAccountStatus.enum';

export class AdminAccountListItemRes {
  @Exclude() private readonly _id: number;
  @Exclude() private readonly _userId: number;
  @Exclude() private readonly _userEmail: string;
  @Exclude() private readonly _userFullname: string;
  @Exclude() private readonly _userAvatarUrl: string | null;
  @Exclude() private readonly _status: AdminAccountStatusUnion;
  @Exclude() private readonly _memo: string | null;
  @Exclude() private readonly _createdAt: Date;

  constructor(result: AdminAccountListItemResult) {
    this._id = result.id;
    this._userId = result.userId;
    this._userEmail = result.userEmail;
    this._userFullname = result.userFullname;
    this._userAvatarUrl = result.userAvatarUrl;
    this._status = result.status;
    this._memo = result.memo;
    this._createdAt = result.createdAt;
  }

  @Expose()
  @ApiProperty({ type: 'integer', description: '관리자 계정 ID' })
  get id(): number {
    return this._id;
  }

  @Expose()
  @ApiProperty({ type: 'integer', description: '연결된 사용자 ID' })
  get userId(): number {
    return this._userId;
  }

  @Expose()
  @ApiProperty({ type: 'string', description: '사용자 이메일' })
  get userEmail(): string {
    return this._userEmail;
  }

  @Expose()
  @ApiProperty({ type: 'string', description: '사용자 이름 (이름 + 성)' })
  get userFullname(): string {
    return this._userFullname;
  }

  @Expose()
  @ApiProperty({ type: 'string', nullable: true, description: '사용자 아바타 URL' })
  get userAvatarUrl(): string | null {
    return this._userAvatarUrl;
  }

  @Expose()
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED'], description: '관리자 상태' })
  get status(): AdminAccountStatusUnion {
    return this._status;
  }

  @Expose()
  @ApiProperty({ type: 'string', nullable: true, description: '관리자 메모' })
  get memo(): string | null {
    return this._memo;
  }

  @Expose()
  @ApiProperty({ type: 'string', format: 'date-time', description: '관리자 등록 일시' })
  get createdAt(): Date {
    return this._createdAt;
  }

  static of(result: AdminAccountListItemResult): AdminAccountListItemRes {
    return new AdminAccountListItemRes(result);
  }
}
