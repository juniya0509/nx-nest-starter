import { ApiProperty } from '@nestjs/swagger';

import { ArrayUnique, IsArray, IsIn, IsString } from 'class-validator';

import { adminPermissionCodeList } from '../../../../enum/AdminPermission.enum';

export class AdminSetPermissionsReq {
  @ApiProperty({
    type: 'string',
    isArray: true,
    enum: adminPermissionCodeList,
    description: '관리자에게 직접 부여할 권한 코드 목록 (전체 교체)',
    example: ['USER_LIST', 'USER_READ'],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(adminPermissionCodeList, { each: true })
  readonly permissionCodes!: string[];
}
