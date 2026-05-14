import { Module } from '@nestjs/common';

import { UserRepository } from '@libs/core-database/src/mysql/entity/user/User.repository';
import { TypeOrmCustomRepositoryModule } from '@libs/core-database/src/mysql/module/TypeOrmCustomRepository.module';

import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';

import { AdminAccountController } from '../../controller/admin-account/v1/AdminAccount.controller';
import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';
import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminAccountCreator } from '../../domain/admin-account/AdminAccount.creator';
import { AdminAccountReader } from '../../domain/admin-account/AdminAccount.reader';
import { AdminAccountRemover } from '../../domain/admin-account/AdminAccount.remover';
import { AdminAccountService } from '../../domain/admin-account/AdminAccount.service';
import { AdminAccountPermissionUpdater } from '../../domain/admin-account/AdminAccountPermission.updater';
import { AdminAccountPresetUpdater } from '../../domain/admin-account/AdminAccountPreset.updater';
import { AdminPermissionReader } from '../../domain/admin-permission/AdminPermission.reader';
import { AdminPermissionPresetReader } from '../../domain/admin-permission-preset/AdminPermissionPreset.reader';

@Module({
  imports: [
    TypeOrmCustomRepositoryModule.forCustomRepository([
      UserRepository,
      AdminAccountRepository,
      AdminPermissionRepository,
      AdminPermissionPresetRepository,
      AdminPermissionPresetItemRepository,
      AdminAccountPermissionRepository,
      AdminAccountPresetRepository,
    ]),
  ],
  controllers: [AdminAccountController],
  providers: [
    UserReader,
    AdminAccountReader,
    AdminAccountCreator,
    AdminAccountRemover,
    AdminAccountPermissionUpdater,
    AdminAccountPresetUpdater,
    AdminPermissionReader,
    AdminPermissionPresetReader,
    AdminAccountService,
  ],
})
export class AdminAccountModule {}
