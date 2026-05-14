import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { GetUserResult } from '../user/result/GetUserResult';

import { MailResolver } from './Mail.resolver';
import { MailSender } from './Mail.sender';
import { MailService } from './Mail.service';

describe('MailService', () => {
  let service: MailService;
  let mailSender: jest.Mocked<Pick<MailSender, 'sendOne' | 'sendBulk'>>;

  const buildUser = (
    overrides: Partial<{ email: string; firstname: string | null; lastname: string | null; defaultLanguage: 'ko' | 'en-US' | 'ja' }> = {},
  ): GetUserResult =>
    GetUserResult.of({
      id: 1,
      email: overrides.email ?? 'alice@test.com',
      firstname: overrides.firstname === undefined ? 'Alice' : overrides.firstname,
      lastname: overrides.lastname === undefined ? 'Anderson' : overrides.lastname,
      avatarUrl: null,
      status: 'ACTIVE',
      defaultLanguage: overrides.defaultLanguage ?? 'en-US',
      createdAt: new Date('2026-01-01'),
    });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailSender, useValue: { sendOne: jest.fn(), sendBulk: jest.fn() } },
        // 실제 resolver 주입 — service ↔ resolver 결합 동작도 함께 확인 (resolver 단위 테스트는 별도 spec).
        MailResolver,
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

    service = moduleRef.get(MailService);
    mailSender = moduleRef.get(MailSender);
  });

  describe('sendWelcome', () => {
    it('Welcome 템플릿 + env 의 회사명/제품명을 적용해서 sender 단건 호출 (en-US)', async () => {
      mailSender.sendOne.mockResolvedValue(undefined);

      await service.sendWelcome(buildUser());

      expect(mailSender.sendOne).toHaveBeenCalledTimes(1);
      const call = mailSender.sendOne.mock.calls[0]![0];
      expect(call.to).toBe('alice@test.com');
      expect(call.subject).toContain('Welcome to TestProduct');
      expect(call.html).toContain('Alice Anderson');
      expect(call.html).toContain('TestProduct');
      expect(call.html).toContain('TestCo');
      expect(call.text).toContain('Alice Anderson');
    });

    it('user.defaultLanguage 가 ko 면 한국어 템플릿이 적용됨', async () => {
      mailSender.sendOne.mockResolvedValue(undefined);

      await service.sendWelcome(buildUser({ defaultLanguage: 'ko' }));

      const call = mailSender.sendOne.mock.calls[0]![0];
      expect(call.subject).toContain('가입을 환영합니다');
      expect(call.html).toContain('회원가입이 정상적으로 완료');
    });

    it('user.defaultLanguage 가 ja 면 일본어 템플릿이 적용됨', async () => {
      mailSender.sendOne.mockResolvedValue(undefined);

      await service.sendWelcome(buildUser({ defaultLanguage: 'ja' }));

      const call = mailSender.sendOne.mock.calls[0]![0];
      expect(call.subject).toContain('ようこそ');
    });

    it('이름이 둘 다 없으면 email local-part 로 fallback', async () => {
      mailSender.sendOne.mockResolvedValue(undefined);

      await service.sendWelcome(buildUser({ firstname: null, lastname: null }));

      const call = mailSender.sendOne.mock.calls[0]![0];
      expect(call.html).toContain('alice');
    });

    it('sender 가 throw 하면 그대로 propagate (호출 측이 catch 책임)', async () => {
      mailSender.sendOne.mockRejectedValue(new Error('SES down'));

      await expect(service.sendWelcome(buildUser())).rejects.toThrow('SES down');
    });
  });
});
