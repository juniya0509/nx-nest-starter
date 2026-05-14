import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import * as Sentry from '@sentry/nestjs';
import { config } from 'dotenv';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { BatchAppModule } from './module/BatchApp.module';
import batchGetEnvFilePath from './support/dotenv/BatchGetEnvFilePath';

config({ path: batchGetEnvFilePath() });

function sentryConfig() {
  Sentry.init({
    dsn: process.env.SENTRY_CLIENT_DSN_KEY,
    sendDefaultPii: true,
  });
}

function typeOrmConfig() {
  initializeTransactionalContext();
}

async function bootstrap() {
  sentryConfig();
  typeOrmConfig();

  // batch 는 외부 API 가 아니지만 ALB / ECS health check 를 위해 가벼운 HTTP 서버를 띄운다.
  // 실제 작업은 @nestjs/schedule 의 Cron 데코레이터가 백그라운드에서 처리.
  const app = await NestFactory.create<NestExpressApplication>(BatchAppModule, { abortOnError: true });

  const serverPort = process.env.SERVER_PORT || 3001;
  await app.listen(serverPort);
}

bootstrap();
