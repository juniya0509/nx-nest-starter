import { ApiProperty } from '@nestjs/swagger';

import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsObject, IsOptional } from 'class-validator';

import { LanguageCodeUnion, languageCodeList } from '@libs/core-enum/src/Language.enum';

import { AdminSendBulkTemplateData } from '../../../../domain/mail/data/AdminSendBulkTemplateData';
import { ADMIN_MAIL_TEMPLATE_IDS, AdminMailTemplateId } from '../../../../domain/mail/template/AdminMailTemplateId';

export class AdminSendBulkTemplateReq {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'email' },
    minItems: 1,
    maxItems: 100,
    description: '수신자 이메일 목록 (최대 100건)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsEmail({}, { each: true })
  readonly recipients!: string[];

  @ApiProperty({
    enum: ADMIN_MAIL_TEMPLATE_IDS,
    description: '템플릿 식별자',
    example: 'announcement',
  })
  @IsIn(ADMIN_MAIL_TEMPLATE_IDS as unknown as string[])
  readonly templateId!: AdminMailTemplateId;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: '템플릿이 요구하는 변수 객체. templateId 별 필요 키:\n' + '- `announcement`: { subject: string, bodyHtml: string }',
    example: { subject: '점검 안내', bodyHtml: '<p>3월 5일 02:00~04:00 시스템 점검 예정입니다.</p>' },
  })
  @IsObject()
  readonly vars!: Record<string, unknown>;

  @ApiProperty({
    enum: languageCodeList,
    required: false,
    default: 'en-US',
    description: '발송 언어 코드. 미지정 시 en-US. (이 호출의 모든 수신자에게 동일 언어로 발송)',
  })
  @IsOptional()
  @IsIn([...languageCodeList])
  readonly lang?: LanguageCodeUnion;

  toAdminSendBulkTemplateData(): AdminSendBulkTemplateData {
    return AdminSendBulkTemplateData.of({
      recipients: this.recipients,
      templateId: this.templateId,
      vars: this.vars,
      lang: this.lang ?? 'en-US',
    });
  }
}
