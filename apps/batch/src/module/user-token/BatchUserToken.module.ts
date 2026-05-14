import { Module } from '@nestjs/common';

import { UserTokenRepository } from '@libs/core-database/src/mysql/entity/user/UserToken.repository';
import { TypeOrmCustomRepositoryModule } from '@libs/core-database/src/mysql/module/TypeOrmCustomRepository.module';

import { UserTokenRemover } from '@libs/core-domain/src/domain/user/UserToken.remover';

import { UserRefreshTokenCleanupBatch } from '../../batch/user-token/UserRefreshTokenCleanup.batch';

@Module({
  imports: [TypeOrmCustomRepositoryModule.forCustomRepository([UserTokenRepository])],
  providers: [UserTokenRemover, UserRefreshTokenCleanupBatch],
})
export class BatchUserTokenModule {}
