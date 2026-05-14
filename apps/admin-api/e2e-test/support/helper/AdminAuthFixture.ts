import { INestApplication } from '@nestjs/common';

import { DataSource } from 'typeorm';

import { UserEntity } from '@libs/core-database/src/mysql/entity/user/User.entity';

import { JwtIssuer } from '@libs/core-domain/src/domain/auth/Jwt.issuer';

import { AdminAccountEntity } from '../../../src/database/mysql/entity/admin-account/AdminAccount.entity';
import { AdminAccountPermissionEntity } from '../../../src/database/mysql/entity/admin-permission/AdminAccountPermission.entity';
import { AdminPermissionEntity } from '../../../src/database/mysql/entity/admin-permission/AdminPermission.entity';
import { AdminPermission } from '../../../src/enum/AdminPermission.enum';

const ADMIN_TABLES_IN_DELETE_ORDER = [
  'admin_account_preset',
  'admin_account_permission',
  'admin_permission_preset_item',
  'admin_permission_preset',
  'admin_permission',
  'admin_account',
];

const USER_TABLES_IN_DELETE_ORDER = ['user_token', 'user_oauth', 'user_device', 'user'];

export type SeededAdmin = {
  readonly userId: number;
  readonly adminAccountId: number;
  readonly accessJwt: string;
};

export class AdminAuthFixture {
  private constructor(
    private readonly dataSource: DataSource,
    private readonly jwtIssuer: JwtIssuer,
  ) {}

  static of(app: INestApplication): AdminAuthFixture {
    return new AdminAuthFixture(app.get(DataSource), app.get(JwtIssuer));
  }

  async seedUser(overrides: Partial<UserEntity> = {}): Promise<UserEntity> {
    const repo = this.dataSource.getRepository(UserEntity);
    const entity = repo.create({
      email: this.uniqueEmail('user'),
      firstname: 'User',
      lastname: 'Test',
      avatarUrl: null,
      status: 'ACTIVE',
      countryCallingCode: null,
      phoneNumber: null,
      countryCode: null,
      ...overrides,
    });
    return repo.save(entity);
  }

  async seedAdminWithPermissions(permissions: AdminPermission[] = []): Promise<SeededAdmin> {
    const user = await this.seedUser({ email: this.uniqueEmail('admin') });

    const adminAccountRepo = this.dataSource.getRepository(AdminAccountEntity);
    const adminAccount = await adminAccountRepo.save(adminAccountRepo.create({ user, status: 'ACTIVE', memo: null }));

    if (permissions.length > 0) {
      const permissionRepo = this.dataSource.getRepository(AdminPermissionEntity);
      const accountPermissionRepo = this.dataSource.getRepository(AdminAccountPermissionEntity);

      for (const permission of permissions) {
        let permissionEntity = await permissionRepo.findOne({ where: { code: permission.code } });
        if (!permissionEntity) {
          permissionEntity = await permissionRepo.save(
            permissionRepo.create({
              code: permission.code,
              groupCode: permission.group,
              description: permission.description,
            }),
          );
        }
        await accountPermissionRepo.save(accountPermissionRepo.create({ adminAccount, permission: permissionEntity }));
      }
    }

    const issued = await this.jwtIssuer.issueAccessToken(user.id);

    return { userId: user.id, adminAccountId: adminAccount.id, accessJwt: issued.token };
  }

  async issueJwtForUserId(userId: number): Promise<string> {
    const issued = await this.jwtIssuer.issueAccessToken(userId);
    return issued.token;
  }

  async clearAll(): Promise<void> {
    await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      for (const table of [...ADMIN_TABLES_IN_DELETE_ORDER, ...USER_TABLES_IN_DELETE_ORDER]) {
        await this.dataSource.query(`DELETE FROM \`${table}\``);
        await this.dataSource.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
      }
    } finally {
      await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }

  private uniqueEmail(prefix: string): string {
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${Date.now()}-${random}@test.local`;
  }
}
