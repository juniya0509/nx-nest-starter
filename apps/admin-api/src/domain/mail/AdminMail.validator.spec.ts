import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { GetUserResult } from '@libs/core-domain/src/domain/user/result/GetUserResult';
import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';

import { AdminMailValidator } from './AdminMail.validator';

describe('AdminMailValidator', () => {
  let validator: AdminMailValidator;
  let userReader: jest.Mocked<Pick<UserReader, 'findByEmails'>>;

  const buildUser = (email: string): GetUserResult =>
    GetUserResult.of({
      id: 1,
      email,
      firstname: null,
      lastname: null,
      avatarUrl: null,
      status: 'ACTIVE',
      defaultLanguage: 'en-US',
      createdAt: new Date('2026-01-01'),
    });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AdminMailValidator, { provide: UserReader, useValue: { findByEmails: jest.fn() } }],
    }).compile();

    validator = moduleRef.get(AdminMailValidator);
    userReader = moduleRef.get(UserReader);
  });

  describe('assertValidCount', () => {
    it('빈 배열 → INVALID_MAIL_RECIPIENT', () => {
      expect(() => validator.assertValidCount([])).toThrow(BadRequestException);
    });

    it('100명 초과 → INVALID_MAIL_RECIPIENT', () => {
      const recipients = Array.from({ length: 101 }, (_, i) => `u${i}@t.com`);
      expect(() => validator.assertValidCount(recipients)).toThrow(BadRequestException);
    });

    it('1..100 → 통과', () => {
      expect(() => validator.assertValidCount(['a@t.com'])).not.toThrow();
      expect(() => validator.assertValidCount(Array.from({ length: 100 }, (_, i) => `u${i}@t.com`))).not.toThrow();
    });
  });

  describe('assertAllRegistered', () => {
    it('모두 등록된 이메일이면 통과', async () => {
      userReader.findByEmails.mockResolvedValue([buildUser('a@t.com'), buildUser('b@t.com')]);

      await expect(validator.assertAllRegistered(['a@t.com', 'b@t.com'])).resolves.toBeUndefined();
    });

    it('하나라도 미등록이면 INVALID_MAIL_RECIPIENT + errorData.unregistered 에 누락 목록', async () => {
      userReader.findByEmails.mockResolvedValue([buildUser('a@t.com')]);

      await expect(validator.assertAllRegistered(['a@t.com', 'ghost@t.com'])).rejects.toMatchObject({
        constructor: BadRequestException,
        response: {
          errorType: { code: 'INVALID_MAIL_RECIPIENT' },
          errorData: { unregistered: ['ghost@t.com'] },
        },
      });
    });
  });
});
