import { IncomingWebhook } from '@slack/client';

import { BatchLogType } from '../logger/BatchExceptionLogger';

const THROTTLE_MS = 10 * 60 * 1000;

export class BatchExceptionNotifier {
  private static webhook: IncomingWebhook | null = null;
  private static missingWebhookWarned = false;
  private static lastSentByKey = new Map<string, number>();

  /** Webhook 미설정 시 throw 대신 false 반환 — Slack 누락이 batch 동작을 망가뜨리지 않도록 */
  private static init(): boolean {
    if (this.webhook) return true;

    const webhookUrl = process.env.SLACK_SERVER_ERROR_WEBHOOK_URL;
    if (!webhookUrl) {
      if (!this.missingWebhookWarned) {
        console.warn('[BatchExceptionNotifier] SLACK_SERVER_ERROR_WEBHOOK_URL not configured — skipping notifications');
        this.missingWebhookWarned = true;
      }
      return false;
    }

    this.webhook = new IncomingWebhook(webhookUrl);
    return true;
  }

  /** 같은 jobName + errorCode 의 폭주 알림을 throttle */
  private static shouldThrottle(key: string): boolean {
    const last = this.lastSentByKey.get(key);
    const now = Date.now();
    if (last !== undefined && now - last < THROTTLE_MS) return true;
    this.lastSentByKey.set(key, now);
    return false;
  }

  static async notify(log: BatchLogType): Promise<void> {
    if (process.env.NODE_ENV !== 'production') return;
    if (log.status !== 'failed' || !log.error) return;

    const throttleKey = `${log.jobName}:${log.error.code}`;
    if (this.shouldThrottle(throttleKey)) return;
    if (!this.init()) return;

    const summary =
      `*Job:* ${log.jobName}\n` +
      `*환경:* ${log.env}\n` +
      `*시작:* ${log.startedAt.toISOString()}\n` +
      `*종료:* ${log.finishedAt.toISOString()}\n` +
      `*소요(ms):* ${log.durationMs}`;

    const fields = [
      { title: '실행 요약 (Run Summary)', value: this.formatBlockQuote(summary), short: false },
      {
        title: '예외 (Exception)',
        value: this.formatCodeBlock(JSON.stringify({ name: log.error.name, code: log.error.code, message: log.error.message }, null, 2)),
        short: false,
      },
      {
        title: '스택 추적 (Stack Trace)',
        value: log.error.stack ? this.formatBlockQuote(this.prettifyStack(log.error.stack) ?? log.error.stack) : '-',
        short: false,
      },
    ];

    try {
      await this.webhook!.send({
        attachments: [
          {
            color: 'danger',
            pretext: `:rotating_light: *[Batch] ${log.jobName} 실패*`,
            title: `${log.error.code} — ${log.error.summary}`,
            fields,
            footer: `Batch failure | jobName: ${log.jobName}`,
            ts: Math.floor(Date.now() / 1000).toString(),
            mrkdwn_in: ['pretext', 'text', 'fields'],
          },
        ],
      });
    } catch (err) {
      console.error('[BatchExceptionNotifier] Failed to send slack notification:', err);
    }
  }

  private static formatCodeBlock(content: string, maxLength = 3000): string {
    if (!content) return '```{}```';
    const safeContent = content.replace(/```/g, '\\`\\`\\`');
    if (safeContent.length > maxLength) {
      return `\`\`\`\n${safeContent.slice(0, 1500)}\n...omit...\n${safeContent.slice(-1000)}\n\`\`\``;
    }
    return `\`\`\`\n${safeContent}\n\`\`\``;
  }

  private static formatBlockQuote(content: string, maxLength = 3000): string {
    if (!content) return '-';
    const safeContent = content.replace(/```/g, '');
    if (safeContent.length > maxLength) {
      return `> ${safeContent.slice(0, 1500)}\n> ...omit...\n> ${safeContent.slice(-1000)}`;
    }
    return safeContent
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  }

  private static prettifyStack(stack?: string): string | undefined {
    if (!stack) return stack;
    return stack
      .split('\n')
      .map((line) =>
        line
          .trim()
          .replace(process.cwd(), '.')
          .replace(/webpack:\/+/g, '')
          .replace(/\/dist\/apps\/([^/]+)\/src\//g, '/apps/$1/src/')
          .replace(/\/dist\/libs\/([^/]+)\/src\//g, '/libs/$1/src/')
          .replace(/\/dist\/(apps|libs)\//g, '/$1/')
          .replace(/\/\.\//g, '/')
          .replace(/\/\/+/g, '/'),
      )
      .join('\n');
  }
}
