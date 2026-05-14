import * as sqlFormatter from 'sql-formatter';
import { AbstractLogger, LogLevel, LogMessage } from 'typeorm';

import { SlowQueryNotifier } from '../support/SlowQueryNotifier';

export class TypeOrmLoggerConfig extends AbstractLogger {
  protected writeLog(level: LogLevel, logMessage: LogMessage | LogMessage[]) {
    const messages = this.prepareLogMessages(logMessage, {
      highlightSql: false,
    });

    for (const message of messages) {
      switch (message.type ?? level) {
        case 'log':
        case 'schema-build':
        case 'migration':
          break;

        case 'info':
        case 'query':
          break;

        case 'warn':
          console.warn(message.prefix ?? '', message.message);

          break;

        case 'error':
          console.error(message.prefix ?? '', message.message);

          break;

        case 'query-error': {
          const sql = message.message.toString();
          try {
            const formattedSql = sqlFormatter.format(sql);
            console.error(`▼▼ ${message.type?.toUpperCase().replace('-', ' ')} ▼▼`);
            console.error(formattedSql);
          } catch {
            console.error(`▼▼ ${message.type?.toUpperCase().replace('-', ' ')} ▼▼`);
            console.error(sql);
          }

          break;
        }
      }
    }
  }

  override logQuerySlow(time: number, query: string, parameters?: unknown[]) {
    SlowQueryNotifier.notifySlowQuery({
      query,
      parameters,
      duration: time,
    });
  }
}
