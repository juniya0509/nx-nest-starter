import { INestApplication } from '@nestjs/common';

import { DataSource } from 'typeorm';

import { UserEntity } from '@libs/core-database/src/mysql/entity/user/User.entity';
import { UserTokenEntity } from '@libs/core-database/src/mysql/entity/user/UserToken.entity';

import { JwtIssuer } from '@libs/core-domain/src/domain/auth/Jwt.issuer';

const TABLES_IN_DELETE_ORDER = ['user_token', 'user_oauth', 'user_device', 'user'];

export type SeededUser = {
  readonly user: UserEntity;
  readonly accessJwt: string;
};

export class CoreAuthFixture {
  private constructor(
    private readonly dataSource: DataSource,
    private readonly jwtIssuer: JwtIssuer,
  ) {}

  static of(app: INestApplication): CoreAuthFixture {
    return new CoreAuthFixture(app.get(DataSource), app.get(JwtIssuer));
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

  async seedUserWithJwt(overrides: Partial<UserEntity> = {}): Promise<SeededUser> {
    const user = await this.seedUser(overrides);
    const issued = await this.jwtIssuer.issueAccessToken(user.id);
    return { user, accessJwt: issued.token };
  }

  async issueAccessJwtForUserId(userId: number): Promise<string> {
    const issued = await this.jwtIssuer.issueAccessToken(userId);
    return issued.token;
  }

  async issueRefreshJwtForUserId(userId: number): Promise<string> {
    const issued = await this.jwtIssuer.issueRefreshToken(userId);
    return issued.token;
  }

  /** Refresh JWT 발급 + user_token 테이블에 시드 (refresh 엔드포인트 테스트용) */
  async seedRefreshTokenForUser(user: UserEntity): Promise<string> {
    const issued = await this.jwtIssuer.issueRefreshToken(user.id);
    const tokenRepo = this.dataSource.getRepository(UserTokenEntity);
    await tokenRepo.save(
      tokenRepo.create({
        user,
        refreshToken: issued.token,
        expiresAt: issued.expiresAt,
      }),
    );
    return issued.token;
  }

  async clearAll(): Promise<void> {
    await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      for (const table of TABLES_IN_DELETE_ORDER) {
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
