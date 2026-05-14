import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { AdminCreateAccountData } from '../../../../domain/admin-account/data/AdminCreateAccountData';

export class AdminCreateAccountReq {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: '관리자로 등록할 사용자 ID (user.id)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  readonly userId!: number;

  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
    maxLength: 500,
    description: '관리자 메모 (선택)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly memo?: string;

  toAdminCreateAccountData(): AdminCreateAccountData {
    return AdminCreateAccountData.fromReqDto({
      userId: this.userId,
      memo: this.memo ?? null,
    });
  }
}
