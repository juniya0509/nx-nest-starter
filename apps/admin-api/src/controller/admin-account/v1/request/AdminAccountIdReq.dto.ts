import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AdminAccountIdParam {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: '관리자 계정 ID',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly id!: number;
}
