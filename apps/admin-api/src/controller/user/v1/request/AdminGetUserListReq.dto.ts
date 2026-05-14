import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { userStatusList, UserStatusUnion } from '@libs/core-enum/src/UserStatus.enum';

import { AdminGetUserListData } from '../../../../domain/user/data/AdminGetUserListData';

export class AdminGetUserListQuery {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    default: 1,
    required: false,
    description: '페이지 (1-base)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
    description: '페이지당 결과 수',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit: number = 20;

  @ApiProperty({
    type: 'string',
    required: false,
    description: '검색 키워드 (이메일/이름 부분 일치)',
  })
  @IsOptional()
  @IsString()
  readonly keyword?: string;

  @ApiProperty({
    enum: userStatusList,
    required: false,
    description: '유저 상태 필터',
  })
  @IsOptional()
  @IsIn(userStatusList)
  readonly status?: UserStatusUnion;

  toAdminGetUserListData(): AdminGetUserListData {
    return AdminGetUserListData.of({
      page: this.page,
      limit: this.limit,
      keyword: this.keyword ?? '',
      status: this.status ?? null,
    });
  }
}
