import * as Sentry from '@sentry/nestjs';

import { BatchLogType } from '../logger/BatchExceptionLogger';

export class BatchExceptionSentryCapture {
  /** production 환경의 batch job 실패만 Sentry 로 전송. */
  static capture(log: BatchLogType): void {
    if (process.env.NODE_ENV !== 'production') return;
    if (log.status !== 'failed' || !log.error) return;

    // narrowing 이 withScope callback 으로 전달되지 않으므로 별도 변수로 분리
    const { error } = log;

    Sentry.withScope((scope) => {
      scope.setTag('application_service', log.service);
      scope.setTag('application_env', log.env);
      scope.setTag('batch_job', log.jobName);
      scope.setTag('batch_duration_ms', String(log.durationMs));

      scope.setContext('batch', {
        jobName: log.jobName,
        startedAt: log.startedAt.toISOString(),
        finishedAt: log.finishedAt.toISOString(),
        durationMs: log.durationMs,
      });

      const title = `${error.summary} (${error.message})`;
      const customError = new Error(title);
      customError.name = `[Batch] ${error.code}`;
      customError.stack = error.stack ? this.prettifyStack(error.stack) : '';

      Sentry.captureException(customError);
    });
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
