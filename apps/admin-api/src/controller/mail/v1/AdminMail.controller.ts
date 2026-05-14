import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminMailService } from '../../../domain/mail/AdminMail.service';
import { AdminPermission } from '../../../enum/AdminPermission.enum';
import { AdminAuth } from '../../../middleware/auth/AdminAuth.decorator';
import { AdminSwaggerApiOperation } from '../../../support/api-docs/AdminSwaggerApiOperation';
import { AdminSwaggerApiResponseError } from '../../../support/api-docs/AdminSwaggerApiResponseError';
import { AdminSwaggerApiResponseSuccess } from '../../../support/api-docs/AdminSwaggerApiResponseSuccess';
import { AdminSwaggerApiTags } from '../../../support/api-docs/AdminSwaggerApiTags';
import { AdminApiResponse } from '../../../support/response/AdminApiResponse';

import { AdminSendBulkRawReq } from './request/AdminSendBulkRawReq.dto';
import { AdminSendBulkTemplateReq } from './request/AdminSendBulkTemplateReq.dto';
import { AdminSendMailRes } from './response/AdminSendMailRes.dto';

@AdminSwaggerApiTags('Mail')
@Controller()
export class AdminMailController {
  constructor(private readonly adminMailService: AdminMailService) {}

  @AdminSwaggerApiOperation({
    summary: '메일 발송 (raw)',
    description:
      '관리자가 자유 입력한 subject/html 으로 다수 수신자에게 발송합니다.\n' +
      '개별 수신자별 성공/실패가 응답에 포함됩니다 (전체가 실패해도 200).\n' +
      '최대 100명까지 한 번에 발송할 수 있습니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminSendMailRes)
  @AdminSwaggerApiResponseError(400, [CoreDomainError.INVALID_MAIL_RECIPIENT])
  @AdminAuth({ requireAll: [AdminPermission.MAIL_SEND] })
  @HttpCode(200)
  @Post('/v1/mails/bulk/raw')
  async sendBulkRaw(@Body() request: AdminSendBulkRawReq): Promise<AdminApiResponse<AdminSendMailRes>> {
    const result = await this.adminMailService.sendBulkRaw(request.toAdminSendBulkRawData());
    return AdminApiResponse.successWithData(AdminSendMailRes.of(result));
  }

  @AdminSwaggerApiOperation({
    summary: '메일 발송 (template)',
    description:
      '사전 정의된 템플릿 + 변수로 다수 수신자에게 발송합니다.\n' +
      'templateId 와 그에 맞는 vars 를 입력합니다 (templateId 별 필요 키는 vars 필드 설명 참고).',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminSendMailRes)
  @AdminSwaggerApiResponseError(400, [CoreDomainError.INVALID_MAIL_RECIPIENT])
  @AdminAuth({ requireAll: [AdminPermission.MAIL_SEND] })
  @HttpCode(200)
  @Post('/v1/mails/bulk/template')
  async sendBulkByTemplate(@Body() request: AdminSendBulkTemplateReq): Promise<AdminApiResponse<AdminSendMailRes>> {
    const result = await this.adminMailService.sendBulkByTemplate(request.toAdminSendBulkTemplateData());
    return AdminApiResponse.successWithData(AdminSendMailRes.of(result));
  }
}
