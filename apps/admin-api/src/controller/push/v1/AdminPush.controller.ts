import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminPushService } from '../../../domain/push/AdminPush.service';
import { AdminPermission } from '../../../enum/AdminPermission.enum';
import { AdminAuth } from '../../../middleware/auth/AdminAuth.decorator';
import { AdminSwaggerApiOperation } from '../../../support/api-docs/AdminSwaggerApiOperation';
import { AdminSwaggerApiResponseError } from '../../../support/api-docs/AdminSwaggerApiResponseError';
import { AdminSwaggerApiResponseSuccess } from '../../../support/api-docs/AdminSwaggerApiResponseSuccess';
import { AdminSwaggerApiTags } from '../../../support/api-docs/AdminSwaggerApiTags';
import { AdminApiResponse } from '../../../support/response/AdminApiResponse';

import { AdminSendBulkPushRawReq } from './request/AdminSendBulkPushRawReq.dto';
import { AdminSendPushRes } from './response/AdminSendPushRes.dto';

@AdminSwaggerApiTags('Push')
@Controller()
export class AdminPushController {
  constructor(private readonly adminPushService: AdminPushService) {}

  @AdminSwaggerApiOperation({
    summary: 'Push 알림 발송 (raw)',
    description:
      '관리자가 자유 입력한 단일 title/body 로 다수 user 의 모든 device 에 push 알림을 발송합니다.\n' +
      'lang 분기 없이 모든 device 에 동일 콘텐츠가 전송됩니다 (다국어가 필요하면 lang 별로 별도 호출).\n' +
      '미등록 user.id 가 한 명이라도 있으면 400 으로 거부합니다. user_device 가 없는 user 는 발송 대상에서 자동 제외.\n' +
      '응답의 successCount/failedCount 는 user 수가 아닌 device 수 기준입니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminSendPushRes)
  @AdminSwaggerApiResponseError(400, [CoreDomainError.INVALID_MAIL_RECIPIENT])
  @AdminAuth({ requireAll: [AdminPermission.PUSH_SEND] })
  @HttpCode(200)
  @Post('/v1/pushes/bulk/raw')
  async sendBulkRaw(@Body() request: AdminSendBulkPushRawReq): Promise<AdminApiResponse<AdminSendPushRes>> {
    const result = await this.adminPushService.sendBulkRaw(request.toAdminSendBulkPushRawData());
    return AdminApiResponse.successWithData(AdminSendPushRes.of(result));
  }
}
