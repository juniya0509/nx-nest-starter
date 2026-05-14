import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { AdminGetPermissionPresetResult } from '../../../../domain/admin-permission-preset/result/AdminGetPermissionPresetResult';

export class AdminGetPresetRes {
  @Exclude() private readonly _id: number;
  @Exclude() private readonly _code: string;
  @Exclude() private readonly _name: string;
  @Exclude() private readonly _description: string | null;
  @Exclude() private readonly _permissionCodes: string[];
  @Exclude() private readonly _createdAt: Date;

  constructor(result: AdminGetPermissionPresetResult) {
    this._id = result.id;
    this._code = result.code;
    this._name = result.name;
    this._description = result.description;
    this._permissionCodes = result.permissionCodes;
    this._createdAt = result.createdAt;
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

  @Expose()
  @ApiProperty({ type: 'string', nullable: true, description: '프리셋 설명' })
  get description(): string | null {
    return this._description;
  }

  @Expose()
  @ApiProperty({ type: 'string', isArray: true, description: '포함된 권한 코드 목록' })
  get permissionCodes(): string[] {
    return this._permissionCodes;
  }

  @Expose()
  @ApiProperty({ type: 'string', format: 'date-time', description: '생성 일시' })
  get createdAt(): Date {
    return this._createdAt;
  }

  static of(result: AdminGetPermissionPresetResult): AdminGetPresetRes {
    return new AdminGetPresetRes(result);
  }
}
