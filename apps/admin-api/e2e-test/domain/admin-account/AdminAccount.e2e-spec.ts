import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { AdminPermission } from '../../../src/enum/AdminPermission.enum';
import { AdminAuthFixture } from '../../support/helper/AdminAuthFixture';
import { createAdminTestApp } from '../../support/helper/AdminTestApp.factory';

describe('Admin Account (E2E)', () => {
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

  describe('POST /v1/admin-accounts', () => {
    it('인증 없으면 401', async () => {
      await request(app.getHttpServer()).post('/v1/admin-accounts').send({ userId: 1 }).expect(401);
    });

    it('ADMIN_ACCOUNT_MANAGE 권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await request(app.getHttpServer())
        .post('/v1/admin-accounts')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userId: 1 })
        .expect(403);
    });

    it('존재하지 않는 user.id 면 404', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_ACCOUNT_MANAGE]);
      await request(app.getHttpServer())
        .post('/v1/admin-accounts')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userId: 999999 })
        .expect(404);
    });

    it('이미 admin 인 user 면 409', async () => {
      const { accessJwt, userId } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_ACCOUNT_MANAGE]);
      await request(app.getHttpServer())
        .post('/v1/admin-accounts')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userId })
        .expect(409);
    });

    it('정상 등록 시 201', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_ACCOUNT_MANAGE]);
      const target = await fixture.seedUser();
      await request(app.getHttpServer())
        .post('/v1/admin-accounts')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userId: target.id, memo: '테스트' })
        .expect(201);
    });
  });

  describe('GET /v1/admin-accounts', () => {
    it('권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await request(app.getHttpServer()).get('/v1/admin-accounts').set('Authorization', `Bearer ${accessJwt}`).expect(403);
    });

    it('권한 있으면 시드된 admin 목록 반환', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_ACCOUNT_MANAGE]);

      const response = await request(app.getHttpServer()).get('/v1/admin-accounts').set('Authorization', `Bearer ${accessJwt}`).expect(200);

      expect(response.body.data.totalResults).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /v1/admin-accounts/me', () => {
    it('인증 없으면 401', async () => {
      await request(app.getHttpServer()).get('/v1/admin-accounts/me').expect(401);
    });

    it('권한 없는 admin 도 본인 계정은 조회 가능 (별도 권한 불필요)', async () => {
      const { accessJwt, adminAccountId } = await fixture.seedAdminWithPermissions([]);

      const response = await request(app.getHttpServer())
        .get('/v1/admin-accounts/me')
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      expect(response.body.data.id).toBe(adminAccountId);
    });
  });

  describe('GET /v1/admin-accounts/:id', () => {
    it('권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await request(app.getHttpServer()).get('/v1/admin-accounts/1').set('Authorization', `Bearer ${accessJwt}`).expect(403);
    });

    it('존재하지 않는 ID 는 404', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_ACCOUNT_MANAGE]);
      await request(app.getHttpServer()).get('/v1/admin-accounts/999999').set('Authorization', `Bearer ${accessJwt}`).expect(404);
    });

    it('정상 조회 200 + 권한 정보 포함', async () => {
      const { accessJwt, adminAccountId } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_ACCOUNT_MANAGE]);

      const response = await request(app.getHttpServer())
        .get(`/v1/admin-accounts/${adminAccountId}`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: adminAccountId,
        directPermissionCodes: expect.arrayContaining(['ADMIN_ACCOUNT_MANAGE']),
      });
    });
  });

  describe('DELETE /v1/admin-accounts/:id', () => {
    it('권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await request(app.getHttpServer()).delete('/v1/admin-accounts/1').set('Authorization', `Bearer ${accessJwt}`).expect(403);
    });

    it('존재하지 않는 ID 는 404', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_ACCOUNT_MANAGE]);
      await request(app.getHttpServer()).delete('/v1/admin-accounts/999999').set('Authorization', `Bearer ${accessJwt}`).expect(404);
    });

    it('정상 삭제 200 + 이후 조회 시 404', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_ACCOUNT_MANAGE]);
      const target = await fixture.seedAdminWithPermissions([]);

      await request(app.getHttpServer())
        .delete(`/v1/admin-accounts/${target.adminAccountId}`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/v1/admin-accounts/${target.adminAccountId}`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(404);
    });
  });

  describe('PUT /v1/admin-accounts/:id/permissions', () => {
    it('ADMIN_PERMISSION_ASSIGN 권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_ACCOUNT_MANAGE]);
      await request(app.getHttpServer())
        .put('/v1/admin-accounts/1/permissions')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ permissionCodes: ['USER_LIST'] })
        .expect(403);
    });

    it('정의되지 않은 권한 코드 는 400 (validator 거부)', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_PERMISSION_ASSIGN]);
      await request(app.getHttpServer())
        .put('/v1/admin-accounts/1/permissions')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ permissionCodes: ['NOT_A_PERMISSION'] })
        .expect(400);
    });

    it('정상 갱신 200', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_PERMISSION_ASSIGN]);
      const target = await fixture.seedAdminWithPermissions([]);

      await request(app.getHttpServer())
        .put(`/v1/admin-accounts/${target.adminAccountId}/permissions`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ permissionCodes: ['USER_LIST', 'USER_READ'] })
        .expect(200);
    });
  });

  describe('PUT /v1/admin-accounts/:id/presets', () => {
    it('ADMIN_PERMISSION_ASSIGN 권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await request(app.getHttpServer())
        .put('/v1/admin-accounts/1/presets')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ presetIds: [] })
        .expect(403);
    });

    it('빈 presetIds 로 정상 갱신 200 (모든 프리셋 해제)', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_PERMISSION_ASSIGN]);
      const target = await fixture.seedAdminWithPermissions([]);

      await request(app.getHttpServer())
        .put(`/v1/admin-accounts/${target.adminAccountId}/presets`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ presetIds: [] })
        .expect(200);
    });

    it('존재하지 않는 presetId 는 400 (INVALID_PRESET_ID)', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_PERMISSION_ASSIGN]);
      const target = await fixture.seedAdminWithPermissions([]);

      await request(app.getHttpServer())
        .put(`/v1/admin-accounts/${target.adminAccountId}/presets`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ presetIds: [999999] })
        .expect(400);
    });
  });
});
