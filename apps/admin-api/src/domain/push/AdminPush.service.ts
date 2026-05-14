import { Injectable } from '@nestjs/common';

import { PushSender } from '@libs/core-domain/src/domain/push/Push.sender';
import { SendPushResult } from '@libs/core-domain/src/domain/push/result/SendPushResult';
import { UserDeviceReader } from '@libs/core-domain/src/domain/user/UserDevice.reader';

import { AdminPushValidator } from './AdminPush.validator';
import { AdminSendBulkPushRawData } from './data/AdminSendBulkPushRawData';

/**
 * 관리자 전용 push 발송 service.
 * - 입력은 user.id 단위. 각 user 의 모든 device 를 모아 한 번에 sendBulk.
 * - 단일 title/body 라 lang 분기 없음 (모든 device 에 동일 콘텐츠). 다국어가 필요하면 호출자가 lang 별로 따로 호출.
 */
@Injectable()
export class AdminPushService {
  constructor(
    private readonly pushSender: PushSender,
    private readonly userDeviceReader: UserDeviceReader,
    private readonly adminPushValidator: AdminPushValidator,
  ) {}

  async sendBulkRaw(data: AdminSendBulkPushRawData): Promise<SendPushResult> {
    this.adminPushValidator.assertValidCount(data.userIds);
    await this.adminPushValidator.assertAllRegistered(data.userIds);

    const devices = await this.userDeviceReader.findByUserIds(data.userIds);
    if (devices.length === 0) {
      return SendPushResult.empty();
    }

    return this.pushSender.sendBulk({
      tokens: devices.map((d) => d.pushToken),
      title: data.title,
      body: data.body,
      data: data.dataPayload ?? undefined,
    });
  }
}
