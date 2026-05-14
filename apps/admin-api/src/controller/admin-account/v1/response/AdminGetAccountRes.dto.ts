import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { AdminGetAccountResult } from '../../../../domain/admin-account/result/AdminGetAccountResult';
import { AdminAccountStatusUnion } from '../../../../enum/AdminAccountStatus.enum';

class AppliedPresetRes {
  @Exclude() private readonly _id: number;
  @Exclude() private readonly _code: string;
  @Exclude() private readonly _name: string;

  constructor(props: { id: number; code: string; name: string }) {
    this._id = props.id;
    this._code = props.code;
    this._name = props.name;
  }

  @Expose()
  @ApiProperty({ type: 'integer', description: '프리셋 ID' })
  get id(): number {
    return this._id;
  }

  @Expose()
  @ApiProperty({ type: 'string', description: '프리셋 코드' })
  get code(): string {
    return this._code;
  }

  @Expose()
  @ApiProperty({ type: 'string', description: '프리셋 이름' })
  get name(): string {
    return this._name;
  }
}

export class AdminGetAccountRes {
  @Exclude() private readonly _id: number;
  @Exclude() private readonly _userId: number;
  @Exclude() private readonly _userEmail: string;
  @Exclude() private readonly _userFullname: string;
  @Exclude() private readonly _userAvatarUrl: string | null;
  @Exclude() private readonly _status: AdminAccountStatusUnion;
  @Exclude() private readonly _memo: string | null;
  @Exclude() private readonly _createdAt: Date;
  @Exclude() private readonly _directPermissionCodes: string[];
  @Exclude() private readonly _appliedPresets: AppliedPresetRes[];
  @Exclude() private readonly _effectivePermissionCodes: string[];

  constructor(result: AdminGetAccountResult) {
    this._id = result.id;
    this._userId = result.userId;
    this._userEmail = result.userEmail;
    this._userFullname = result.userFullname;
    this._userAvatarUrl = result.userAvatarUrl;
    this._status = result.status;
    this._memo = result.memo;
    this._createdAt = result.createdAt;
    this._directPermissionCodes = result.directPermissionCodes;
    this._appliedPresets = result.appliedPresets.map((preset) => new AppliedPresetRes(preset));
    this._effectivePermissionCodes = result.effectivePermissionCodes;
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
  @ApiProperty({ type: 'string', description: '사용자 이름' })
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

  @Expose()
  @ApiProperty({ type: 'string', isArray: true, description: '직접 부여된 권한 코드 목록' })
  get directPermissionCodes(): string[] {
    return this._directPermissionCodes;
  }

  @Expose()
  @ApiProperty({ type: [AppliedPresetRes], description: '적용된 프리셋 목록' })
  get appliedPresets(): AppliedPresetRes[] {
    return this._appliedPresets;
  }

  @Expose()
  @ApiProperty({ type: 'string', isArray: true, description: '유효 권한 코드 (직접 + 프리셋 합집합)' })
  get effectivePermissionCodes(): string[] {
    return this._effectivePermissionCodes;
  }

  static of(result: AdminGetAccountResult): AdminGetAccountRes {
    return new AdminGetAccountRes(result);
  }
}
