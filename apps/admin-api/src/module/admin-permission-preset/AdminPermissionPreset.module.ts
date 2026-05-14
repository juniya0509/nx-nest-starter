import { Module } from '@nestjs/common';

import { TypeOrmCustomRepositoryModule } from '@libs/core-database/src/mysql/module/TypeOrmCustomRepository.module';

import { AdminPermissionPresetController } from '../../controller/admin-permission-preset/v1/AdminPermissionPreset.controller';
import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminPermissionReader } from '../../domain/admin-permission/AdminPermission.reader';
import { AdminPermissionPresetCreator } from '../../domain/admin-permission-preset/AdminPermissionPreset.creator';
import { AdminPermissionPresetReader } from '../../domain/admin-permission-preset/AdminPermissionPreset.reader';
import { AdminPermissionPresetRemover } from '../../domain/admin-permission-preset/AdminPermissionPreset.remover';
import { AdminPermissionPresetService } from '../../domain/admin-permission-preset/AdminPermissionPreset.service';
import { AdminPermissionPresetUpdater } from '../../domain/admin-permission-preset/AdminPermissionPreset.updater';

@Module({
  imports: [
    TypeOrmCustomRepositoryModule.forCustomRepository([
      AdminPermissionRepository,
      AdminPermissionPresetRepository,
      AdminPermissionPresetItemRepository,
      AdminAccountPermissionRepository,
      AdminAccountPresetRepository,
    ]),
  ],
  controllers: [AdminPermissionPresetController],
  providers: [
    AdminPermissionPresetReader,
    AdminPermissionPresetCreator,
    AdminPermissionPresetUpdater,
    AdminPermissionPresetRemover,
    AdminPermissionPresetService,
    AdminPermissionReader,
  ],
})
export class AdminPermissionPresetModule {}
