import { ApiProperty } from '@nestjs/swagger';

import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class AdminSetPresetsReq {
  @ApiProperty({
    type: 'integer',
    isArray: true,
    description: '관리자에게 적용할 프리셋 ID 목록 (전체 교체)',
    example: [1, 2],
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  readonly presetIds!: number[];
}
