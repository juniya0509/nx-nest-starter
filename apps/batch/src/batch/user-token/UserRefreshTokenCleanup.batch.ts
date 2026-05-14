import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { UserTokenRemover } from '@libs/core-domain/src/domain/user/UserToken.remover';

import { BatchExceptionHandler } from '../../support/exception/BatchExceptionHandler';

/**
 * 만료된 refresh token 일괄 정리 batch.
 * - 매일 04:00 (서버 timezone) 1회 실행
 * - `expires_at < NOW()` 인 user_token row 를 hard delete
 * - 실행 결과 (성공/실패 + 소요시간) 는 BatchExceptionHandler 가 logger/Sentry/Slack 으로 처리
 */
@Injectable()
export class UserRefreshTokenCleanupBatch {
  private readonly logger = new Logger(UserRefreshTokenCleanupBatch.name);

  constructor(private readonly userTokenRemover: UserTokenRemover) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async run(): Promise<void> {
    await BatchExceptionHandler.execute('UserRefreshTokenCleanup', async () => {
      const deletedCount = await this.userTokenRemover.removeExpired();
      this.logger.log(`[batch] UserRefreshTokenCleanup deleted=${deletedCount}`);
    });
  }
}
