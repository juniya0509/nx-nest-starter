import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LogoutReq {
  @ApiProperty({
    type: 'string',
    minLength: 1,
    description: '로그아웃할 디바이스의 refresh token. 해당 row만 무효화되어 다른 기기 세션은 유지됨.',
  })
  @IsString()
  @IsNotEmpty()
  readonly refreshToken!: string;

  @ApiProperty({
    type: 'string',
    required: false,
    description: '이 디바이스의 FCM push token. 보내면 해당 device 등록을 함께 삭제 (push 비활성). 미전송 시 device 는 그대로 유지.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly pushToken?: string;
}
