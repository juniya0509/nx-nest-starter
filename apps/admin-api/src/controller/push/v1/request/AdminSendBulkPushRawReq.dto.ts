import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { AdminSendBulkPushRawData } from '../../../../domain/push/data/AdminSendBulkPushRawData';

export class AdminSendBulkPushRawReq {
  @ApiProperty({
    type: 'array',
    items: { type: 'integer', minimum: 1 },
    minItems: 1,
    maxItems: 100,
    description: '발송 대상 user.id 목록 (최대 100명). 각 user 의 모든 device 에 동일 콘텐츠 발송.',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  @Min(1, { each: true })
  readonly userIds!: number[];

  @ApiProperty({ type: 'string', maxLength: 200, description: 'push 알림 제목' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  readonly title!: string;

  @ApiProperty({ type: 'string', maxLength: 1000, description: 'push 알림 본문' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  readonly body!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description:
      'FCM data payload (deeplink 등 클라이언트 라우팅 정보). 값은 모두 string 이어야 함 (FCM 규격). 예: { route: "/notice/123" }',
  })
  @IsOptional()
  @IsObject()
  readonly dataPayload?: Record<string, string>;

  toAdminSendBulkPushRawData(): AdminSendBulkPushRawData {
    return AdminSendBulkPushRawData.of({
      userIds: this.userIds,
      title: this.title,
      body: this.body,
      dataPayload: this.dataPayload ?? null,
    });
  }
}
