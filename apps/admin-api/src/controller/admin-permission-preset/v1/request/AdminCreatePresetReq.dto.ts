import { ApiProperty } from '@nestjs/swagger';

import { ArrayUnique, IsArray, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { AdminCreatePermissionPresetData } from '../../../../domain/admin-permission-preset/data/AdminCreatePermissionPresetData';
import { adminPermissionCodeList } from '../../../../enum/AdminPermission.enum';

export class AdminCreatePresetReq {
  @ApiProperty({
    type: 'string',
    minLength: 1,
    maxLength: 100,
    pattern: '^[A-Z][A-Z0-9_]*$',
    description: '프리셋 코드 (대문자/숫자/언더스코어, 대문자로 시작)',
    example: 'ROOT',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  readonly code!: string;

  @ApiProperty({
    type: 'string',
    minLength: 1,
    maxLength: 100,
    description: '프리셋 표시명',
    example: '루트 관리자',
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
    description: '프리셋에 포함할 권한 코드 목록',
    example: ['USER_LIST', 'USER_READ'],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(adminPermissionCodeList, { each: true })
  readonly permissionCodes!: string[];

  toAdminCreatePermissionPresetData(): AdminCreatePermissionPresetData {
    return AdminCreatePermissionPresetData.fromReqDto({
      code: this.code,
      name: this.name,
      description: this.description ?? null,
      permissionCodes: this.permissionCodes,
    });
  }
}
