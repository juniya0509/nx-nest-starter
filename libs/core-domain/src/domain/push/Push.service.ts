import { Injectable } from '@nestjs/common';

import { GetUserDeviceResult } from '../user/result/GetUserDeviceResult';
import { UserDeviceReader } from '../user/UserDevice.reader';

import { PushSender } from './Push.sender';
import { SendPushResult } from './result/SendPushResult';
import { PushTemplate } from './template/PushTemplate';

/**
 * 어떤 user(들) 의 모든 device 에 다국어 push 를 발송하는 service.
 * - device.language 별로 그룹핑 후 lang 별 title/body 를 빌드해 각 그룹을 sendBulk 호출 (FCM 호출 횟수 = lang 종류 수).
 * - data payload 는 lang 무관 → template 의 buildData 가 있으면 한 번만 빌드.
 *
 * 자동 발송 (예: 알림 이벤트) / 관리자 단체 발송 (admin-api 의 service 가 이걸 호출) 모두 활용.
 */
@Injectable()
export class PushService {
  constructor(
    private readonly pushSender: PushSender,
    private readonly userDeviceReader: UserDeviceReader,
  ) {}

  /** 단일 user 의 모든 device 에 발송. */
  async sendToUser<TVars>(userId: number, template: PushTemplate<TVars>, vars: TVars): Promise<SendPushResult> {
    const devices = await this.userDeviceReader.findByUserId(userId);
    return this.dispatch(devices, template, vars);
  }

  /** 다수 user 의 모든 device 에 발송 (admin bulk push 용). */
  async sendToUsers<TVars>(userIds: ReadonlyArray<number>, template: PushTemplate<TVars>, vars: TVars): Promise<SendPushResult> {
    const devices = await this.userDeviceReader.findByUserIds(userIds);
    return this.dispatch(devices, template, vars);
  }

  private async dispatch<TVars>(
    devices: ReadonlyArray<GetUserDeviceResult>,
    template: PushTemplate<TVars>,
    vars: TVars,
  ): Promise<SendPushResult> {
    if (devices.length === 0) return SendPushResult.empty();

    const data = template.buildData?.(vars);

    // lang 별 device 그룹핑 → lang 별로 한 번씩 sendBulk
    const byLang = new Map<string, GetUserDeviceResult[]>();
    for (const device of devices) {
      const list = byLang.get(device.language) ?? [];
      list.push(device);
      byLang.set(device.language, list);
    }

    const aggregatedSuccess: string[] = [];
    const aggregatedFailed: { pushToken: string; reason: string }[] = [];

    for (const [lang, group] of byLang.entries()) {
      const result = await this.pushSender.sendBulk({
        tokens: group.map((d) => d.pushToken),
        title: template.buildTitle(vars, lang as Parameters<typeof template.buildTitle>[1]),
        body: template.buildBody(vars, lang as Parameters<typeof template.buildBody>[1]),
        data,
      });
      aggregatedSuccess.push(...result.success);
      aggregatedFailed.push(...result.failed);
    }

    return SendPushResult.of({ success: aggregatedSuccess, failed: aggregatedFailed });
  }
}
