import { Test, TestingModule } from '@nestjs/testing';

import { UserEntity } from '@libs/core-database/src/mysql/entity/user/User.entity';
import { UserRepository } from '@libs/core-database/src/mysql/entity/user/User.repository';

import { CreateUserData } from './data/CreateUserData';
import { GetUserOauthResult } from './result/GetUserOauthResult';
import { GetUserResult } from './result/GetUserResult';
import { UserCreator } from './User.creator';
import { UserReader } from './User.reader';

describe('UserCreator', () => {
  let creator: UserCreator;
  let userRepository: jest.Mocked<Pick<UserRepository, 'createUser'>>;
  let userReader: jest.Mocked<Pick<UserReader, 'verifyEmailNotTaken' | 'findByEmail'>>;

  const buildData = () =>
    CreateUserData.fromOauthUserInfo({ email: 'a@test.com', firstname: 'A', lastname: 'B', avatarUrl: null, defaultLanguage: 'en-US' });

  const buildCreated = (overrides: Partial<UserEntity> = {}): UserEntity =>
    ({
      id: 1,
      email: 'a@test.com',
      firstname: 'A',
      lastname: 'B',
      avatarUrl: null,
      status: 'ACTIVE',
      defaultLanguage: 'en-US',
      createdAt: new Date('2026-01-01'),
      ...overrides,
    }) as unknown as UserEntity;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserCreator,
        { provide: UserRepository, useValue: { createUser: jest.fn() } },
        { provide: UserReader, useValue: { verifyEmailNotTaken: jest.fn(), findByEmail: jest.fn() } },
      ],
    }).compile();

    creator = moduleRef.get(UserCreator);
    userRepository = moduleRef.get(UserRepository);
    userReader = moduleRef.get(UserReader);
  });

  describe('createUserFromOauth', () => {
    it('이메일 중복 검증 후 user 생성, GetUserResult 반환', async () => {
      userReader.verifyEmailNotTaken.mockResolvedValue(undefined);
      userRepository.createUser.mockResolvedValue(buildCreated({ id: 42 }));

      const result = await creator.createUserFromOauth(buildData());

      expect(result.id).toBe(42);
      expect(userReader.verifyEmailNotTaken).toHaveBeenCalledWith('a@test.com');
      expect(userRepository.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@test.com', status: 'ACTIVE' }));
    });

    it('이메일 중복이면 후속 호출 없음', async () => {
      userReader.verifyEmailNotTaken.mockRejectedValue(new Error('DUPLICATE_EMAIL'));

      await expect(creator.createUserFromOauth(buildData())).rejects.toThrow();
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreateIfNoOauth', () => {
    it('기존 oauth 가 있으면 { userId: null, isNewUser: false } 반환 (생성 X)', async () => {
      const result = await creator.findOrCreateIfNoOauth(buildData(), { userId: 7 } as unknown as GetUserOauthResult);

      expect(result).toEqual({ userId: null, isNewUser: false });
      expect(userReader.findByEmail).not.toHaveBeenCalled();
    });

    it('oauth 는 없는데 같은 email 의 user 가 이미 있으면 { userId, isNewUser: false } 반환', async () => {
      userReader.findByEmail.mockResolvedValue({ id: 11 } as unknown as GetUserResult);

      const result = await creator.findOrCreateIfNoOauth(buildData(), null);

      expect(result).toEqual({ userId: 11, isNewUser: false });
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it('oauth 도 user 도 없으면 새 user 생성 후 { userId, isNewUser: true } 반환', async () => {
      userReader.findByEmail.mockResolvedValue(null);
      userReader.verifyEmailNotTaken.mockResolvedValue(undefined);
      userRepository.createUser.mockResolvedValue(buildCreated({ id: 99 }));

      const result = await creator.findOrCreateIfNoOauth(buildData(), null);

      expect(result).toEqual({ userId: 99, isNewUser: true });
      expect(userRepository.createUser).toHaveBeenCalledTimes(1);
    });
  });
});
