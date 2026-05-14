import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { AdminPermissionResult } from '../../../../domain/admin-permission/result/AdminPermissionResult';

export class AdminPermissionItemRes {
  @Exclude() private readonly _id: number;
  @Exclude() private readonly _code: string;
  @Exclude() private readonly _groupCode: string;
  @Exclude() private readonly _description: string;

  constructor(result: AdminPermissionResult) {
    this._id = result.id;
    this._code = result.code;
    this._groupCode = result.groupCode;
    this._description = result.description;
  }

  @Expose()
  @ApiProperty({ type: 'integer', description: '권한 ID' })
  get id(): number {
    return this._id;
  }

  @Expose()
  @ApiProperty({ type: 'string', description: '권한 코드' })
  get code(): string {
    return this._code;
  }

  @Expose()
  @ApiProperty({ type: 'string', description: '권한 그룹 코드 (예: user, admin-management)' })
  get groupCode(): string {
    return this._groupCode;
  }

  @Expose()
  @ApiProperty({ type: 'string', description: '권한 표시명' })
  get description(): string {
    return this._description;
  }

  static of(result: AdminPermissionResult): AdminPermissionItemRes {
    return new AdminPermissionItemRes(result);
  }
}
