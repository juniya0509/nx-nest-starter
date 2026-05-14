import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

import coreTypeOrmConfig from '@libs/core-database/src/mysql/config/TypeOrm.config';

import { AdminAccountEntity } from '../entity/admin-account/AdminAccount.entity';
import { AdminAccountPermissionEntity } from '../entity/admin-permission/AdminAccountPermission.entity';
import { AdminAccountPresetEntity } from '../entity/admin-permission/AdminAccountPreset.entity';
import { AdminPermissionEntity } from '../entity/admin-permission/AdminPermission.entity';
import { AdminPermissionPresetEntity } from '../entity/admin-permission/AdminPermissionPreset.entity';
import { AdminPermissionPresetItemEntity } from '../entity/admin-permission/AdminPermissionPresetItem.entity';

const adminTypeOrmConfig: TypeOrmModuleAsyncOptions = {
  ...coreTypeOrmConfig,
  useFactory: async (configService: ConfigService) => {
    const baseOptions = await coreTypeOrmConfig.useFactory!(configService);

    return {
      ...baseOptions,
      entities: [
        ...(Array.isArray(baseOptions.entities) ? baseOptions.entities : []),
        AdminAccountEntity,
        AdminPermissionEntity,
        AdminPermissionPresetEntity,
        AdminPermissionPresetItemEntity,
        AdminAccountPermissionEntity,
        AdminAccountPresetEntity,
      ],
    };
  },
};

export default adminTypeOrmConfig;
