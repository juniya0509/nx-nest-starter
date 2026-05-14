import { Test, TestingModule } from '@nestjs/testing';

import { AdminPermissionReader } from './AdminPermission.reader';
import { AdminPermissionService } from './AdminPermission.service';
import { AdminPermissionResult } from './result/AdminPermissionResult';

describe('AdminPermissionService', () => {
  let service: AdminPermissionService;
  let reader: jest.Mocked<Pick<AdminPermissionReader, 'findAllFromCatalog'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AdminPermissionService, { provide: AdminPermissionReader, useValue: { findAllFromCatalog: jest.fn() } }],
    }).compile();

    service = moduleRef.get(AdminPermissionService);
    reader = moduleRef.get(AdminPermissionReader);
  });

  describe('getCatalog', () => {
    it('reader.findAllFromCatalog 를 호출하고 결과를 그대로 반환', async () => {
      const expected: AdminPermissionResult[] = [];
      reader.findAllFromCatalog.mockResolvedValue(expected);

      const result = await service.getCatalog();

      expect(result).toBe(expected);
      expect(reader.findAllFromCatalog).toHaveBeenCalledTimes(1);
    });
  });
});
