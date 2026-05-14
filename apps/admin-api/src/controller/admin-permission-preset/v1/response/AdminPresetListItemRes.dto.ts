import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { AdminPermissionPresetListItemResult } from '../../../../domain/admin-permission-preset/result/AdminPermissionPresetListItemResult';

export class AdminPresetListItemRes {
  @Exclude() private readonly _id: number;
  @Exclude() private readonly _code: string;
  @Exclude() private readonly _name: string;
  @Exclude() private readonly _description: string | null;
  @Exclude() private readonly _permissionCount: number;
  @Exclude() private readonly _createdAt: Date;

  constructor(result: AdminPermissionPresetListItemResult) {
    this._id = result.id;
    this._code = result.code;
    this._name = result.name;
    this._description = result.description;
    this._permissionCount = result.permissionCount;
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
  @ApiProperty({ type: 'integer', description: '포함된 권한 수' })
  get permissionCount(): number {
    return this._permissionCount;
  }

  @Expose()
  @ApiProperty({ type: 'string', format: 'date-time', description: '생성 일시' })
  get createdAt(): Date {
    return this._createdAt;
  }

  static of(result: AdminPermissionPresetListItemResult): AdminPresetListItemRes {
    return new AdminPresetListItemRes(result);
  }
}
