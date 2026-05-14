import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as admin from 'firebase-admin';

import { FIREBASE_APP_TOKEN } from '@libs/core-contract/src/fcm/Fcm.token';

import { UserRepository } from '@libs/core-database/src/mysql/entity/user/User.repository';
import { UserDeviceRepository } from '@libs/core-database/src/mysql/entity/user/UserDevice.repository';
import { TypeOrmCustomRepositoryModule } from '@libs/core-database/src/mysql/module/TypeOrmCustomRepository.module';

import { PushSender } from '@libs/core-domain/src/domain/push/Push.sender';
import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';
import { UserDeviceReader } from '@libs/core-domain/src/domain/user/UserDevice.reader';

import { AdminPushController } from '../../controller/push/v1/AdminPush.controller';
import { AdminPushService } from '../../domain/push/AdminPush.service';
import { AdminPushValidator } from '../../domain/push/AdminPush.validator';
import { AdminAuthModule } from '../admin-auth/AdminAuth.module';

@Module({
  imports: [AdminAuthModule, TypeOrmCustomRepositoryModule.forCustomRepository([UserRepository, UserDeviceRepository])],
  controllers: [AdminPushController],
  providers: [
    {
      provide: FIREBASE_APP_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): admin.app.App => {
        if (admin.apps.length > 0) {
          return admin.app();
        }
        return admin.initializeApp({
          credential: admin.credential.cert({
            projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
            clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
            privateKey: Buffer.from(configService.get<string>('FIREBASE_PRIVATE_KEY_BASE64')!, 'base64').toString('utf-8'),
          }),
        });
      },
    },
    PushSender,
    UserReader,
    UserDeviceReader,
    AdminPushValidator,
    AdminPushService,
  ],
  exports: [AdminPushService],
})
export class AdminPushModule {}
