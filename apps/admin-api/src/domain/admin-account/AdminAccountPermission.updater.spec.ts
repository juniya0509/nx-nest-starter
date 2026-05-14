import { Test, TestingModule } from '@nestjs/testing';

import { AdminAccountPermissionRepository } from '../../database/mysql/entity/admin-permission/AdminAccountPermission.repository';

import { AdminAccountPermissionUpdater } from './AdminAccountPermission.updater';

describe('AdminAccountPermissionUpdater', () => {
  let updater: AdminAccountPermissionUpdater;
  let repository: jest.Mocked<Pick<AdminAccountPermissionRepository, 'replacePermissions'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAccountPermissionUpdater,
        { provide: AdminAccountPermissionRepository, useValue: { replacePermissions: jest.fn() } },
      ],
    }).compile();

    updater = moduleRef.get(AdminAccountPermissionUpdater);
    repository = moduleRef.get(AdminAccountPermissionRepository);
  });

  it('repo.replacePermissions 위임', async () => {
    repository.replacePermissions.mockResolvedValue(undefined);

    await updater.replacePermissions(7, [10, 20]);

    expect(repository.replacePermissions).toHaveBeenCalledWith(7, [10, 20]);
  });
});
