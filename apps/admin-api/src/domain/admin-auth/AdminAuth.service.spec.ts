import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { errAsync, okAsync } from 'neverthrow';

import { JwtVerifier } from '@libs/core-domain/src/domain/auth/Jwt.verifier';
import { VerifiedJwtResult } from '@libs/core-domain/src/domain/auth/result/VerifiedJwtResult';
import { GetUserResult } from '@libs/core-domain/src/domain/user/result/GetUserResult';
import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';

import { AdminAccountStatusUnion } from '../../enum/AdminAccountStatus.enum';
import { AdminAccountReader } from '../admin-account/AdminAccount.reader';
import { AdminAccountResult } from '../admin-account/result/AdminAccountResult';
import { AdminPermissionReader } from '../admin-permission/AdminPermission.reader';

import { AdminAuthService } from './AdminAuth.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let jwtVerifier: jest.Mocked<Pick<JwtVerifier, 'verifyAccessToken'>>;
  let userReader: jest.Mocked<Pick<UserReader, 'getByIdOrThrow'>>;
  let adminAccountReader: jest.Mocked<Pick<AdminAccountReader, 'findByUserId'>>;
  let adminPermissionReader: jest.Mocked<Pick<AdminPermissionReader, 'findEffectivePermissionCodesByAdminAccountId'>>;

  const buildUser = (overrides: Partial<{ id: number; status: string }> = {}): GetUserResult =>
    ({
      id: 1,
      status: 'ACTIVE',
      ...overrides,
    }) as unknown as GetUserResult;

  const buildAdminAccount = (
    overrides: Partial<{ id: number; userId: number; status: AdminAccountStatusUnion }> = {},
  ): AdminAccountResult =>
    AdminAccountResult.of({
      id: 10,
      userId: 1,
      status: 'ACTIVE',
      memo: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        { provide: JwtVerifier, useValue: { verifyAccessToken: jest.fn() } },
        { provide: UserReader, useValue: { getByIdOrThrow: jest.fn() } },
        { provide: AdminAccountReader, useValue: { findByUserId: jest.fn() } },
        { provide: AdminPermissionReader, useValue: { findEffectivePermissionCodesByAdminAccountId: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AdminAuthService);
    jwtVerifier = moduleRef.get(JwtVerifier);
    userReader = moduleRef.get(UserReader);
    adminAccountReader = moduleRef.get(AdminAccountReader);
    adminPermissionReader = moduleRef.get(AdminPermissionReader);
  });

  const mockJwtOk = (userId: number): void => {
    jwtVerifier.verifyAccessToken.mockReturnValue(okAsync(VerifiedJwtResult.of({ userId })));
  };

  describe('resolveAdminContextByAccessJwt', () => {
    it('정상 흐름: ACTIVE 유저 + ACTIVE admin + 권한 코드 → AdminContextResult 반환', async () => {
      const user = buildUser({ id: 1, status: 'ACTIVE' });
      const adminAccount = buildAdminAccount({ id: 10, userId: 1, status: 'ACTIVE' });
      const permissionCodes = new Set(['USER_LIST', 'USER_READ']);

      mockJwtOk(1);
      userReader.getByIdOrThrow.mockResolvedValue(user);
      adminAccountReader.findByUserId.mockResolvedValue(adminAccount);
      adminPermissionReader.findEffectivePermissionCodesByAdminAccountId.mockResolvedValue(permissionCodes);

      const result = await service.resolveAdminContextByAccessJwt('jwt-token');

      expect(result.user).toBe(user);
      expect(result.adminAccount).toBe(adminAccount);
      expect(result.permissionCodes).toBe(permissionCodes);
      expect(jwtVerifier.verifyAccessToken).toHaveBeenCalledWith('jwt-token');
      expect(userReader.getByIdOrThrow).toHaveBeenCalledWith(1);
      expect(adminAccountReader.findByUserId).toHaveBeenCalledWith(1);
      expect(adminPermissionReader.findEffectivePermissionCodesByAdminAccountId).toHaveBeenCalledWith(10);
    });

    it('JWT 만료 시 EXPIRED_JWT_ACCESS_TOKEN UnauthorizedException', async () => {
      jwtVerifier.verifyAccessToken.mockReturnValue(errAsync('expired'));

      await expect(service.resolveAdminContextByAccessJwt('expired-jwt')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'EXPIRED_JWT_ACCESS_TOKEN' } },
      });
      expect(userReader.getByIdOrThrow).not.toHaveBeenCalled();
    });

    it('JWT 손상 시 INVALID_JWT_ACCESS_TOKEN UnauthorizedException', async () => {
      jwtVerifier.verifyAccessToken.mockReturnValue(errAsync('invalid'));

      await expect(service.resolveAdminContextByAccessJwt('garbage')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'INVALID_JWT_ACCESS_TOKEN' } },
      });
      expect(userReader.getByIdOrThrow).not.toHaveBeenCalled();
    });

    it('user.status=WITHDRAWN 이면 NOT_ACTIVED_USER UnauthorizedException', async () => {
      mockJwtOk(1);
      userReader.getByIdOrThrow.mockResolvedValue(buildUser({ status: 'WITHDRAWN' }));

      await expect(service.resolveAdminContextByAccessJwt('jwt')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'NOT_ACTIVED_USER' } },
      });
      expect(adminAccountReader.findByUserId).not.toHaveBeenCalled();
    });

    it('user.status=DELETED 이면 NOT_ACTIVED_USER UnauthorizedException', async () => {
      mockJwtOk(1);
      userReader.getByIdOrThrow.mockResolvedValue(buildUser({ status: 'DELETED' }));

      await expect(service.resolveAdminContextByAccessJwt('jwt')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'NOT_ACTIVED_USER' } },
      });
    });

    it('user.status=SUSPENDED 이면 SUSPENDED_USER UnauthorizedException', async () => {
      mockJwtOk(1);
      userReader.getByIdOrThrow.mockResolvedValue(buildUser({ status: 'SUSPENDED' }));

      await expect(service.resolveAdminContextByAccessJwt('jwt')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'SUSPENDED_USER' } },
      });
    });

    it('admin_account 가 없으면 DO_NOT_HAVE_PERMISSION UnauthorizedException', async () => {
      mockJwtOk(1);
      userReader.getByIdOrThrow.mockResolvedValue(buildUser());
      adminAccountReader.findByUserId.mockResolvedValue(null);

      await expect(service.resolveAdminContextByAccessJwt('jwt')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'DO_NOT_HAVE_PERMISSION' } },
      });
      expect(adminPermissionReader.findEffectivePermissionCodesByAdminAccountId).not.toHaveBeenCalled();
    });

    it('admin_account 가 비활성(SUSPENDED) 이면 DO_NOT_HAVE_PERMISSION UnauthorizedException', async () => {
      mockJwtOk(1);
      userReader.getByIdOrThrow.mockResolvedValue(buildUser());
      adminAccountReader.findByUserId.mockResolvedValue(buildAdminAccount({ status: 'SUSPENDED' }));

      await expect(service.resolveAdminContextByAccessJwt('jwt')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'DO_NOT_HAVE_PERMISSION' } },
      });
      expect(adminPermissionReader.findEffectivePermissionCodesByAdminAccountId).not.toHaveBeenCalled();
    });
  });
});
