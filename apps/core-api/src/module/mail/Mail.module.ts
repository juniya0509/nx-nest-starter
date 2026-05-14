import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SESClient } from '@aws-sdk/client-ses';

import { SES_CLIENT_TOKEN } from '@libs/core-contract/src/ses/Ses.token';

import { MailResolver } from '@libs/core-domain/src/domain/mail/Mail.resolver';
import { MailSender } from '@libs/core-domain/src/domain/mail/Mail.sender';
import { MailService } from '@libs/core-domain/src/domain/mail/Mail.service';

@Module({
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
    MailResolver,
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
