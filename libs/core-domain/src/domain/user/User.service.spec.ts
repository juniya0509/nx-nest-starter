import { Test, TestingModule } from '@nestjs/testing';

import { GetUserResult } from './result/GetUserResult';
import { UserReader } from './User.reader';
import { UserService } from './User.service';

describe('UserService', () => {
  let service: UserService;
  let userReader: jest.Mocked<Pick<UserReader, 'getByIdOrThrow'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: UserReader, useValue: { getByIdOrThrow: jest.fn() } }],
    }).compile();

    service = moduleRef.get(UserService);
    userReader = moduleRef.get(UserReader);
  });

  it('getUserById: reader.getByIdOrThrow 위임', async () => {
    const expected = {} as GetUserResult;
    userReader.getByIdOrThrow.mockResolvedValue(expected);

    const result = await service.getUserById(7);

    expect(result).toBe(expected);
    expect(userReader.getByIdOrThrow).toHaveBeenCalledWith(7);
  });
});
