import { IncomingWebhook } from '@slack/client';

import { LogType } from '../logger/ApiExceptionLogger';

const THROTTLE_MS = 10 * 60 * 1000;

export class ApiErrorNotifier {
  private static webhook: IncomingWebhook | null = null;
  private static missingWebhookWarned = false;
  private static lastSentByKey = new Map<string, number>();
  /**
   * body/headers/params/query 마스킹 패턴 (소문자 변환 후 substring 매칭).
   * `token` 으로 `accessToken` / `refreshToken` / `logtoAccessToken` 등 모든 *Token 키를 한번에 커버.
   */
  private static readonly sensitivePatterns = ['password', 'token', 'secret', 'apikey', 'cookie', 'authorization'];

  /** Webhook 미설정 시 throw 대신 false 반환 — Slack 누락이 앱 동작을 망가뜨리지 않도록 */
  private static init(): boolean {
    if (this.webhook) return true;

    const webhookUrl = process.env.SLACK_SERVER_ERROR_WEBHOOK_URL;
    if (!webhookUrl) {
      if (!this.missingWebhookWarned) {
        console.warn('[ApiErrorNotifier] SLACK_SERVER_ERROR_WEBHOOK_URL not configured — skipping notifications');
        this.missingWebhookWarned = true;
      }
      return false;
    }

    this.webhook = new IncomingWebhook(webhookUrl);
    return true;
  }

  /** 같은 errorCode + URL path 가 폭주해도 Slack 도배되지 않게 throttle */
  private static shouldThrottle(key: string): boolean {
    const last = this.lastSentByKey.get(key);
    const now = Date.now();
    if (last !== undefined && now - last < THROTTLE_MS) return true;
    this.lastSentByKey.set(key, now);
    return false;
  }

  private static maskSensitiveData(value: unknown): unknown {
    if (value === null || typeof value !== 'object') return value;

    if (Array.isArray(value)) {
      return value.map((item) => this.maskSensitiveData(item));
    }

    const masked: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (this.sensitivePatterns.some((pattern) => lowerKey.includes(pattern))) {
        masked[key] = '[MASKED]';
      } else if (typeof val === 'object' && val !== null) {
        masked[key] = this.maskSensitiveData(val);
      } else {
        masked[key] = val;
      }
    }
    return masked;
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

  static async notify(log: LogType): Promise<void> {
    const isProduction = process.env.NODE_ENV === 'production';
    const is5xxError = log.status >= 500 && log.status < 600;
    if (isProduction === false) return;
    if (is5xxError === false) return;

    const urlPath = (log.request.url ?? '').split('?')[0];
    const throttleKey = `${log.error.code}:${urlPath}`;
    if (this.shouldThrottle(throttleKey)) return;

    if (!this.init()) return;

    const requestSummary =
      `*Trace ID:* ${log.traceId}\n` +
      `*환경:* ${log.env}\n` +
      `*애플리케이션:* ${log.service}\n` +
      `*요청 URL:* [${log.request.method}] ${log.request.url}\n` +
      `*HTTP 상태코드:* ${log.status}`;
    const { stack, ...errorWithoutStack } = log.error ?? {};

    const fields = [
      {
        title: '요청 요약 (Request Summary)',
        value: this.formatBlockQuote(requestSummary),
        short: false,
      },
      {
        title: '요청 헤더 (Request Headers)',
        value: this.formatCodeBlock(JSON.stringify(this.maskSensitiveData(log.request.headers), null, 2)),
        short: false,
      },
      {
        title: '요청 쿼리 (Request Query)',
        value: this.formatCodeBlock(JSON.stringify(this.maskSensitiveData(log.request.query), null, 2)),
        short: false,
      },
      {
        title: '요청 파라미터 (Request Params)',
        value: this.formatCodeBlock(JSON.stringify(this.maskSensitiveData(log.request.params), null, 2)),
        short: false,
      },
      {
        title: '요청 본문 (Request Body)',
        value: this.formatCodeBlock(JSON.stringify(this.maskSensitiveData(log.request.body), null, 2)),
        short: false,
      },
      {
        title: '예외 (Exception)',
        value: this.formatCodeBlock(JSON.stringify(errorWithoutStack, null, 2)),
        short: false,
      },
      {
        title: '스택 추적 (Stack Trace)',
        value: stack ? this.formatBlockQuote(this.prettifyStack(stack) ?? stack) : '-',
        short: false,
      },
    ];

    try {
      await this.webhook!.send({
        attachments: [
          {
            color: 'danger',
            pretext: `:rotating_light: *[Core API] HTTP ${log.status} 서버 오류*`,
            title: `${log.error.code} — ${log.error.summary}`,
            fields,
            footer: `Trace ID: ${log.traceId} | Error monitoring system`,
            ts: Math.floor(Date.now() / 1000).toString(),
            mrkdwn_in: ['pretext', 'text', 'fields'],
          },
        ],
      });
    } catch (err) {
      console.error('[ApiErrorNotifier] Failed to send slack notification:', err);
    }
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
