import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { AdminPermission } from '../../../src/enum/AdminPermission.enum';
import { AdminAuthFixture } from '../../support/helper/AdminAuthFixture';
import { createAdminTestApp } from '../../support/helper/AdminTestApp.factory';

describe('Admin User (E2E)', () => {
  let app: INestApplication;
  let fixture: AdminAuthFixture;

  beforeAll(async () => {
    app = await createAdminTestApp();
    fixture = AdminAuthFixture.of(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await fixture.clearAll();
  });

  describe('GET /v1/users', () => {
    it('Authorization 헤더가 없으면 401', async () => {
      await request(app.getHttpServer()).get('/v1/users').expect(401);
    });

    it('USER_LIST 권한이 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_READ]);

      await request(app.getHttpServer()).get('/v1/users').set('Authorization', `Bearer ${accessJwt}`).expect(403);
    });

    it('USER_LIST 권한이 있으면 시드된 유저 목록을 반환한다', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await fixture.seedUser({ email: 'a@test.local', firstname: 'Alice', lastname: 'A' });
      await fixture.seedUser({ email: 'b@test.local', firstname: 'Bob', lastname: 'B' });

      const response = await request(app.getHttpServer()).get('/v1/users').set('Authorization', `Bearer ${accessJwt}`).expect(200);

      expect(response.body.data.totalResults).toBeGreaterThanOrEqual(2);
      expect(response.body.data.list).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'a@test.local', fullname: 'Alice A' }),
          expect.objectContaining({ email: 'b@test.local', fullname: 'Bob B' }),
        ]),
      );
    });

    it('keyword 로 이메일/이름 부분 일치 필터링', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await fixture.seedUser({ email: 'alpha@test.local', firstname: 'Alpha' });
      await fixture.seedUser({ email: 'beta@test.local', firstname: 'Beta' });

      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .query({ keyword: 'alpha' })
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      const emails = response.body.data.list.map((item: { email: string }) => item.email);
      expect(emails).toContain('alpha@test.local');
      expect(emails).not.toContain('beta@test.local');
    });

    it('status 필터로 일치하는 유저만 반환', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await fixture.seedUser({ email: 'active@test.local', status: 'ACTIVE' });
      await fixture.seedUser({ email: 'suspended@test.local', status: 'SUSPENDED' });

      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .query({ status: 'SUSPENDED' })
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      const emails = response.body.data.list.map((item: { email: string }) => item.email);
      expect(emails).toContain('suspended@test.local');
      expect(emails).not.toContain('active@test.local');
    });
  });

  describe('GET /v1/users/:id', () => {
    it('USER_READ 권한이 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      const target = await fixture.seedUser();

      await request(app.getHttpServer()).get(`/v1/users/${target.id}`).set('Authorization', `Bearer ${accessJwt}`).expect(403);
    });

    it('존재하지 않는 ID 는 404', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_READ]);

      await request(app.getHttpServer()).get('/v1/users/999999').set('Authorization', `Bearer ${accessJwt}`).expect(404);
    });

    it('일반 유저 상세는 isAdmin=false', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_READ]);
      const target = await fixture.seedUser({ email: 'plain@test.local', firstname: 'Plain', lastname: 'User' });

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${target.id}`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: target.id,
        email: 'plain@test.local',
        fullname: 'Plain User',
        isAdmin: false,
      });
    });

    it('관리자 계정 보유 유저 상세는 isAdmin=true', async () => {
      const { accessJwt, userId } = await fixture.seedAdminWithPermissions([AdminPermission.USER_READ]);

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      expect(response.body.data.isAdmin).toBe(true);
    });
  });
});
