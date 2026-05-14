import { INestApplication } from '@nestjs/common';

import { SESClient } from '@aws-sdk/client-ses';
import request from 'supertest';

import { SES_CLIENT_TOKEN } from '@libs/core-contract/src/ses/Ses.token';

import { AdminPermission } from '../../../src/enum/AdminPermission.enum';
import { AdminAuthFixture } from '../../support/helper/AdminAuthFixture';
import { createAdminTestApp } from '../../support/helper/AdminTestApp.factory';

describe('Admin Mail (E2E)', () => {
  let app: INestApplication;
  let fixture: AdminAuthFixture;
  let sesSendMock: jest.Mock;

  beforeAll(async () => {
    sesSendMock = jest.fn();
    const sesClientMock = { send: sesSendMock } as unknown as SESClient;

    app = await createAdminTestApp({
      configureModule: (builder) => builder.overrideProvider(SES_CLIENT_TOKEN).useValue(sesClientMock),
    });
    fixture = AdminAuthFixture.of(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await fixture.clearAll();
    sesSendMock.mockReset();
  });

  describe('POST /v1/mails/bulk/raw', () => {
    it('인증 없으면 401', async () => {
      await request(app.getHttpServer())
        .post('/v1/mails/bulk/raw')
        .send({ recipients: ['a@t.com'], subject: 's', html: '<p>h</p>' })
        .expect(401);
    });

    it('MAIL_SEND 권한 없으면 403', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
      await request(app.getHttpServer())
        .post('/v1/mails/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ recipients: ['a@t.com'], subject: 's', html: '<p>h</p>' })
        .expect(403);
    });

    it('정상 발송: SES send 가 수신자 수만큼 호출되고 successCount 반환', async () => {
      sesSendMock.mockResolvedValue({});
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.MAIL_SEND]);
      const u1 = await fixture.seedUser({ email: 'recipient1@t.com' });
      const u2 = await fixture.seedUser({ email: 'recipient2@t.com' });

      const response = await request(app.getHttpServer())
        .post('/v1/mails/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ recipients: [u1.email, u2.email], subject: '안내', html: '<p>본문</p>', lang: 'ko' })
        .expect(200);

      expect(sesSendMock).toHaveBeenCalledTimes(2);
      expect(response.body.data.successCount).toBe(2);
      expect(response.body.data.failedCount).toBe(0);
    });

    it('SES 일부 실패: 200 + failed 카운트에 사유 누적', async () => {
      sesSendMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('throttled'));
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.MAIL_SEND]);
      const ok = await fixture.seedUser({ email: 'ok@t.com' });
      const bad = await fixture.seedUser({ email: 'bad@t.com' });

      const response = await request(app.getHttpServer())
        .post('/v1/mails/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ recipients: [ok.email, bad.email], subject: 's', html: '<p>h</p>' })
        .expect(200);

      expect(response.body.data.successCount).toBe(1);
      expect(response.body.data.failedCount).toBe(1);
      expect(response.body.data.failed[0].email).toBe('bad@t.com');
      expect(response.body.data.failed[0].reason).toContain('throttled');
    });

    it('recipients 비어있으면 400', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.MAIL_SEND]);
      await request(app.getHttpServer())
        .post('/v1/mails/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ recipients: [], subject: 's', html: '<p>h</p>' })
        .expect(400);
      expect(sesSendMock).not.toHaveBeenCalled();
    });

    it('잘못된 이메일 형식 포함 시 400', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.MAIL_SEND]);
      await request(app.getHttpServer())
        .post('/v1/mails/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ recipients: ['not-an-email'], subject: 's', html: '<p>h</p>' })
        .expect(400);
    });

    it('미등록 이메일이 하나라도 있으면 400 + unregistered 정보 반환', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.MAIL_SEND]);
      const known = await fixture.seedUser({ email: 'known@t.com' });

      const response = await request(app.getHttpServer())
        .post('/v1/mails/bulk/raw')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ recipients: [known.email, 'ghost@t.com'], subject: 's', html: '<p>h</p>' })
        .expect(400);

      // response 안 어딘가에 unregistered 이메일이 노출되는지 (ExceptionFilter 의 errorData 직렬화 형태에 의존하지 않도록)
      expect(JSON.stringify(response.body)).toContain('ghost@t.com');
      expect(sesSendMock).not.toHaveBeenCalled();
    });
  });

  describe('POST /v1/mails/bulk/template', () => {
    it('announcement 정상 발송 (lang=ko)', async () => {
      sesSendMock.mockResolvedValue({});
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.MAIL_SEND]);
      const u = await fixture.seedUser({ email: 'recipient@t.com' });

      const response = await request(app.getHttpServer())
        .post('/v1/mails/bulk/template')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({
          recipients: [u.email],
          templateId: 'announcement',
          vars: { subject: '점검 안내', bodyHtml: '<p>점검 예정</p>' },
          lang: 'ko',
        })
        .expect(200);

      expect(sesSendMock).toHaveBeenCalledTimes(1);
      expect(response.body.data.successCount).toBe(1);
    });

    it('정의되지 않은 templateId → 400', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.MAIL_SEND]);
      const u = await fixture.seedUser({ email: 'recipient@t.com' });
      await request(app.getHttpServer())
        .post('/v1/mails/bulk/template')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ recipients: [u.email], templateId: 'nope', vars: {} })
        .expect(400);
    });

    it('announcement vars 누락 시 400', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.MAIL_SEND]);
      const u = await fixture.seedUser({ email: 'recipient@t.com' });
      await request(app.getHttpServer())
        .post('/v1/mails/bulk/template')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({ recipients: [u.email], templateId: 'announcement', vars: { subject: 'only' } })
        .expect(400);
    });

    it('미등록 이메일 → 400', async () => {
      const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.MAIL_SEND]);
      await request(app.getHttpServer())
        .post('/v1/mails/bulk/template')
        .set('Authorization', `Bearer ${accessJwt}`)
        .send({
          recipients: ['ghost@t.com'],
          templateId: 'announcement',
          vars: { subject: 's', bodyHtml: '<p>x</p>' },
        })
        .expect(400);
    });
  });
});
