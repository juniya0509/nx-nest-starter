import { Module } from '@nestjs/common';

import { TypeOrmCustomRepositoryModule } from '@libs/core-database/src/mysql/module/TypeOrmCustomRepository.module';

import { AdminPermissionController } from '../../controller/admin-permission/v1/AdminPermission.controller';
import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminPermissionReader } from '../../domain/admin-permission/AdminPermission.reader';
import { AdminPermissionService } from '../../domain/admin-permission/AdminPermission.service';

@Module({
  imports: [
    TypeOrmCustomRepositoryModule.forCustomRepository([
      AdminPermissionRepository,
      AdminAccountPermissionRepository,
      AdminAccountPresetRepository,
      AdminPermissionPresetItemRepository,
    ]),
  ],
  controllers: [AdminPermissionController],
  providers: [AdminPermissionReader, AdminPermissionService],
})
export class AdminPermissionModule {}
