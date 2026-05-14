import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { AdminPermission } from '../../../src/enum/AdminPermission.enum';
import { AdminAuthFixture } from '../../support/helper/AdminAuthFixture';
import { createAdminTestApp } from '../../support/helper/AdminTestApp.factory';

describe('Admin Permission (E2E)', () => {
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

  describe('GET /v1/admin-permissions', () => {
    it('Authorization 헤더 없으면 401', async () => {
      await request(app.getHttpServer()).get('/v1/admin-permissions').expect(401);
    });

    it('ADMIN_PERMISSION_LIST 권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);

      await request(app.getHttpServer()).get('/v1/admin-permissions').set('Authorization', `Bearer ${accessJwt}`).expect(403);
    });

    it('ADMIN_PERMISSION_LIST 권한 있으면 권한 카탈로그 반환', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.ADMIN_PERMISSION_LIST]);

      const response = await request(app.getHttpServer())
        .get('/v1/admin-permissions')
        .set('Authorization', `Bearer ${accessJwt}`)
        .expect(200);

      const list = response.body.data.list as Array<{ code: string; groupCode: string; description: string }>;
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'ADMIN_PERMISSION_LIST',
            groupCode: 'admin-management',
          }),
        ]),
      );
    });
  });
});
