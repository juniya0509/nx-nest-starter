import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SESClient } from '@aws-sdk/client-ses';

import { SES_CLIENT_TOKEN } from '@libs/core-contract/src/ses/Ses.token';

import { UserRepository } from '@libs/core-database/src/mysql/entity/user/User.repository';
import { TypeOrmCustomRepositoryModule } from '@libs/core-database/src/mysql/module/TypeOrmCustomRepository.module';

import { MailSender } from '@libs/core-domain/src/domain/mail/Mail.sender';
import { MailStripper } from '@libs/core-domain/src/domain/mail/Mail.stripper';
import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';

import { AdminMailController } from '../../controller/mail/v1/AdminMail.controller';
import { AdminMailService } from '../../domain/mail/AdminMail.service';
import { AdminMailValidator } from '../../domain/mail/AdminMail.validator';
import { AdminAuthModule } from '../admin-auth/AdminAuth.module';

@Module({
  imports: [AdminAuthModule, TypeOrmCustomRepositoryModule.forCustomRepository([UserRepository])],
  controllers: [AdminMailController],
  providers: [
    {
      provide: SES_CLIENT_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new SESClient({
          region: configService.get<string>('SES_REGION')!,
          credentials: {
            accessKeyId: configService.get<string>('SES_ACCESS_KEY')!,
            secretAccessKey: configService.get<string>('SES_SECRET_KEY')!,
          },
        }),
    },
    MailSender,
    MailStripper,
    UserReader,
    AdminMailValidator,
    AdminMailService,
  ],
  exports: [AdminMailService],
})
export class AdminMailModule {}
