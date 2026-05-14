import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

import { SES_CLIENT_TOKEN } from '@libs/core-contract/src/ses/Ses.token';

import { SendMailResult } from './result/SendMailResult';

type SendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendBulkInput = {
  toList: ReadonlyArray<string>;
  subject: string;
  html: string;
  text: string;
};

/**
 * AWS SES SDK 얇은 래퍼.
 * - sendOne: 단건 발송. 실패 시 throw (호출 측에서 try/catch).
 * - sendBulk: 다건 발송. 개별 실패는 SendMailResult.failed 로 누적, 전체는 reject 하지 않음.
 *   AWS SES 는 SendBulkTemplatedEmail 이 있으나 SES Template 등록을 요구하므로,
 *   코드 템플릿을 쓰는 본 구현에서는 단건 SendEmailCommand 를 Promise.allSettled 로 병렬 호출한다.
 */
@Injectable()
export class MailSender {
  constructor(
    @Inject(SES_CLIENT_TOKEN) private readonly sesClient: SESClient,
    private readonly configService: ConfigService,
  ) {}

  async sendOne(input: SendInput): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.resolveFromAddress(),
      Destination: { ToAddresses: [input.to] },
      Message: {
        Subject: { Data: input.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: input.html, Charset: 'UTF-8' },
          Text: { Data: input.text, Charset: 'UTF-8' },
        },
      },
    });
    await this.sesClient.send(command);
  }

  /**
   * SES Source 헤더 조합. SES_FROM_NAME 이 있으면 `이름 <email>` 형식 (RFC 5322), 없으면 email-only.
   * 표시명에 비-ASCII (한글 등) 가 들어가면 SES 가 RFC2047 인코딩을 자체 처리하므로 그대로 넘김.
   */
  private resolveFromAddress(): string {
    const fromEmail = this.configService.get<string>('SES_FROM_EMAIL')!;
    const fromName = this.configService.get<string>('SES_FROM_NAME');
    if (fromName && fromName.trim().length > 0) {
      return `${fromName.trim()} <${fromEmail}>`;
    }
    return fromEmail;
  }

  async sendBulk(input: SendBulkInput): Promise<SendMailResult> {
    const settled = await Promise.allSettled(
      input.toList.map((to) => this.sendOne({ to, subject: input.subject, html: input.html, text: input.text })),
    );

    const success: string[] = [];
    const failed: { email: string; reason: string }[] = [];
    settled.forEach((r, i) => {
      const email = input.toList[i]!;
      if (r.status === 'fulfilled') {
        success.push(email);
      } else {
        failed.push({ email, reason: extractReason(r.reason) });
      }
    });

    return SendMailResult.of({ success, failed });
  }
}

function extractReason(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'unknown error';
}
