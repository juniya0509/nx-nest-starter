import { Test, TestingModule } from '@nestjs/testing';

import { UserTokenEntity } from '@libs/core-database/src/mysql/entity/user/UserToken.entity';
import { UserTokenRepository } from '@libs/core-database/src/mysql/entity/user/UserToken.repository';

import { CreateUserTokenData } from './data/CreateUserTokenData';
import { UserTokenCreator } from './UserToken.creator';

describe('UserTokenCreator', () => {
  let creator: UserTokenCreator;
  let userTokenRepository: jest.Mocked<Pick<UserTokenRepository, 'createUserToken'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UserTokenCreator, { provide: UserTokenRepository, useValue: { createUserToken: jest.fn() } }],
    }).compile();

    creator = moduleRef.get(UserTokenCreator);
    userTokenRepository = moduleRef.get(UserTokenRepository);
  });

  it('createUserToken: data 그대로 repo 위임 + GetUserTokenResult 반환', async () => {
    const expiresAt = new Date('2026-12-01');
    const data = CreateUserTokenData.fromIssuedToken({ userId: 7, refreshToken: 'rt-new', expiresAt });
    userTokenRepository.createUserToken.mockResolvedValue({
      id: 99,
      refreshToken: 'rt-new',
      expiresAt,
    } as unknown as UserTokenEntity);

    const result = await creator.createUserToken(data);

    expect(result.id).toBe(99);
    expect(result.userId).toBe(7);
    expect(result.refreshToken).toBe('rt-new');
    expect(userTokenRepository.createUserToken).toHaveBeenCalledWith({
      userId: 7,
      refreshToken: 'rt-new',
      expiresAt,
    });
  });
});
