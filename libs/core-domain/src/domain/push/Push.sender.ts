import { Inject, Injectable, Logger } from '@nestjs/common';

import * as admin from 'firebase-admin';

import { FIREBASE_APP_TOKEN } from '@libs/core-contract/src/fcm/Fcm.token';

import { SendPushResult } from './result/SendPushResult';

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

type SendBulkInput = PushPayload & {
  tokens: ReadonlyArray<string>;
};

/**
 * Firebase Admin SDK 얇은 래퍼.
 * - sendOne: 단건 token 으로 발송. 실패 시 throw (호출 측에서 try/catch).
 * - sendBulk: FCM 의 sendEachForMulticast 사용 — 토큰별 성공/실패가 응답에 포함되며 전체 reject 하지 않음.
 *   동일 title/body 를 한꺼번에 보낼 때만 적합 (lang 별 분기는 호출자가 책임).
 */
@Injectable()
export class PushSender {
  private readonly logger = new Logger(PushSender.name);

  constructor(@Inject(FIREBASE_APP_TOKEN) private readonly firebaseApp: admin.app.App) {}

  async sendOne(token: string, payload: PushPayload): Promise<void> {
    await this.firebaseApp.messaging().send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });
  }

  async sendBulk(input: SendBulkInput): Promise<SendPushResult> {
    if (input.tokens.length === 0) return SendPushResult.empty();

    const response = await this.firebaseApp.messaging().sendEachForMulticast({
      tokens: [...input.tokens],
      notification: { title: input.title, body: input.body },
      data: input.data,
    });

    const success: string[] = [];
    const failed: { pushToken: string; reason: string }[] = [];
    response.responses.forEach((r, i) => {
      const token = input.tokens[i]!;
      if (r.success) {
        success.push(token);
      } else {
        const reason = r.error?.message ?? r.error?.code ?? 'unknown error';
        failed.push({ pushToken: token, reason });
        // FCM 의 unregistered/invalid-argument 등은 device row 정리 신호 — 운영 단계에서 별도 처리 필요.
        this.logger.warn(`[push] send failed: token=${token} reason=${reason}`);
      }
    });

    return SendPushResult.of({ success, failed });
  }
}
