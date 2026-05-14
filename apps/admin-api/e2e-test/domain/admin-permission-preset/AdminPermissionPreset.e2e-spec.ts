import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { AdminPermission } from '../../../src/enum/AdminPermission.enum';
import { AdminAuthFixture } from '../../support/helper/AdminAuthFixture';
import { createAdminTestApp } from '../../support/helper/AdminTestApp.factory';

describe('Admin Permission Preset (E2E)', () => {
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

  const createPresetViaApi = async (
    accessJwt: string,
    body: { code: string; name: string; description?: string; permissionCodes: string[] },
  ): Promise<number> => {
    const response = await request(app.getHttpServer())
      .post('/v1/admin-permission-presets')
      .set('Authorization', `Bearer ${accessJwt}`)
      .send(body)
      .expect(201);
    return response.body.data.id as number;
  };

  describe('POST /v1/admin-permission-presets', () => {
    it('인증 없으면 401', async () => {
      await request(app.getHttpServer())
        .post('/v1/admin-permission-presets')
        .send({ code: 'P1', name: 'p', permissionCodes: [] })
        .expect(401);
    });

    it('PERMISSION_PRESET_MANAGE 권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await request(app.getHttpServer())
        .post('/v1/admin-permission-presets')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ code: 'P1', name: 'p', permissionCodes: [] })
        .expect(403);
    });

    it('정상 생성 시 201 + id 반환', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PERMISSION_PRESET_MANAGE]);
      const id = await createPresetViaApi(accessJwt, { code: 'ROOT', name: '루트', permissionCodes: ['USER_LIST'] });

      expect(typeof id).toBe('number');
    });

    it('중복 code 면 409', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PERMISSION_PRESET_MANAGE]);
      await createPresetViaApi(accessJwt, { code: 'DUP', name: 'p', permissionCodes: [] });

      await request(app.getHttpServer())
        .post('/v1/admin-permission-presets')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ code: 'DUP', name: 'p2', permissionCodes: [] })
        .expect(409);
    });

    it('잘못된 code 형식 (소문자) 은 400', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PERMISSION_PRESET_MANAGE]);
      await request(app.getHttpServer())
        .post('/v1/admin-permission-presets')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ code: 'lowercase', name: 'p', permissionCodes: [] })
        .expect(400);
    });
  });

  describe('GET /v1/admin-permission-presets', () => {
    it('권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await request(app.getHttpServer()).get('/v1/admin-permission-presets').set('Authorization', `Bearer ${accessJwt}`).expect(403);
    });

    it('생성된 프리셋 목록 + permissionCount 반환', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([
        AdminPermission.PERMISSION_PRESET_MANAGE,
        AdminPermission.USER_LIST,
        AdminPermission.USER_READ,
      ]);
      await createPresetViaApi(accessJwt, { code: 'P1', name: 'p1', permissionCodes: ['USER_LIST', 'USER_READ'] });

      const response = await request(app.getHttpServer())
        .get('/v1/admin-permission-presets')
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      const list = response.body.data.list as Array<{ code: string; permissionCount: number }>;
      expect(list).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'P1', permissionCount: 2 })]));
    });
  });

  describe('GET /v1/admin-permission-presets/:id', () => {
    it('존재하지 않는 ID 는 404', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PERMISSION_PRESET_MANAGE]);
      await request(app.getHttpServer()).get('/v1/admin-permission-presets/999999').set('Authorization', `Bearer ${accessJwt}`).expect(404);
    });

    it('정상 조회 200 + 권한 코드 포함', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PERMISSION_PRESET_MANAGE, AdminPermission.USER_LIST]);
      const id = await createPresetViaApi(accessJwt, { code: 'P1', name: 'p1', permissionCodes: ['USER_LIST'] });

      const response = await request(app.getHttpServer())
        .get(`/v1/admin-permission-presets/${id}`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id,
        code: 'P1',
        permissionCodes: ['USER_LIST'],
      });
    });
  });

  describe('PATCH /v1/admin-permission-presets/:id', () => {
    it('존재하지 않는 ID 는 404', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PERMISSION_PRESET_MANAGE]);
      await request(app.getHttpServer())
        .patch('/v1/admin-permission-presets/999999')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ name: 'n', permissionCodes: [] })
        .expect(404);
    });

    it('정상 수정 200 + 변경된 내용 반영', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([
        AdminPermission.PERMISSION_PRESET_MANAGE,
        AdminPermission.USER_LIST,
        AdminPermission.USER_READ,
      ]);
      const id = await createPresetViaApi(accessJwt, { code: 'P1', name: 'old', permissionCodes: ['USER_LIST'] });

      await request(app.getHttpServer())
        .patch(`/v1/admin-permission-presets/${id}`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ name: 'new', description: '바뀐 설명', permissionCodes: ['USER_READ'] })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/v1/admin-permission-presets/${id}`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      expect(response.body.data).toMatchObject({ name: 'new', description: '바뀐 설명', permissionCodes: ['USER_READ'] });
    });
  });

  describe('DELETE /v1/admin-permission-presets/:id', () => {
    it('존재하지 않는 ID 는 404', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PERMISSION_PRESET_MANAGE]);
      await request(app.getHttpServer())
        .delete('/v1/admin-permission-presets/999999')
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(404);
    });

    it('정상 삭제 200 + 이후 조회 시 404', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PERMISSION_PRESET_MANAGE]);
      const id = await createPresetViaApi(accessJwt, { code: 'P1', name: 'p', permissionCodes: [] });

      await request(app.getHttpServer())
        .delete(`/v1/admin-permission-presets/${id}`)
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      await request(app.getHttpServer()).get(`/v1/admin-permission-presets/${id}`).set('Authorization', `Bearer ${accessJwt}`).expect(404);
    });
  });
});
