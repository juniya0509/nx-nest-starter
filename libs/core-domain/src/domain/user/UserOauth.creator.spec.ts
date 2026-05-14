import { Test, TestingModule } from '@nestjs/testing';

import { UserOauthEntity } from '@libs/core-database/src/mysql/entity/user/UserOauth.entity';
import { UserOauthRepository } from '@libs/core-database/src/mysql/entity/user/UserOauth.repository';

import { CreateUserOauthData } from './data/CreateUserOauthData';
import { UserOauthCreator } from './UserOauth.creator';

describe('UserOauthCreator', () => {
  let creator: UserOauthCreator;
  let userOauthRepository: jest.Mocked<Pick<UserOauthRepository, 'createUserOauth'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UserOauthCreator, { provide: UserOauthRepository, useValue: { createUserOauth: jest.fn() } }],
    }).compile();

    creator = moduleRef.get(UserOauthCreator);
    userOauthRepository = moduleRef.get(UserOauthRepository);
  });

  it('createUserOauth: data 그대로 repo 위임 + GetUserOauthResult 반환', async () => {
    const data = CreateUserOauthData.fromOauthUserInfo({
      userId: 7,
      logtoUserId: 'logto-1',
      provider: 'KAKAO',
      providerUserId: 'k_1',
    });
    userOauthRepository.createUserOauth.mockResolvedValue({
      id: 99,
      logtoUserId: 'logto-1',
      provider: 'KAKAO',
      providerUserId: 'k_1',
    } as unknown as UserOauthEntity);

    const result = await creator.createUserOauth(data);

    expect(result.id).toBe(99);
    expect(result.userId).toBe(7);
    expect(result.provider).toBe('KAKAO');
    expect(userOauthRepository.createUserOauth).toHaveBeenCalledWith({
      userId: 7,
      logtoUserId: 'logto-1',
      provider: 'KAKAO',
      providerUserId: 'k_1',
    });
  });
});
