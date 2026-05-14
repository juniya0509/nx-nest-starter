import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { createCoreTestApp } from '../../support/helper/CoreTestApp.factory';

describe('Health (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createCoreTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health → 200 + "true" (인증 불필요)', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(response.text).toBe('true');
  });

  it('GET /v1/health/ping → 200 + "pong" (인증 불필요)', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health/ping').expect(200);
    expect(response.text).toBe('pong');
  });
});
