import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { UserRepository } from '@libs/core-database/src/mysql/entity/user/User.repository';
import { TypeOrmCustomRepositoryModule } from '@libs/core-database/src/mysql/module/TypeOrmCustomRepository.module';

import { JwtIssuer } from '@libs/core-domain/src/domain/auth/Jwt.issuer';
import { JwtVerifier } from '@libs/core-domain/src/domain/auth/Jwt.verifier';
import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';

import { AdminAccountRepository } from '../../database/mysql/entity/admin-account/AdminAccount.repository';
import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';
import { AdminAccountPresetRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPreset.repository';
import { AdminPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminPermission.repository';
import { AdminPermissionPresetRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPreset.repository';
import { AdminPermissionPresetItemRepository } from '../../database/mysql/entity/admin-permission/AdminPermissionPresetItem.repository';
import { AdminAccountReader } from '../../domain/admin-account/AdminAccount.reader';
import { AdminAuthService } from '../../domain/admin-auth/AdminAuth.service';
import { AdminPermissionReader } from '../../domain/admin-permission/AdminPermission.reader';
import { AdminPermissionCatalogSyncer } from '../../domain/admin-permission/AdminPermissionCatalog.syncer';
import { AdminAuthGuard } from '../../middleware/auth/AdminAuthGuard';

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
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_JWT_SECRET_KEY'),
      }),
    }),
  ],
  providers: [
    JwtIssuer,
    JwtVerifier,
    UserReader,
    AdminAccountReader,
    AdminPermissionReader,
    AdminPermissionCatalogSyncer,
    AdminAuthService,
    {
      provide: APP_GUARD,
      useClass: AdminAuthGuard,
    },
  ],
  exports: [AdminAuthService, AdminAccountReader, AdminPermissionReader],
})
export class AdminAuthModule implements OnApplicationBootstrap {
  constructor(private readonly adminPermissionCatalogSyncer: AdminPermissionCatalogSyncer) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.adminPermissionCatalogSyncer.syncFromEnum();
  }
}
