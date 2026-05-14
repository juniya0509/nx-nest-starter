import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { CoreAuthFixture } from '../../support/helper/CoreAuthFixture';
import { createCoreTestApp } from '../../support/helper/CoreTestApp.factory';

describe('User (E2E)', () => {
  let app: INestApplication;
  let fixture: CoreAuthFixture;

  beforeAll(async () => {
    app = await createCoreTestApp();
    fixture = CoreAuthFixture.of(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await fixture.clearAll();
  });

  describe('GET /v1/users/me', () => {
    it('Authorization 헤더 없으면 200 + data=null (옵션 인증)', async () => {
      const response = await request(app.getHttpServer()).get('/v1/users/me').expect(200);

      expect(response.body.data).toBeNull();
    });

    it('정상 토큰: 본인 정보 반환', async () => {
      const { user, accessJwt } = await fixture.seedUserWithJwt({ email: 'me@test.com', firstname: 'Me' });

      const response = await request(app.getHttpServer()).get('/v1/users/me').set('Authorization', `Bearer ${accessJwt}`).expect(200);

      expect(response.body.data).toMatchObject({ id: user.id, email: 'me@test.com' });
    });

    it('손상된 JWT 는 401 (옵션 인증이라도 invalid 토큰이면 throw)', async () => {
      await request(app.getHttpServer()).get('/v1/users/me').set('Authorization', 'Bearer garbage').expect(401);
    });
  });
});
