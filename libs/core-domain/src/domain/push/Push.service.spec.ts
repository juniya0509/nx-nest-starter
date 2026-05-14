import { Test, TestingModule } from '@nestjs/testing';

import { GetUserDeviceResult } from '../user/result/GetUserDeviceResult';
import { UserDeviceReader } from '../user/UserDevice.reader';

import { PushSender } from './Push.sender';
import { PushService } from './Push.service';
import { SendPushResult } from './result/SendPushResult';
import { PushTemplate } from './template/PushTemplate';

type Vars = { name: string };

const sampleTemplate: PushTemplate<Vars> = {
  buildTitle: (v, lang) => (lang === 'ko' ? `${v.name} 님` : `Hi ${v.name}`),
  buildBody: (_v, lang) => (lang === 'ko' ? '본문 한국어' : 'body english'),
  buildData: () => ({ route: '/home' }),
};

describe('PushService', () => {
  let service: PushService;
  let pushSender: jest.Mocked<Pick<PushSender, 'sendBulk'>>;
  let reader: jest.Mocked<Pick<UserDeviceReader, 'findByUserId' | 'findByUserIds'>>;

  const buildDevice = (overrides: Partial<{ pushToken: string; language: 'ko' | 'en-US' | 'ja' }> = {}): GetUserDeviceResult =>
    GetUserDeviceResult.of({
      id: 1,
      userId: 1,
      deviceType: 'IOS_APP',
      pushToken: overrides.pushToken ?? 'tok-1',
      language: overrides.language ?? 'en-US',
    });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: PushSender, useValue: { sendBulk: jest.fn() } },
        { provide: UserDeviceReader, useValue: { findByUserId: jest.fn(), findByUserIds: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(PushService);
    pushSender = moduleRef.get(PushSender);
    reader = moduleRef.get(UserDeviceReader);
  });

  describe('sendToUser', () => {
    it('device 가 없으면 sender 호출 없이 빈 결과', async () => {
      reader.findByUserId.mockResolvedValue([]);

      const result = await service.sendToUser(1, sampleTemplate, { name: 'Alice' });

      expect(pushSender.sendBulk).not.toHaveBeenCalled();
      expect(result.successCount).toBe(0);
    });

    it('lang 이 다른 device 들 → lang 별로 sendBulk 호출, title/body 가 lang 별 분기', async () => {
      reader.findByUserId.mockResolvedValue([
        buildDevice({ pushToken: 'k-1', language: 'ko' }),
        buildDevice({ pushToken: 'k-2', language: 'ko' }),
        buildDevice({ pushToken: 'e-1', language: 'en-US' }),
      ]);
      pushSender.sendBulk
        .mockResolvedValueOnce(SendPushResult.of({ success: ['k-1', 'k-2'], failed: [] }))
        .mockResolvedValueOnce(SendPushResult.of({ success: ['e-1'], failed: [] }));

      const result = await service.sendToUser(1, sampleTemplate, { name: 'Alice' });

      expect(pushSender.sendBulk).toHaveBeenCalledTimes(2);
      const koCall = pushSender.sendBulk.mock.calls.find((c) => c[0].title.includes('님'))!;
      const enCall = pushSender.sendBulk.mock.calls.find((c) => c[0].title.startsWith('Hi'))!;
      expect(koCall[0].tokens).toEqual(['k-1', 'k-2']);
      expect(koCall[0].body).toBe('본문 한국어');
      expect(koCall[0].data).toEqual({ route: '/home' });
      expect(enCall[0].tokens).toEqual(['e-1']);
      expect(enCall[0].body).toBe('body english');
      expect(result.successCount).toBe(3);
    });

    it('일부 lang 그룹 실패가 결과에 누적됨 (전체 reject 안 함)', async () => {
      reader.findByUserId.mockResolvedValue([
        buildDevice({ pushToken: 'k-1', language: 'ko' }),
        buildDevice({ pushToken: 'e-1', language: 'en-US' }),
      ]);
      pushSender.sendBulk
        .mockResolvedValueOnce(SendPushResult.of({ success: ['k-1'], failed: [] }))
        .mockResolvedValueOnce(SendPushResult.of({ success: [], failed: [{ pushToken: 'e-1', reason: 'invalid' }] }));

      const result = await service.sendToUser(1, sampleTemplate, { name: 'Alice' });

      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.failed[0]!.pushToken).toBe('e-1');
    });
  });

  describe('sendToUsers', () => {
    it('userIds 의 모든 device 를 모아 dispatch', async () => {
      reader.findByUserIds.mockResolvedValue([
        buildDevice({ pushToken: 't1', language: 'ko' }),
        buildDevice({ pushToken: 't2', language: 'ko' }),
      ]);
      pushSender.sendBulk.mockResolvedValue(SendPushResult.of({ success: ['t1', 't2'], failed: [] }));

      const result = await service.sendToUsers([1, 2], sampleTemplate, { name: 'X' });

      expect(reader.findByUserIds).toHaveBeenCalledWith([1, 2]);
      expect(result.successCount).toBe(2);
    });
  });
});
