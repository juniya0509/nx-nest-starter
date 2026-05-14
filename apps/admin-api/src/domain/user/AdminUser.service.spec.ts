import { Test, TestingModule } from '@nestjs/testing';

import { AdminUserReader } from './AdminUser.reader';
import { AdminUserService } from './AdminUser.service';
import { AdminGetUserListData } from './data/AdminGetUserListData';
import { AdminGetUserResult } from './result/AdminGetUserResult';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let reader: jest.Mocked<Pick<AdminUserReader, 'getByIdOrThrow' | 'findListWithPagination'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUserService,
        {
          provide: AdminUserReader,
          useValue: { getByIdOrThrow: jest.fn(), findListWithPagination: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(AdminUserService);
    reader = moduleRef.get(AdminUserReader);
  });

  describe('getUser', () => {
    it('reader.getByIdOrThrow 를 호출하고 결과를 그대로 반환한다', async () => {
      const expected = {} as AdminGetUserResult;
      reader.getByIdOrThrow.mockResolvedValue(expected);

      const result = await service.getUser(42);

      expect(result).toBe(expected);
      expect(reader.getByIdOrThrow).toHaveBeenCalledWith(42);
    });
  });

  describe('getUserList', () => {
    it('reader.findListWithPagination 을 호출하고 결과를 그대로 반환한다', async () => {
      const data = AdminGetUserListData.of({ page: 1, limit: 20, keyword: '', status: null });
      const expected = { list: [], totalPages: 0, totalResults: 0 };
      reader.findListWithPagination.mockResolvedValue(expected);

      const result = await service.getUserList(data);

      expect(result).toBe(expected);
      expect(reader.findListWithPagination).toHaveBeenCalledWith(data);
    });
  });
});
