import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModuleBuilder } from '@nestjs/testing';

import { I18nService } from 'nestjs-i18n';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { FIREBASE_APP_TOKEN } from '@libs/core-contract/src/fcm/Fcm.token';

import { AdminApiAppModule } from '../../../src/module/AdminApiApp.module';
import { AdminApiExceptionFilter } from '../../../src/support/exception/AdminApiExceptionFilter';

let transactionalContextInitialized = false;

type CreateAdminTestAppOptions = {
  /** TestingModuleBuilder 에 추가 override 를 적용 (예: SESClient mock 주입). */
  configureModule?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
};

export async function createAdminTestApp(options: CreateAdminTestAppOptions = {}): Promise<INestApplication> {
  if (!transactionalContextInitialized) {
    initializeTransactionalContext();
    transactionalContextInitialized = true;
  }

  let builder = Test.createTestingModule({ imports: [AdminApiAppModule] });
  // 기본 firebase admin mock — e2e 부팅 시 실제 Google API 호출 차단. 호출자가 추가 override 가능.
  builder = builder.overrideProvider(FIREBASE_APP_TOKEN).useValue({
    messaging: () => ({ send: async () => 'noop', sendEachForMulticast: async () => ({ responses: [] }) }),
  });
  if (options.configureModule) {
    builder = options.configureModule(builder);
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AdminApiExceptionFilter(app.get(I18nService)));

  await app.init();

  return app;
}
