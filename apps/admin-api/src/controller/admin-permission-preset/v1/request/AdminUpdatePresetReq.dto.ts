import { ApiProperty } from '@nestjs/swagger';

import { ArrayUnique, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { AdminUpdatePermissionPresetData } from '../../../../domain/admin-permission-preset/data/AdminUpdatePermissionPresetData';
import { adminPermissionCodeList } from '../../../../enum/AdminPermission.enum';

export class AdminUpdatePresetReq {
  @ApiProperty({
    type: 'string',
    minLength: 1,
    maxLength: 100,
    description: '프리셋 표시명',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  readonly name!: string;

  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
    maxLength: 500,
    description: '프리셋 설명',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @ApiProperty({
    type: 'string',
    isArray: true,
    enum: adminPermissionCodeList,
    description: '프리셋에 포함할 권한 코드 목록 (전체 교체)',
    example: ['USER_LIST', 'USER_READ'],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(adminPermissionCodeList, { each: true })
  readonly permissionCodes!: string[];

  toAdminUpdatePermissionPresetData(): AdminUpdatePermissionPresetData {
    return AdminUpdatePermissionPresetData.fromReqDto({
      name: this.name,
      description: this.description ?? null,
      permissionCodes: this.permissionCodes,
    });
  }
}
