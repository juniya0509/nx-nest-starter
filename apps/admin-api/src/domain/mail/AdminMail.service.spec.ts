import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { MailSender } from '@libs/core-domain/src/domain/mail/Mail.sender';
import { MailStripper } from '@libs/core-domain/src/domain/mail/Mail.stripper';
import { SendMailResult } from '@libs/core-domain/src/domain/mail/result/SendMailResult';
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminMailService } from './AdminMail.service';
import { AdminMailValidator } from './AdminMail.validator';
import { AdminSendBulkRawData } from './data/AdminSendBulkRawData';
import { AdminSendBulkTemplateData } from './data/AdminSendBulkTemplateData';

describe('AdminMailService', () => {
  let service: AdminMailService;
  let mailSender: jest.Mocked<Pick<MailSender, 'sendBulk'>>;
  let validator: jest.Mocked<Pick<AdminMailValidator, 'assertValidCount' | 'assertAllRegistered'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminMailService,
        { provide: MailSender, useValue: { sendBulk: jest.fn() } },
        {
          provide: AdminMailValidator,
          useValue: { assertValidCount: jest.fn(), assertAllRegistered: jest.fn().mockResolvedValue(undefined) },
        },
        // 실제 stripper 주입 (단위 테스트는 별도 spec 에서 cover)
        MailStripper,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'MAIL_COMPANY_NAME') return 'TestCo';
              if (key === 'MAIL_PRODUCT_NAME') return 'TestProduct';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AdminMailService);
    mailSender = moduleRef.get(MailSender);
    validator = moduleRef.get(AdminMailValidator);
  });

  describe('sendBulkRaw', () => {
    it('정상: validator 통과 후 sender.sendBulk 호출 + html → text 변환', async () => {
      mailSender.sendBulk.mockResolvedValue(SendMailResult.of({ success: ['a@t.com'], failed: [] }));
      const data = AdminSendBulkRawData.of({
        recipients: ['a@t.com'],
        subject: '안내',
        html: '<p>본문 첫 줄</p><p>둘째 줄</p>',
        lang: 'en-US',
      });

      const result = await service.sendBulkRaw(data);

      expect(validator.assertValidCount).toHaveBeenCalledWith(['a@t.com']);
      expect(validator.assertAllRegistered).toHaveBeenCalledWith(['a@t.com']);
      expect(result.successCount).toBe(1);
      const call = mailSender.sendBulk.mock.calls[0]![0];
      expect(call.toList).toEqual(['a@t.com']);
      expect(call.subject).toBe('안내');
      expect(call.text).toContain('본문 첫 줄');
      expect(call.text).not.toContain('<p>');
    });

    it('validator 가 throw 하면 sender 는 호출되지 않음', async () => {
      validator.assertValidCount.mockImplementation(() => {
        throw new BadRequestException({ errorType: CoreDomainError.INVALID_MAIL_RECIPIENT });
      });
      const data = AdminSendBulkRawData.of({ recipients: ['a@t.com'], subject: 's', html: '<p>h</p>', lang: 'en-US' });

      await expect(service.sendBulkRaw(data)).rejects.toThrow(BadRequestException);
      expect(mailSender.sendBulk).not.toHaveBeenCalled();
    });
  });

  describe('sendBulkByTemplate', () => {
    it('announcement 템플릿: subject prefix + bodyHtml 삽입 + lang 적용', async () => {
      mailSender.sendBulk.mockResolvedValue(SendMailResult.of({ success: ['a@t.com'], failed: [] }));
      const data = AdminSendBulkTemplateData.of({
        recipients: ['a@t.com'],
        templateId: 'announcement',
        vars: { subject: '점검 안내', bodyHtml: '<p>점검 예정</p>' },
        lang: 'ko',
      });

      await service.sendBulkByTemplate(data);

      const call = mailSender.sendBulk.mock.calls[0]![0];
      expect(call.subject).toBe('[TestProduct] 점검 안내');
      expect(call.html).toContain('<p>점검 예정</p>');
      // ko footer 가 들어감
      expect(call.html).toContain('본 메일은 발신 전용');
      expect(call.text).toContain('점검 예정');
    });

    it('announcement 템플릿에서 vars 누락이면 INVALID_MAIL_RECIPIENT', async () => {
      const data = AdminSendBulkTemplateData.of({
        recipients: ['a@t.com'],
        templateId: 'announcement',
        vars: { subject: '안내' },
        lang: 'en-US',
      });

      await expect(service.sendBulkByTemplate(data)).rejects.toMatchObject({
        constructor: BadRequestException,
        response: { errorType: { code: 'INVALID_MAIL_RECIPIENT' } },
      });
    });
  });
});
