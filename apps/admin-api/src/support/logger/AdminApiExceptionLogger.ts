import winston from 'winston';
import WinstonDaily from 'winston-daily-rotate-file';

export type AdminLogType = {
  timestamp: Date;
  traceId: string;
  service: string;
  env: string;
  status: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, unknown>;
    body: unknown;
    params: Record<string, unknown>;
    query: Record<string, unknown>;
  };
  error: {
    name: string;
    code: string;
    summary: string;
    message: string;
    errorData: unknown;
    stack?: string;
  };
};

export class AdminApiExceptionLogger {
  private static readonly logDir = process.env.LOG_DIR ?? `${process.cwd()}/logs`;
  private static readonly isDev = process.env.NODE_ENV !== 'production';
  /**
   * body 마스킹 패턴 (소문자 변환 후 substring 매칭).
   * `token` 으로 `accessToken` / `refreshToken` / `logtoAccessToken` 등 모든 *Token 키를 한번에 커버.
   */
  private static readonly sensitivePatterns = ['password', 'token', 'secret', 'apikey', 'cookie', 'authorization'];
  /** status 별 winston logger 캐시 (싱글톤 — 매 요청 재생성 방지) */
  private static readonly loggers = new Map<number, winston.Logger>();

  static logError(log: AdminLogType) {
    const level = log.status >= 500 ? 'error' : 'warn';
    const refinedLog = this.buildRefinedLog(log);

    this.getLogger(log.status).log(level, refinedLog);
  }

  private static buildRefinedLog(log: AdminLogType) {
    return {
      service: process.env.API_APP_NAME,
      env: process.env.NODE_ENV || 'development',
      status: log.status,
      traceId: log.traceId,
      request: {
        ...log.request,
        headers: {
          'user-agent': log.request.headers['user-agent'],
          origin: log.request.headers['origin'] ?? null,
          referer: log.request.headers['referer'] ?? null,
          'x-user-lang': log.request.headers['x-user-lang'] ?? null,
          'x-request-id': log.request.headers['x-request-id'] ?? null,
          host: log.request.headers['host'],
        },
        body: this.maskSensitiveData(log.request.body),
      },
      error: {
        name: log.error.name,
        code: log.error.code,
        summary: log.error.summary,
        message: log.error.message,
        errorData: log.error.errorData,
        ...(this.isDev && { stack: this.prettifyStack(log.error.stack) }),
      },
    };
  }

  private static getLogger(status: number): winston.Logger {
    const cached = this.loggers.get(status);
    if (cached) return cached;

    const { combine, timestamp, printf, splat } = winston.format;
    const logFormat = printf((info: winston.Logform.TransformableInfo) =>
      JSON.stringify({
        timestamp: info.timestamp,
        traceId: info.traceId,
        service: info.service,
        env: info.env,
        status: info.status,
        request: info.request,
        error: info.error,
      }),
    );

    const logger = winston.createLogger({
      format: combine(timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }), splat(), logFormat),
      transports: [
        new WinstonDaily({
          datePattern: 'YYYY-MM-DD',
          dirname: `${AdminApiExceptionLogger.logDir}/error`,
          filename: `%DATE%-${status}.error.log`,
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.json(),
            winston.format.prettyPrint(),
            winston.format.errors({ stack: true }),
            winston.format.ms(),
            winston.format.colorize({ all: true }),
          ),
        }),
      ],
    });

    this.loggers.set(status, logger);
    return logger;
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
