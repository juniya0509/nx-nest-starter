import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { createAdminTestApp } from '../../support/helper/AdminTestApp.factory';

describe('Admin Health (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createAdminTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health → 200 + "true" (인증 불필요, 공통 Response 미적용)', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(response.text).toBe('true');
  });

  it('GET /v1/health/ping → 200 + "pong" (인증 불필요, 공통 Response 미적용)', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health/ping').expect(200);
    expect(response.text).toBe('pong');
  });
});
