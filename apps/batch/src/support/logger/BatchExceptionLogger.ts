import winston from 'winston';
import WinstonDaily from 'winston-daily-rotate-file';

/**
 * batch cron 실행 단위의 로그 타입.
 * core-api 의 LogType 이 HTTP request context 를 담는 반면, batch 는 job 실행 메타데이터를 담는다.
 */
export type BatchLogType = {
  timestamp: Date;
  service: string;
  env: string;
  jobName: string;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  status: 'succeeded' | 'failed';
  error?: {
    name: string;
    code: string;
    summary: string;
    message: string;
    stack?: string;
  };
};

export class BatchExceptionLogger {
  private static readonly logDir = process.env.LOG_DIR ?? `${process.cwd()}/logs`;
  private static readonly isDev = process.env.NODE_ENV !== 'production';
  /** status('succeeded'|'failed') 별 winston logger 캐시 */
  private static readonly loggers = new Map<string, winston.Logger>();

  static logFailure(log: BatchLogType): void {
    this.getLogger('failed').error(this.buildRefinedLog(log));
  }

  /** 정상 실행 결과를 batch 단위 로그로 영구 보관 (감사/통계용). 호출은 선택. */
  static logSuccess(log: BatchLogType): void {
    this.getLogger('succeeded').info(this.buildRefinedLog(log));
  }

  private static buildRefinedLog(log: BatchLogType) {
    return {
      service: process.env.API_APP_NAME,
      env: process.env.NODE_ENV || 'development',
      jobName: log.jobName,
      status: log.status,
      startedAt: log.startedAt.toISOString(),
      finishedAt: log.finishedAt.toISOString(),
      durationMs: log.durationMs,
      ...(log.error && {
        error: {
          name: log.error.name,
          code: log.error.code,
          summary: log.error.summary,
          message: log.error.message,
          ...(this.isDev && { stack: this.prettifyStack(log.error.stack) }),
        },
      }),
    };
  }

  private static getLogger(status: 'succeeded' | 'failed'): winston.Logger {
    const cached = this.loggers.get(status);
    if (cached) return cached;

    const { combine, timestamp, printf, splat } = winston.format;
    const logFormat = printf((info: winston.Logform.TransformableInfo) => JSON.stringify(info));

    const logger = winston.createLogger({
      format: combine(timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }), splat(), logFormat),
      transports: [
        new WinstonDaily({
          datePattern: 'YYYY-MM-DD',
          dirname: `${BatchExceptionLogger.logDir}/${status}`,
          filename: `%DATE%-batch.${status}.log`,
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
