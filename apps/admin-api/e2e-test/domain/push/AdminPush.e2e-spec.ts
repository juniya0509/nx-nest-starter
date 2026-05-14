import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { DataSource } from 'typeorm';

import { FIREBASE_APP_TOKEN } from '@libs/core-contract/src/fcm/Fcm.token';

import { UserDeviceEntity } from '@libs/core-database/src/mysql/entity/user/UserDevice.entity';

import { AdminPermission } from '../../../src/enum/AdminPermission.enum';
import { AdminAuthFixture } from '../../support/helper/AdminAuthFixture';
import { createAdminTestApp } from '../../support/helper/AdminTestApp.factory';

describe('Admin Push (E2E)', () => {
  let app: INestApplication;
  let fixture: AdminAuthFixture;
  let dataSource: DataSource;
  let multicastMock: jest.Mock;

  const seedDevice = async (userId: number, pushToken: string, language = 'en-US' as const) => {
    const repo = dataSource.getRepository(UserDeviceEntity);
    return repo.save(repo.create({ user: { id: userId }, deviceType: 'IOS_APP', pushToken, language }));
  };

  beforeAll(async () => {
    multicastMock = jest.fn();
    const firebaseAppMock = {
      messaging: () => ({ send: jest.fn(), sendEachForMulticast: multicastMock }),
    };

    app = await createAdminTestApp({
      configureModule: (builder) => builder.overrideProvider(FIREBASE_APP_TOKEN).useValue(firebaseAppMock),
    });
    fixture = AdminAuthFixture.of(app);
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await fixture.clearAll();
    multicastMock.mockReset();
  });

  describe('POST /v1/pushes/bulk/raw', () => {
    it('인증 없으면 401', async () => {
      await request(app.getHttpServer())
        .post('/v1/pushes/bulk/raw')
        .send({ userIds: [1], title: 't', body: 'b' })
        .expect(401);
    });

    it('PUSH_SEND 권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await request(app.getHttpServer())
        .post('/v1/pushes/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userIds: [1], title: 't', body: 'b' })
        .expect(403);
    });

    it('정상 발송: device 들에 multicast, successCount 반영', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PUSH_SEND]);
      const u1 = await fixture.seedUser({ email: 'p1@t.com' });
      const u2 = await fixture.seedUser({ email: 'p2@t.com' });
      await seedDevice(u1.id, 'tok-1');
      await seedDevice(u2.id, 'tok-2');
      multicastMock.mockResolvedValue({
        responses: [
          { success: true, messageId: 'm1' },
          { success: true, messageId: 'm2' },
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/v1/pushes/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userIds: [u1.id, u2.id], title: '공지', body: '본문', dataPayload: { route: '/x' } })
        .expect(200);

      expect(multicastMock).toHaveBeenCalledTimes(1);
      const call = multicastMock.mock.calls[0]![0];
      expect(new Set(call.tokens)).toEqual(new Set(['tok-1', 'tok-2']));
      expect(call.notification).toEqual({ title: '공지', body: '본문' });
      expect(call.data).toEqual({ route: '/x' });
      expect(response.body.data.successCount).toBe(2);
    });

    it('일부 device 실패: 200 + failureReasons 에 사유별 count (token 노출 X)', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PUSH_SEND]);
      const u1 = await fixture.seedUser({ email: 'p1@t.com' });
      await seedDevice(u1.id, 'good');
      await seedDevice(u1.id, 'bad-1');
      await seedDevice(u1.id, 'bad-2');
      multicastMock.mockResolvedValue({
        responses: [
          { success: true, messageId: 'm1' },
          { success: false, error: { code: 'messaging/registration-token-not-registered', message: 'invalid' } },
          { success: false, error: { code: 'messaging/registration-token-not-registered', message: 'invalid' } },
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/v1/pushes/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userIds: [u1.id], title: 't', body: 'b' })
        .expect(200);

      expect(response.body.data.successCount).toBe(1);
      expect(response.body.data.failedCount).toBe(2);
      expect(response.body.data.failureReasons).toEqual([{ reason: 'invalid', count: 2 }]);
      expect(JSON.stringify(response.body)).not.toContain('bad-1');
      expect(JSON.stringify(response.body)).not.toContain('bad-2');
    });

    it('user 등록은 됐지만 device 가 없는 경우: 발송 0건, 200', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PUSH_SEND]);
      const u = await fixture.seedUser({ email: 'no-device@t.com' });

      const response = await request(app.getHttpServer())
        .post('/v1/pushes/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userIds: [u.id], title: 't', body: 'b' })
        .expect(200);

      expect(multicastMock).not.toHaveBeenCalled();
      expect(response.body.data.successCount).toBe(0);
      expect(response.body.data.failedCount).toBe(0);
    });

    it('미등록 user.id 가 있으면 400', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PUSH_SEND]);
      const u = await fixture.seedUser({ email: 'known@t.com' });

      const response = await request(app.getHttpServer())
        .post('/v1/pushes/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userIds: [u.id, 999999], title: 't', body: 'b' })
        .expect(400);

      expect(JSON.stringify(response.body)).toContain('999999');
      expect(multicastMock).not.toHaveBeenCalled();
    });

    it('userIds 빈 배열 → 400', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.PUSH_SEND]);
      await request(app.getHttpServer())
        .post('/v1/pushes/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ userIds: [], title: 't', body: 'b' })
        .expect(400);
    });
  });
});
