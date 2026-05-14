import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PushSender } from '@libs/core-domain/src/domain/push/Push.sender';
import { SendPushResult } from '@libs/core-domain/src/domain/push/result/SendPushResult';
import { GetUserDeviceResult } from '@libs/core-domain/src/domain/user/result/GetUserDeviceResult';
import { UserDeviceReader } from '@libs/core-domain/src/domain/user/UserDevice.reader';
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminPushService } from './AdminPush.service';
import { AdminPushValidator } from './AdminPush.validator';
import { AdminSendBulkPushRawData } from './data/AdminSendBulkPushRawData';

describe('AdminPushService', () => {
  let service: AdminPushService;
  let pushSender: jest.Mocked<Pick<PushSender, 'sendBulk'>>;
  let userDeviceReader: jest.Mocked<Pick<UserDeviceReader, 'findByUserIds'>>;
  let validator: jest.Mocked<Pick<AdminPushValidator, 'assertValidCount' | 'assertAllRegistered'>>;

  const buildDevice = (pushToken: string): GetUserDeviceResult =>
    GetUserDeviceResult.of({ id: 1, userId: 1, deviceType: 'IOS_APP', pushToken, language: 'en-US' });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPushService,
        { provide: PushSender, useValue: { sendBulk: jest.fn() } },
        { provide: UserDeviceReader, useValue: { findByUserIds: jest.fn() } },
        {
          provide: AdminPushValidator,
          useValue: { assertValidCount: jest.fn(), assertAllRegistered: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = moduleRef.get(AdminPushService);
    pushSender = moduleRef.get(PushSender);
    userDeviceReader = moduleRef.get(UserDeviceReader);
    validator = moduleRef.get(AdminPushValidator);
  });

  describe('sendBulkRaw', () => {
    it('정상: validator 통과 후 user 들의 모든 device 를 한 번에 sendBulk', async () => {
      userDeviceReader.findByUserIds.mockResolvedValue([buildDevice('t1'), buildDevice('t2')]);
      pushSender.sendBulk.mockResolvedValue(SendPushResult.of({ success: ['t1', 't2'], failed: [] }));

      const data = AdminSendBulkPushRawData.of({
        userIds: [1, 2],
        title: '공지',
        body: '본문',
        dataPayload: { route: '/notice/1' },
      });

      const result = await service.sendBulkRaw(data);

      expect(validator.assertValidCount).toHaveBeenCalledWith([1, 2]);
      expect(validator.assertAllRegistered).toHaveBeenCalledWith([1, 2]);
      expect(pushSender.sendBulk).toHaveBeenCalledWith({
        tokens: ['t1', 't2'],
        title: '공지',
        body: '본문',
        data: { route: '/notice/1' },
      });
      expect(result.successCount).toBe(2);
    });

    it('해당 user 들에 device 가 하나도 없으면 sender 호출 없이 빈 결과 (오류 X)', async () => {
      userDeviceReader.findByUserIds.mockResolvedValue([]);

      const data = AdminSendBulkPushRawData.of({ userIds: [1], title: 's', body: 'b', dataPayload: null });

      const result = await service.sendBulkRaw(data);

      expect(pushSender.sendBulk).not.toHaveBeenCalled();
      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(0);
    });

    it('validator 가 throw 하면 sender 는 호출되지 않음', async () => {
      validator.assertValidCount.mockImplementation(() => {
        throw new BadRequestException({ errorType: CoreDomainError.INVALID_MAIL_RECIPIENT });
      });

      const data = AdminSendBulkPushRawData.of({ userIds: [1], title: 's', body: 'b', dataPayload: null });

      await expect(service.sendBulkRaw(data)).rejects.toThrow(BadRequestException);
      expect(pushSender.sendBulk).not.toHaveBeenCalled();
    });

    it('dataPayload 가 null 이면 sender 의 data 도 undefined 로 전달', async () => {
      userDeviceReader.findByUserIds.mockResolvedValue([buildDevice('t1')]);
      pushSender.sendBulk.mockResolvedValue(SendPushResult.of({ success: ['t1'], failed: [] }));

      await service.sendBulkRaw(AdminSendBulkPushRawData.of({ userIds: [1], title: 's', body: 'b', dataPayload: null }));

      const call = pushSender.sendBulk.mock.calls[0]![0];
      expect(call.data).toBeUndefined();
    });
  });
});
