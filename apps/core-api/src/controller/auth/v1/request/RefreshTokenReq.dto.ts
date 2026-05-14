import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenReq {
  @ApiProperty({
    type: 'string',
    minLength: 1,
    description: '발급받은 refresh token',
  })
  @IsString()
  @IsNotEmpty()
  readonly refreshToken!: string;
}
