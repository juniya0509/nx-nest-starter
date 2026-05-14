import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { CoreAuthFixture } from '../../support/helper/CoreAuthFixture';
import { createCoreTestApp } from '../../support/helper/CoreTestApp.factory';

describe('Auth (E2E)', () => {
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

  describe('POST /v1/auth/refresh', () => {
    it('정상 refresh 토큰: 새 access/refresh 쌍 발급', async () => {
      const user = await fixture.seedUser();
      const refreshJwt = await fixture.seedRefreshTokenForUser(user);
      // JWT iat 가 초 단위라 같은 초내 재발급 시 동일 signature → 다음 초로 분리
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const response = await request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken: refreshJwt }).expect(201);

      expect(response.body.data.accessToken).toEqual(expect.any(String));
      expect(response.body.data.refreshToken).toEqual(expect.any(String));
      expect(response.body.data.refreshToken).not.toBe(refreshJwt);
    });

    it('JWT 검증은 통과하지만 DB 에 없는 refresh: USER_TOKEN_NOT_FOUND (401)', async () => {
      const user = await fixture.seedUser();
      const orphanRefreshJwt = await fixture.issueRefreshJwtForUserId(user.id);

      await request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken: orphanRefreshJwt }).expect(401);
    });

    it('손상된 refresh JWT: INVALID_JWT_REFRESH_TOKEN (401)', async () => {
      await request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken: 'garbage' }).expect(401);
    });

    it('access JWT 를 refresh 로 보내면 INVALID_JWT_REFRESH_TOKEN (401)', async () => {
      const { user, accessJwt } = await fixture.seedUserWithJwt();
      void user;

      await request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken: accessJwt }).expect(401);
    });

    it('빈 refreshToken 은 400 (validator)', async () => {
      await request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken: '' }).expect(400);
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('인증 없으면 401', async () => {
      await request(app.getHttpServer()).post('/v1/auth/logout').send({ refreshToken: 'anything' }).expect(401);
    });

    it('정상 로그아웃: refresh 토큰 row 삭제 → 이후 refresh 시 USER_TOKEN_NOT_FOUND', async () => {
      const user = await fixture.seedUser();
      const accessJwt = await fixture.issueAccessJwtForUserId(user.id);
      const refreshJwt = await fixture.seedRefreshTokenForUser(user);

      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ refreshToken: refreshJwt })
        .expect(200);

      await request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken: refreshJwt }).expect(401);
    });

    it('타인 refresh 로 logout 시도해도 자기 토큰만 삭제 (현재 구현: noop, 200)', async () => {
      const userA = await fixture.seedUser();
      const userB = await fixture.seedUser();
      const accessJwtA = await fixture.issueAccessJwtForUserId(userA.id);
      const refreshJwtB = await fixture.seedRefreshTokenForUser(userB);

      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessJwtA}`)
        .send({ refreshToken: refreshJwtB })
        .expect(200);

      // refresh 후 새 토큰 발급이 동일 second 충돌하지 않도록 분리
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const response = await request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken: refreshJwtB });
      expect(response.status).toBe(201);
    });
  });
});
