import { IncomingWebhook } from '@slack/client';
import * as sqlFormatter from 'sql-formatter';

const THROTTLE_MS = 10 * 60 * 1000;

export class SlowQueryNotifier {
  private static webhook: IncomingWebhook | null = null;
  private static missingWebhookWarned = false;
  private static lastSentByKey = new Map<string, number>();

  /** Webhook 미설정 시 throw 대신 false 반환 — Slack 누락이 앱 동작을 망가뜨리지 않도록 */
  private static init(): boolean {
    if (this.webhook) return true;

    const webhookUrl = process.env['SLACK_SERVER_SLOW_QUERY_WEBHOOK_URL'];
    if (!webhookUrl) {
      if (!this.missingWebhookWarned) {
        console.warn('[SlowQueryNotifier] SLACK_SERVER_SLOW_QUERY_WEBHOOK_URL not configured — skipping notifications');
        this.missingWebhookWarned = true;
      }
      return false;
    }

    this.webhook = new IncomingWebhook(webhookUrl);
    return true;
  }

  /** 같은 SQL 가 폭주해도 Slack 도배되지 않게 throttle */
  private static shouldThrottle(key: string): boolean {
    const last = this.lastSentByKey.get(key);
    const now = Date.now();
    if (last !== undefined && now - last < THROTTLE_MS) return true;
    this.lastSentByKey.set(key, now);
    return false;
  }

  static async notifySlowQuery(data: { query: string; parameters?: unknown[]; duration: number }) {
    const isProduction = process.env['NODE_ENV'] === 'production';
    if (isProduction === false) return;

    const throttleKey = data.query.slice(0, 200);
    if (this.shouldThrottle(throttleKey)) return;

    if (!this.init()) return;

    try {
      const sql = sqlFormatter.format(data.query);
      const params = data.parameters && data.parameters.length ? JSON.stringify(data.parameters, null, 2) : '-';

      await this.webhook!.send({
        attachments: [
          {
            color: 'warning',
            pretext: `:snail: *슬로우 쿼리 발생 (${data.duration} ms)*`,
            text: `*SQL*\n\`\`\`${sql}\`\`\`\n*파라미터*\n\`\`\`${params}\`\`\``,
            ts: Math.floor(Date.now() / 1000).toString(),
            mrkdwn_in: ['pretext', 'text'],
          },
        ],
      });
    } catch (err) {
      console.error('[SlowQueryNotifier] Failed to send slack notification:', err);
    }
  }
}
