import * as Sentry from '@sentry/nestjs';

import { LogType } from '../logger/ApiExceptionLogger';

export class ApiExceptionSentryCapture {
  static capture(log: LogType) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction === false) return;

    Sentry.withScope((scope) => {
      scope.setTag('application_service', log.service);
      scope.setTag('application_env', log.env);
      scope.setTag('application_status', String(log.status));
      scope.setTag('application_traceId', log.traceId);

      scope.setContext('request', {
        method: log.request.method,
        url: log.request.url,
        headers: log.request.headers,
        body: log.request.body,
        params: log.request.params,
        query: log.request.query,
      });

      scope.setContext('error', {
        name: log.error.name,
        code: log.error.code,
        summary: log.error.summary,
        message: log.error.message,
        errorData: log.error.errorData,
        stack: log.error.stack ? this.prettifyStack(log.error.stack) : null,
      });

      const title = `${log.error.summary} (${log.error.message})`;
      const customError = new Error(title);
      customError.name = `[Core API] ${log.error.code}`;
      customError.stack = log.error.stack ? this.prettifyStack(log.error.stack) : '';

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
