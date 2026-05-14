import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

import { SES_CLIENT_TOKEN } from '@libs/core-contract/src/ses/Ses.token';

import { MailSender } from './Mail.sender';

describe('MailSender', () => {
  let sender: MailSender;
  let sesSend: jest.Mock;
  let configMap: Record<string, string>;

  const buildSender = async (config: Record<string, string>) => {
    configMap = config;
    sesSend = jest.fn();
    const sesClientMock = { send: sesSend } as unknown as SESClient;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MailSender,
        { provide: SES_CLIENT_TOKEN, useValue: sesClientMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockImplementation((key: string) => configMap[key]) },
        },
      ],
    }).compile();

    sender = moduleRef.get(MailSender);
  };

  beforeEach(async () => {
    await buildSender({ SES_FROM_EMAIL: 'noreply@from.com' });
  });

  describe('sendOne', () => {
    it('SES_FROM_NAME 미설정: Source 는 email-only', async () => {
      sesSend.mockResolvedValue({});

      await sender.sendOne({ to: 'a@t.com', subject: '제목', html: '<p>본문</p>', text: '본문' });

      expect(sesSend).toHaveBeenCalledTimes(1);
      const command = sesSend.mock.calls[0]![0] as SendEmailCommand;
      expect(command).toBeInstanceOf(SendEmailCommand);
      const input = command.input;
      expect(input.Source).toBe('noreply@from.com');
      expect(input.Destination?.ToAddresses).toEqual(['a@t.com']);
      expect(input.Message?.Subject?.Data).toBe('제목');
      expect(input.Message?.Subject?.Charset).toBe('UTF-8');
      expect(input.Message?.Body?.Html?.Data).toBe('<p>본문</p>');
      expect(input.Message?.Body?.Text?.Data).toBe('본문');
    });

    it('SES_FROM_NAME 설정 시: Source 는 "이름 <email>" 형식', async () => {
      await buildSender({ SES_FROM_EMAIL: 'noreply@from.com', SES_FROM_NAME: '보낸사람' });
      sesSend.mockResolvedValue({});

      await sender.sendOne({ to: 'a@t.com', subject: 's', html: 'h', text: 't' });

      const command = sesSend.mock.calls[0]![0] as SendEmailCommand;
      expect(command.input.Source).toBe('보낸사람 <noreply@from.com>');
    });

    it('SES_FROM_NAME 이 빈 문자열이면 email-only 로 fallback', async () => {
      await buildSender({ SES_FROM_EMAIL: 'noreply@from.com', SES_FROM_NAME: '   ' });
      sesSend.mockResolvedValue({});

      await sender.sendOne({ to: 'a@t.com', subject: 's', html: 'h', text: 't' });

      const command = sesSend.mock.calls[0]![0] as SendEmailCommand;
      expect(command.input.Source).toBe('noreply@from.com');
    });

    it('SES send 가 reject 하면 그대로 throw', async () => {
      sesSend.mockRejectedValue(new Error('throttled'));

      await expect(sender.sendOne({ to: 'a@t.com', subject: 's', html: 'h', text: 't' })).rejects.toThrow('throttled');
    });
  });

  describe('sendBulk', () => {
    it('수신자 수만큼 send 호출, 모두 성공이면 success 누적', async () => {
      sesSend.mockResolvedValue({});

      const result = await sender.sendBulk({ toList: ['a@t.com', 'b@t.com', 'c@t.com'], subject: 's', html: 'h', text: 't' });

      expect(sesSend).toHaveBeenCalledTimes(3);
      expect(result.successCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.success).toEqual(['a@t.com', 'b@t.com', 'c@t.com']);
    });

    it('일부 실패는 failed 배열에 reason 과 함께 누적되고 throw 하지 않음', async () => {
      sesSend.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('rate-limit')).mockResolvedValueOnce({});

      const result = await sender.sendBulk({ toList: ['a@t.com', 'b@t.com', 'c@t.com'], subject: 's', html: 'h', text: 't' });

      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.success).toEqual(['a@t.com', 'c@t.com']);
      expect(result.failed).toEqual([{ email: 'b@t.com', reason: 'rate-limit' }]);
    });

    it('수신자가 0명이면 send 호출 없이 빈 결과', async () => {
      const result = await sender.sendBulk({ toList: [], subject: 's', html: 'h', text: 't' });

      expect(sesSend).not.toHaveBeenCalled();
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(0);
    });

    it('Error 가 아닌 값으로 reject 되면 reason 은 fallback 문자열', async () => {
      sesSend.mockRejectedValueOnce('weird-string-rejection');

      const result = await sender.sendBulk({ toList: ['x@t.com'], subject: 's', html: 'h', text: 't' });

      expect(result.failed[0]!.reason).toBe('weird-string-rejection');
    });
  });
});
