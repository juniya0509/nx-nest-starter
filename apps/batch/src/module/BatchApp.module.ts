import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SentryModule } from '@sentry/nestjs/setup';
import Joi from 'joi';

import batchTypeOrmConfig from '../database/mysql/config/BatchTypeOrm.config';
import batchGetEnvFilePath from '../support/dotenv/BatchGetEnvFilePath';

import { BatchHealthModule } from './health/BatchHealth.module';
import { BatchUserTokenModule } from './user-token/BatchUserToken.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: batchGetEnvFilePath(),
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('local', 'development', 'production', 'test', 'script').required(),
        API_APP_NAME: Joi.string().valid('batch').required(),
        SERVER_PORT: Joi.number().required(),
        MYSQL_DB_HOST: Joi.string().required(),
        MYSQL_DB_PORT: Joi.number().required(),
        MYSQL_DB_USERNAME: Joi.string().required(),
        MYSQL_DB_PASSWORD: Joi.string().required(),
        MYSQL_DB_NAME: Joi.string().required(),
        SENTRY_CLIENT_DSN_KEY: Joi.string().required(),
        SLACK_SERVER_ERROR_WEBHOOK_URL: Joi.string().required(),
        LOG_DIR: Joi.string().optional(),
      }),
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync(batchTypeOrmConfig),
    BatchHealthModule,
    BatchUserTokenModule,
  ],
})
export class BatchAppModule {}
