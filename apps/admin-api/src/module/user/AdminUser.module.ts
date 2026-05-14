import { Module } from '@nestjs/common';

import { TypeOrmCustomRepositoryModule } from '@libs/core-database/src/mysql/module/TypeOrmCustomRepository.module';

import { AdminUserController } from '../../controller/user/v1/AdminUser.controller';
import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';
import { AdminUserRepository } from '../../database/mysql/entity/user/AdminUser.repository';
import { AdminUserReader } from '../../domain/user/AdminUser.reader';
import { AdminUserService } from '../../domain/user/AdminUser.service';

@Module({
  imports: [TypeOrmCustomRepositoryModule.forCustomRepository([AdminUserRepository, AdminAccountRepository])],
  controllers: [AdminUserController],
  providers: [AdminUserReader, AdminUserService],
})
export class AdminUserModule {}
