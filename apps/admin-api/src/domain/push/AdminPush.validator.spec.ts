import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { GetUserResult } from '@libs/core-domain/src/domain/user/result/GetUserResult';
import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';

import { AdminPushValidator } from './AdminPush.validator';

describe('AdminPushValidator', () => {
  let validator: AdminPushValidator;
  let userReader: jest.Mocked<Pick<UserReader, 'findByIdList'>>;

  const buildUser = (id: number): GetUserResult =>
    GetUserResult.of({
      id,
      email: `u${id}@t.com`,
      firstname: null,
      lastname: null,
      avatarUrl: null,
      status: 'ACTIVE',
      defaultLanguage: 'en-US',
      createdAt: new Date('2026-01-01'),
    });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AdminPushValidator, { provide: UserReader, useValue: { findByIdList: jest.fn() } }],
    }).compile();

    validator = moduleRef.get(AdminPushValidator);
    userReader = moduleRef.get(UserReader);
  });

  describe('assertValidCount', () => {
    it('빈 배열 → INVALID_MAIL_RECIPIENT', () => {
      expect(() => validator.assertValidCount([])).toThrow(BadRequestException);
    });

    it('100명 초과 → INVALID_MAIL_RECIPIENT', () => {
      expect(() => validator.assertValidCount(Array.from({ length: 101 }, (_, i) => i + 1))).toThrow(BadRequestException);
    });

    it('1..100 → 통과', () => {
      expect(() => validator.assertValidCount([1])).not.toThrow();
      expect(() => validator.assertValidCount(Array.from({ length: 100 }, (_, i) => i + 1))).not.toThrow();
    });
  });

  describe('assertAllRegistered', () => {
    it('모두 등록된 user.id 면 통과', async () => {
      userReader.findByIdList.mockResolvedValue([buildUser(1), buildUser(2)]);

      await expect(validator.assertAllRegistered([1, 2])).resolves.toBeUndefined();
    });

    it('하나라도 미등록이면 INVALID_MAIL_RECIPIENT + errorData.unregistered 에 누락 id', async () => {
      userReader.findByIdList.mockResolvedValue([buildUser(1)]);

      await expect(validator.assertAllRegistered([1, 999])).rejects.toMatchObject({
        constructor: BadRequestException,
        response: {
          errorType: { code: 'INVALID_MAIL_RECIPIENT' },
          errorData: { unregistered: [999] },
        },
      });
    });
  });
});
