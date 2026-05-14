import { ApiProperty } from '@nestjs/swagger';

import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { LanguageCodeUnion, languageCodeList } from '@libs/core-enum/src/Language.enum';

import { AdminSendBulkRawData } from '../../../../domain/mail/data/AdminSendBulkRawData';

export class AdminSendBulkRawReq {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'email' },
    minItems: 1,
    maxItems: 100,
    description: '수신자 이메일 목록 (최대 100건)',
    example: ['user1@example.com', 'user2@example.com'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsEmail({}, { each: true })
  readonly recipients!: string[];

  @ApiProperty({ type: 'string', maxLength: 200, description: '메일 제목' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  readonly subject!: string;

  @ApiProperty({
    type: 'string',
    description: '메일 본문 HTML. admin 이 직접 작성하므로 sanitize 책임은 admin 에게 있음.',
  })
  @IsString()
  @IsNotEmpty()
  readonly html!: string;

  @ApiProperty({
    enum: languageCodeList,
    required: false,
    default: 'en-US',
    description: '발송 언어 코드. 미지정 시 en-US. (이 호출의 모든 수신자에게 동일 언어로 발송)',
  })
  @IsOptional()
  @IsIn([...languageCodeList])
  readonly lang?: LanguageCodeUnion;

  toAdminSendBulkRawData(): AdminSendBulkRawData {
    return AdminSendBulkRawData.of({
      recipients: this.recipients,
      subject: this.subject,
      html: this.html,
      lang: this.lang ?? 'en-US',
    });
  }
}
