import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AdminUserIdParam {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: '유저 ID',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly id!: number;
}
