import { BatchError } from '../error/BatchError';
import { BatchExceptionLogger, BatchLogType } from '../logger/BatchExceptionLogger';
import { BatchExceptionSentryCapture } from '../monitoring/BatchExceptionSentryCapture';
import { BatchExceptionNotifier } from '../notifier/BatchExceptionNotifier';

/**
 * batch cron 공통 wrapper.
 * - 각 batch handler 가 `BatchExceptionHandler.execute(jobName, fn)` 으로 작업을 감싸면
 *   성공/실패에 따라 자동으로 logger / Sentry / Slack notifier 가 호출된다.
 * - 실패 시 throw 는 그대로 propagate (cron lifecycle 에서는 다음 스케줄에 자동 재시도).
 */
export class BatchExceptionHandler {
  static async execute<T>(jobName: string, fn: () => Promise<T>): Promise<T> {
    const startedAt = new Date();
    try {
      const result = await fn();
      const finishedAt = new Date();
      BatchExceptionLogger.logSuccess(this.buildLog(jobName, startedAt, finishedAt, 'succeeded'));
      return result;
    } catch (err) {
      const finishedAt = new Date();
      const log = this.buildFailureLog(jobName, startedAt, finishedAt, err);
      BatchExceptionLogger.logFailure(log);
      BatchExceptionSentryCapture.capture(log);
      void BatchExceptionNotifier.notify(log);
      throw err;
    }
  }

  private static buildLog(jobName: string, startedAt: Date, finishedAt: Date, status: 'succeeded' | 'failed'): BatchLogType {
    return {
      timestamp: finishedAt,
      service: process.env.API_APP_NAME ?? 'batch',
      env: process.env.NODE_ENV ?? 'development',
      jobName,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      status,
    };
  }

  private static buildFailureLog(jobName: string, startedAt: Date, finishedAt: Date, err: unknown): BatchLogType {
    const base = this.buildLog(jobName, startedAt, finishedAt, 'failed');
    const errorName = err instanceof Error ? err.name : 'UnknownError';
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      ...base,
      error: {
        name: errorName,
        code: BatchError.JOB_FAILED.code,
        summary: BatchError.JOB_FAILED.summary,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
      },
    };
  }
}
