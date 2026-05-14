import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UserEntity } from '@libs/core-database/src/mysql/entity/user/User.entity';
import { UserRepository } from '@libs/core-database/src/mysql/entity/user/User.repository';

import { UserReader } from './User.reader';

describe('UserReader', () => {
  let reader: UserReader;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'findByEmail'>>;

  const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
    ({
      id: 1,
      email: 'a@test.com',
      firstname: 'A',
      lastname: 'B',
      avatarUrl: null,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01'),
      ...overrides,
    }) as unknown as UserEntity;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UserReader, { provide: UserRepository, useValue: { findById: jest.fn(), findByEmail: jest.fn() } }],
    }).compile();

    reader = moduleRef.get(UserReader);
    userRepository = moduleRef.get(UserRepository);
  });

  describe('findById', () => {
    it('존재하면 GetUserResult 반환', async () => {
      userRepository.findById.mockResolvedValue(buildUser({ id: 1 }));

      const result = await reader.findById(1);

      expect(result?.id).toBe(1);
      expect(result?.email).toBe('a@test.com');
    });

    it('없으면 null', async () => {
      userRepository.findById.mockResolvedValue(null);

      expect(await reader.findById(999)).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('존재하면 GetUserResult 반환', async () => {
      userRepository.findByEmail.mockResolvedValue(buildUser({ email: 'x@test.com' }));

      const result = await reader.findByEmail('x@test.com');

      expect(result?.email).toBe('x@test.com');
    });

    it('없으면 null', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      expect(await reader.findByEmail('none@test.com')).toBeNull();
    });
  });

  describe('getByIdOrThrow', () => {
    it('존재하면 GetUserResult 반환', async () => {
      userRepository.findById.mockResolvedValue(buildUser({ id: 1 }));

      const result = await reader.getByIdOrThrow(1);

      expect(result.id).toBe(1);
    });

    it('없으면 USER_NOT_FOUND NotFoundException', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(reader.getByIdOrThrow(999)).rejects.toMatchObject({
        constructor: NotFoundException,
        response: { errorType: { code: 'USER_NOT_FOUND' } },
      });
    });
  });

  describe('verifyEmailNotTaken', () => {
    it('이메일 미존재면 통과', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(reader.verifyEmailNotTaken('new@test.com')).resolves.toBeUndefined();
    });

    it('이미 있으면 DUPLICATE_EMAIL ConflictException', async () => {
      userRepository.findByEmail.mockResolvedValue(buildUser());

      await expect(reader.verifyEmailNotTaken('a@test.com')).rejects.toMatchObject({
        constructor: ConflictException,
        response: { errorType: { code: 'DUPLICATE_EMAIL' } },
      });
    });
  });
});
