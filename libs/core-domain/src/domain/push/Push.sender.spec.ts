import { Test, TestingModule } from '@nestjs/testing';

import * as admin from 'firebase-admin';

import { FIREBASE_APP_TOKEN } from '@libs/core-contract/src/fcm/Fcm.token';

import { PushSender } from './Push.sender';

describe('PushSender', () => {
  let sender: PushSender;
  let messagingSend: jest.Mock;
  let messagingMulticast: jest.Mock;

  beforeEach(async () => {
    messagingSend = jest.fn();
    messagingMulticast = jest.fn();
    const firebaseApp = {
      messaging: () => ({ send: messagingSend, sendEachForMulticast: messagingMulticast }),
    } as unknown as admin.app.App;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [PushSender, { provide: FIREBASE_APP_TOKEN, useValue: firebaseApp }],
    }).compile();

    sender = moduleRef.get(PushSender);
  });

  describe('sendOne', () => {
    it('messaging.send 가 token / notification / data 와 함께 호출됨', async () => {
      messagingSend.mockResolvedValue('msg-id-1');

      await sender.sendOne('tok-1', { title: '제목', body: '본문', data: { route: '/x' } });

      expect(messagingSend).toHaveBeenCalledWith({
        token: 'tok-1',
        notification: { title: '제목', body: '본문' },
        data: { route: '/x' },
      });
    });

    it('FCM 호출 실패는 그대로 throw', async () => {
      messagingSend.mockRejectedValue(new Error('invalid-token'));

      await expect(sender.sendOne('tok-1', { title: 's', body: 'b' })).rejects.toThrow('invalid-token');
    });
  });

  describe('sendBulk', () => {
    it('tokens 가 비면 messaging 호출 없이 빈 결과 반환', async () => {
      const result = await sender.sendBulk({ tokens: [], title: 's', body: 'b' });

      expect(messagingMulticast).not.toHaveBeenCalled();
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(0);
    });

    it('multicast 응답을 success/failed 로 분류 (개별 실패는 throw 하지 않음)', async () => {
      messagingMulticast.mockResolvedValue({
        responses: [
          { success: true, messageId: 'm1' },
          { success: false, error: { code: 'messaging/registration-token-not-registered', message: 'invalid' } },
          { success: true, messageId: 'm3' },
        ],
      });

      const result = await sender.sendBulk({ tokens: ['t1', 't2', 't3'], title: 's', body: 'b' });

      expect(result.success).toEqual(['t1', 't3']);
      expect(result.failedCount).toBe(1);
      expect(result.failed[0]!.pushToken).toBe('t2');
      expect(result.failed[0]!.reason).toContain('invalid');
    });
  });
});
