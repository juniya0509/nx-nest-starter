import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModuleBuilder } from '@nestjs/testing';

import { SESClient } from '@aws-sdk/client-ses';
import { I18nService } from 'nestjs-i18n';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { FIREBASE_APP_TOKEN } from '@libs/core-contract/src/fcm/Fcm.token';
import { SES_CLIENT_TOKEN } from '@libs/core-contract/src/ses/Ses.token';

import { ApiAppModule } from '../../../src/module/ApiApp.module';
import { ApiExceptionFilter } from '../../../src/support/exception/ApiExceptionFilter';

let transactionalContextInitialized = false;

type CreateCoreTestAppOptions = {
  /** TestingModuleBuilder 에 추가 override 적용. 미지정 시 SESClient 는 no-op mock 으로 자동 override (실제 외부 호출 차단). */
  configureModule?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
};

export async function createCoreTestApp(options: CreateCoreTestAppOptions = {}): Promise<INestApplication> {
  if (!transactionalContextInitialized) {
    initializeTransactionalContext();
    transactionalContextInitialized = true;
  }

  let builder = Test.createTestingModule({ imports: [ApiAppModule] });
  // 외부 IO 자동 mock — e2e 부팅 / 가입 흐름에서 실제 Google·AWS 호출 차단.
  // 호출자가 configureModule 으로 추가 overrideProvider 를 걸 수도 있음.
  builder = builder.overrideProvider(SES_CLIENT_TOKEN).useValue({ send: async () => ({}) } as unknown as SESClient);
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
  app.useGlobalFilters(new ApiExceptionFilter(app.get(I18nService)));

  await app.init();

  return app;
}
