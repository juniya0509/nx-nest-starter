import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import * as Sentry from '@sentry/nestjs';
import cookieParser from 'cookie-parser';
import dayjs from 'dayjs';
import { config } from 'dotenv';
import morgan from 'morgan';
import { I18nService } from 'nestjs-i18n';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AdminApiAppModule } from './module/AdminApiApp.module';
import adminGetEnvFilePath from './support/dotenv/AdminGetEnvFilePath';
import { AdminApiExceptionFilter } from './support/exception/AdminApiExceptionFilter';

config({ path: adminGetEnvFilePath() });

function sentryConfig() {
  Sentry.init({
    dsn: process.env.SENTRY_CLIENT_DSN_KEY,
    sendDefaultPii: true,
  });
}

function typeOrmConfig() {
  initializeTransactionalContext();
}

function corsConfig(app: NestExpressApplication) {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOriginString = process.env.CORS_ALLOWED_ORIGINS || null;
  const allowedOriginList = allowedOriginString ? allowedOriginString.split(',').map((origin) => origin.trim()) : [];

  app.enableCors({
    origin: isProduction ? allowedOriginList : true,
    credentials: true,
  });
}

function globalPipesConfig(app: NestExpressApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
}

function globalInterceptorsConfig(app: NestExpressApplication) {
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}

function globalFiltersConfig(app: NestExpressApplication) {
  app.useGlobalFilters(new AdminApiExceptionFilter(app.get(I18nService)));
}

function cookieConfig(app: NestExpressApplication) {
  app.use(cookieParser());
}

function morganConfig(app: NestExpressApplication) {
  const isProduction = process.env.NODE_ENV === 'production';

  morgan.token('date', function () {
    return dayjs().format('YYYY-MM-DD HH:mm:ss');
  });
  app.use(morgan(isProduction ? 'combined' : '[:date] :status :method  :url :response-time ms'));
}

async function bootstrap() {
  sentryConfig();
  typeOrmConfig();

  const app = await NestFactory.create<NestExpressApplication>(AdminApiAppModule, { abortOnError: true });

  corsConfig(app);
  globalPipesConfig(app);
  globalInterceptorsConfig(app);
  cookieConfig(app);
  morganConfig(app);
  globalFiltersConfig(app);

  const serverPort = process.env.SERVER_PORT || 3000;

  await app.listen(serverPort);
}

bootstrap();
