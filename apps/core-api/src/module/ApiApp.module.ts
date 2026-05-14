import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SentryModule } from '@sentry/nestjs/setup';
import Joi from 'joi';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';

import typeOrmConfig from '@libs/core-database/src/mysql/config/TypeOrm.config';

import resolveI18nPath from '../i18n/ResolveI18nPath';
import getEnvFilePath from '../support/dotenv/GetEnvFilePath';

import { AuthModule } from './auth/Auth.module';
import { HealthModule } from './health/Health.module';
import { MailModule } from './mail/Mail.module';
import { PushModule } from './push/Push.module';
import { UserModule } from './user/User.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePath(),
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('local', 'development', 'production', 'test', 'script').required(),
        API_APP_NAME: Joi.string().valid('core-api').required(),
        SERVER_PORT: Joi.number().required(),
        CORE_WEB_URL: Joi.string().uri().required(),
        MYSQL_DB_HOST: Joi.string().required(),
        MYSQL_DB_PORT: Joi.number().required(),
        MYSQL_DB_USERNAME: Joi.string().required(),
        MYSQL_DB_PASSWORD: Joi.string().required(),
        MYSQL_DB_NAME: Joi.string().required(),
        ACCESS_JWT_SECRET_KEY: Joi.string().required(),
        ACCESS_JWT_EXPIRES_IN_SECOND: Joi.number().required(),
        REFRESH_JWT_SECRET_KEY: Joi.string().required(),
        REFRESH_JWT_EXPIRES_IN_SECOND: Joi.number().required(),
        AWS_S3_URL: Joi.string().required(),
        AWS_S3_ACCESS_KEY: Joi.string().required(),
        AWS_S3_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_S3_BUCKET_NAME: Joi.string().required(),
        AWS_S3_REGION: Joi.string().required(),
        AWS_CLOUD_FRONT_RES_URL: Joi.string().required(),
        SES_ACCESS_KEY: Joi.string().required(),
        SES_SECRET_KEY: Joi.string().required(),
        SES_REGION: Joi.string().required(),
        SES_FROM_EMAIL: Joi.string().email().required(),
        SES_FROM_NAME: Joi.string().allow('').optional(),
        MAIL_COMPANY_NAME: Joi.string().required(),
        MAIL_PRODUCT_NAME: Joi.string().required(),
        SENTRY_CLIENT_DSN_KEY: Joi.string().required(),
        SLACK_SERVER_ERROR_WEBHOOK_URL: Joi.string().required(),
        SLACK_SERVER_SLOW_QUERY_WEBHOOK_URL: Joi.string().required(),
        TWILIO_ACCOUNT_SID: Joi.string().required(),
        TWILIO_AUTH_TOKEN: Joi.string().required(),
        TWILIO_PHONE_NUMBER: Joi.string().required(),
        TWILIO_WHATS_APP_PHONE_NUMBER: Joi.string().required(),
        LOKALISE_API_TOKEN: Joi.string().required(),
        LOKALISE_PROJECT_ID: Joi.string().required(),
        FIREBASE_PROJECT_ID: Joi.string().required(),
        FIREBASE_CLIENT_EMAIL: Joi.string().required(),
        FIREBASE_PRIVATE_KEY_BASE64: Joi.string().required(),
        LOGTO_ENDPOINT: Joi.string().uri().required(),
        LOG_DIR: Joi.string().optional(),
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en-US',
      loaderOptions: {
        path: resolveI18nPath(),
        watch: true,
      },
      resolvers: [new HeaderResolver(['x-user-lang'])],
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    // SmsModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => ({
    //     twilioAccountSid: configService.get<string>('TWILIO_ACCOUNT_SID')!,
    //     twilioAuthToken: configService.get<string>('TWILIO_AUTH_TOKEN')!,
    //     twilioFromPhoneNumber: configService.get<string>('TWILIO_PHONE_NUMBER')!,
    //     twilioFromWhatsAppPhoneNumber: configService.get<string>('TWILIO_WHATS_APP_PHONE_NUMBER')!,
    //   }),
    // }),
    HealthModule,
    AuthModule,
    UserModule,
    MailModule,
    PushModule,
  ],
})
export class ApiAppModule {}
