import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { errAsync, okAsync } from 'neverthrow';

import { MailService } from '../mail/Mail.service';
import { GetUserOauthResult } from '../user/result/GetUserOauthResult';
import { GetUserResult } from '../user/result/GetUserResult';
import { GetUserTokenResult } from '../user/result/GetUserTokenResult';
import { UserCreator } from '../user/User.creator';
import { UserReader } from '../user/User.reader';
import { UserDeviceCreator } from '../user/UserDevice.creator';
import { UserDeviceRemover } from '../user/UserDevice.remover';
import { UserOauthCreator } from '../user/UserOauth.creator';
import { UserOauthReader } from '../user/UserOauth.reader';
import { UserTokenCreator } from '../user/UserToken.creator';
import { UserTokenReader } from '../user/UserToken.reader';
import { UserTokenRemover } from '../user/UserToken.remover';

import { AuthReader } from './Auth.reader';
import { AuthService } from './Auth.service';
import { JwtIssuer } from './Jwt.issuer';
import { JwtVerifier } from './Jwt.verifier';
import { IssuedTokenResult } from './result/IssuedTokenResult';
import { LogtoUserInfoResult } from './result/LogtoUserInfoResult';
import { VerifiedJwtResult } from './result/VerifiedJwtResult';

describe('AuthService', () => {
  let service: AuthService;
  let authReader: jest.Mocked<Pick<AuthReader, 'resolveLogtoUserInfo'>>;
  let userReader: jest.Mocked<Pick<UserReader, 'getByIdOrThrow'>>;
  let userCreator: jest.Mocked<Pick<UserCreator, 'findOrCreateIfNoOauth'>>;
  let userOauthReader: jest.Mocked<Pick<UserOauthReader, 'findByLogtoUserId' | 'findByUserIdAndProvider'>>;
  let userOauthCreator: jest.Mocked<Pick<UserOauthCreator, 'createUserOauth'>>;
  let userTokenReader: jest.Mocked<Pick<UserTokenReader, 'findByRefreshToken' | 'getByRefreshTokenOrThrow'>>;
  let userTokenCreator: jest.Mocked<Pick<UserTokenCreator, 'createUserToken'>>;
  let userTokenRemover: jest.Mocked<Pick<UserTokenRemover, 'removeByRefreshToken'>>;
  let userDeviceCreator: jest.Mocked<Pick<UserDeviceCreator, 'upsertByPushToken'>>;
  let userDeviceRemover: jest.Mocked<Pick<UserDeviceRemover, 'removeByPushToken'>>;
  let jwtIssuer: jest.Mocked<Pick<JwtIssuer, 'issueAccessToken' | 'issueRefreshToken'>>;
  let jwtVerifier: jest.Mocked<Pick<JwtVerifier, 'verifyAccessToken' | 'verifyRefreshToken'>>;
  let mailService: jest.Mocked<Pick<MailService, 'sendWelcome'>>;

  const buildLogtoUser = (overrides: Partial<{ logtoUserId: string; email: string }> = {}): LogtoUserInfoResult =>
    LogtoUserInfoResult.of({
      logtoUserId: overrides.logtoUserId ?? 'logto-user-1',
      email: overrides.email ?? 'a@test.com',
      firstname: 'A',
      lastname: 'B',
      avatarUrl: null,
      identities: { kakao: { userId: 'k_1' } },
    });

  const buildUser = (id = 1): GetUserResult => ({ id, email: 'a@test.com', status: 'ACTIVE' }) as unknown as GetUserResult;

  const buildIssuedToken = (token: string): IssuedTokenResult =>
    IssuedTokenResult.of({ token, expiresAt: new Date(Date.now() + 3_600_000) });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthReader, useValue: { resolveLogtoUserInfo: jest.fn() } },
        { provide: UserReader, useValue: { getByIdOrThrow: jest.fn() } },
        { provide: UserCreator, useValue: { findOrCreateIfNoOauth: jest.fn() } },
        {
          provide: UserOauthReader,
          useValue: { findByLogtoUserId: jest.fn(), findByUserIdAndProvider: jest.fn() },
        },
        { provide: UserOauthCreator, useValue: { createUserOauth: jest.fn() } },
        {
          provide: UserTokenReader,
          useValue: { findByRefreshToken: jest.fn(), getByRefreshTokenOrThrow: jest.fn() },
        },
        { provide: UserTokenCreator, useValue: { createUserToken: jest.fn() } },
        { provide: UserTokenRemover, useValue: { removeByRefreshToken: jest.fn() } },
        { provide: UserDeviceCreator, useValue: { upsertByPushToken: jest.fn() } },
        { provide: UserDeviceRemover, useValue: { removeByPushToken: jest.fn() } },
        {
          provide: JwtIssuer,
          useValue: { issueAccessToken: jest.fn(), issueRefreshToken: jest.fn() },
        },
        {
          provide: JwtVerifier,
          useValue: { verifyAccessToken: jest.fn(), verifyRefreshToken: jest.fn() },
        },
        { provide: MailService, useValue: { sendWelcome: jest.fn() } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'ACCESS_JWT_EXPIRES_IN_SECOND') return 3600;
              if (key === 'REFRESH_JWT_EXPIRES_IN_SECOND') return 604800;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    authReader = moduleRef.get(AuthReader);
    userReader = moduleRef.get(UserReader);
    userCreator = moduleRef.get(UserCreator);
    userOauthReader = moduleRef.get(UserOauthReader);
    userOauthCreator = moduleRef.get(UserOauthCreator);
    userTokenReader = moduleRef.get(UserTokenReader);
    userTokenCreator = moduleRef.get(UserTokenCreator);
    userTokenRemover = moduleRef.get(UserTokenRemover);
    userDeviceCreator = moduleRef.get(UserDeviceCreator);
    userDeviceRemover = moduleRef.get(UserDeviceRemover);
    jwtIssuer = moduleRef.get(JwtIssuer);
    jwtVerifier = moduleRef.get(JwtVerifier);
    mailService = moduleRef.get(MailService);
  });

  describe('handleOauthCallback', () => {
    const buildData = (overrides: Partial<{ device: { deviceType: string; pushToken: string; language: string } | null }> = {}) =>
      ({
        logtoAccessToken: 'logto-token',
        provider: 'KAKAO' as const,
        lang: 'en-US' as const,
        device: overrides.device === undefined ? null : overrides.device,
      }) as unknown as Parameters<typeof service.handleOauthCallback>[0];

    it('신규 가입: oauth/유저 모두 새로 생성 + 토큰 발급 + welcome 메일 발송', async () => {
      authReader.resolveLogtoUserInfo.mockResolvedValue(buildLogtoUser());
      userOauthReader.findByLogtoUserId.mockResolvedValue(null);
      userCreator.findOrCreateIfNoOauth.mockResolvedValue({ userId: 42, isNewUser: true });
      userReader.getByIdOrThrow.mockResolvedValue(buildUser(42));
      userOauthReader.findByUserIdAndProvider.mockResolvedValue(null);
      userOauthCreator.createUserOauth.mockResolvedValue({} as unknown as GetUserOauthResult);
      jwtIssuer.issueAccessToken.mockResolvedValue(buildIssuedToken('access-1'));
      jwtIssuer.issueRefreshToken.mockResolvedValue(buildIssuedToken('refresh-1'));
      userTokenCreator.createUserToken.mockResolvedValue({} as unknown as GetUserTokenResult);
      mailService.sendWelcome.mockResolvedValue(undefined);

      const result = await service.handleOauthCallback(buildData());

      expect(result.accessToken).toBe('access-1');
      expect(result.refreshToken).toBe('refresh-1');
      expect(userCreator.findOrCreateIfNoOauth).toHaveBeenCalledTimes(1);
      expect(userOauthCreator.createUserOauth).toHaveBeenCalledTimes(1);
      expect(userTokenCreator.createUserToken).toHaveBeenCalledTimes(1);
      expect(mailService.sendWelcome).toHaveBeenCalledTimes(1);
    });

    it('welcome 메일 실패해도 가입 흐름은 성공 (await 안 함, 로깅만)', async () => {
      authReader.resolveLogtoUserInfo.mockResolvedValue(buildLogtoUser());
      userOauthReader.findByLogtoUserId.mockResolvedValue(null);
      userCreator.findOrCreateIfNoOauth.mockResolvedValue({ userId: 42, isNewUser: true });
      userReader.getByIdOrThrow.mockResolvedValue(buildUser(42));
      userOauthReader.findByUserIdAndProvider.mockResolvedValue(null);
      userOauthCreator.createUserOauth.mockResolvedValue({} as unknown as GetUserOauthResult);
      jwtIssuer.issueAccessToken.mockResolvedValue(buildIssuedToken('access-1'));
      jwtIssuer.issueRefreshToken.mockResolvedValue(buildIssuedToken('refresh-1'));
      userTokenCreator.createUserToken.mockResolvedValue({} as unknown as GetUserTokenResult);
      mailService.sendWelcome.mockRejectedValue(new Error('SES down'));

      const result = await service.handleOauthCallback(buildData());

      expect(result.accessToken).toBe('access-1');
      // .catch 가 동기적으로 등록되므로 microtask flush
      await Promise.resolve();
    });

    it('이미 logto oauth 가 있는 유저: oauth 재생성/welcome 메일 모두 X', async () => {
      authReader.resolveLogtoUserInfo.mockResolvedValue(buildLogtoUser());
      userOauthReader.findByLogtoUserId.mockResolvedValue({ userId: 7 } as unknown as GetUserOauthResult);
      userCreator.findOrCreateIfNoOauth.mockResolvedValue({ userId: null, isNewUser: false });
      userReader.getByIdOrThrow.mockResolvedValue(buildUser(7));
      userOauthReader.findByUserIdAndProvider.mockResolvedValue({ userId: 7 } as unknown as GetUserOauthResult);
      jwtIssuer.issueAccessToken.mockResolvedValue(buildIssuedToken('access-7'));
      jwtIssuer.issueRefreshToken.mockResolvedValue(buildIssuedToken('refresh-7'));
      userTokenCreator.createUserToken.mockResolvedValue({} as unknown as GetUserTokenResult);

      await service.handleOauthCallback(buildData());

      expect(userReader.getByIdOrThrow).toHaveBeenCalledWith(7);
      expect(userOauthCreator.createUserOauth).not.toHaveBeenCalled();
      expect(mailService.sendWelcome).not.toHaveBeenCalled();
    });

    it('같은 email 의 다른 provider 신규 연결: oauth 만 생성, welcome 메일 X', async () => {
      authReader.resolveLogtoUserInfo.mockResolvedValue(buildLogtoUser());
      userOauthReader.findByLogtoUserId.mockResolvedValue(null);
      userCreator.findOrCreateIfNoOauth.mockResolvedValue({ userId: 11, isNewUser: false });
      userReader.getByIdOrThrow.mockResolvedValue(buildUser(11));
      userOauthReader.findByUserIdAndProvider.mockResolvedValue(null);
      userOauthCreator.createUserOauth.mockResolvedValue({} as unknown as GetUserOauthResult);
      jwtIssuer.issueAccessToken.mockResolvedValue(buildIssuedToken('a'));
      jwtIssuer.issueRefreshToken.mockResolvedValue(buildIssuedToken('r'));
      userTokenCreator.createUserToken.mockResolvedValue({} as unknown as GetUserTokenResult);

      await service.handleOauthCallback(buildData());

      expect(userOauthCreator.createUserOauth).toHaveBeenCalledTimes(1);
      expect(mailService.sendWelcome).not.toHaveBeenCalled();
    });

    it('device 정보가 있으면 user_device upsert 호출', async () => {
      authReader.resolveLogtoUserInfo.mockResolvedValue(buildLogtoUser());
      userOauthReader.findByLogtoUserId.mockResolvedValue({ userId: 7 } as unknown as GetUserOauthResult);
      userCreator.findOrCreateIfNoOauth.mockResolvedValue({ userId: null, isNewUser: false });
      userReader.getByIdOrThrow.mockResolvedValue(buildUser(7));
      userOauthReader.findByUserIdAndProvider.mockResolvedValue({ userId: 7 } as unknown as GetUserOauthResult);
      jwtIssuer.issueAccessToken.mockResolvedValue(buildIssuedToken('a'));
      jwtIssuer.issueRefreshToken.mockResolvedValue(buildIssuedToken('r'));
      userTokenCreator.createUserToken.mockResolvedValue({} as unknown as GetUserTokenResult);

      await service.handleOauthCallback(buildData({ device: { deviceType: 'IOS_APP', pushToken: 'tok-1', language: 'ko' } }));

      expect(userDeviceCreator.upsertByPushToken).toHaveBeenCalledTimes(1);
      const call = userDeviceCreator.upsertByPushToken.mock.calls[0]![0];
      expect(call.userId).toBe(7);
      expect(call.deviceType).toBe('IOS_APP');
      expect(call.pushToken).toBe('tok-1');
      expect(call.language).toBe('ko');
    });

    it('device 정보가 없으면 user_device upsert 호출되지 않음 (push 권한 거부 사용자)', async () => {
      authReader.resolveLogtoUserInfo.mockResolvedValue(buildLogtoUser());
      userOauthReader.findByLogtoUserId.mockResolvedValue({ userId: 7 } as unknown as GetUserOauthResult);
      userCreator.findOrCreateIfNoOauth.mockResolvedValue({ userId: null, isNewUser: false });
      userReader.getByIdOrThrow.mockResolvedValue(buildUser(7));
      userOauthReader.findByUserIdAndProvider.mockResolvedValue({ userId: 7 } as unknown as GetUserOauthResult);
      jwtIssuer.issueAccessToken.mockResolvedValue(buildIssuedToken('a'));
      jwtIssuer.issueRefreshToken.mockResolvedValue(buildIssuedToken('r'));
      userTokenCreator.createUserToken.mockResolvedValue({} as unknown as GetUserTokenResult);

      await service.handleOauthCallback(buildData());

      expect(userDeviceCreator.upsertByPushToken).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('정상: 검증 → 기존 토큰 제거 → 새 토큰 쌍 발급', async () => {
      jwtVerifier.verifyRefreshToken.mockReturnValue(okAsync(VerifiedJwtResult.of({ userId: 5 })));
      userTokenReader.getByRefreshTokenOrThrow.mockResolvedValue({} as GetUserTokenResult);
      userTokenRemover.removeByRefreshToken.mockResolvedValue(undefined);
      userReader.getByIdOrThrow.mockResolvedValue(buildUser(5));
      jwtIssuer.issueAccessToken.mockResolvedValue(buildIssuedToken('new-access'));
      jwtIssuer.issueRefreshToken.mockResolvedValue(buildIssuedToken('new-refresh'));
      userTokenCreator.createUserToken.mockResolvedValue({} as unknown as GetUserTokenResult);

      const result = await service.refreshAccessToken('old-refresh');

      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
      expect(userTokenRemover.removeByRefreshToken).toHaveBeenCalledWith('old-refresh');
      expect(userTokenCreator.createUserToken).toHaveBeenCalledTimes(1);
    });

    it('만료된 refresh → EXPIRED_JWT_REFRESH_TOKEN', async () => {
      jwtVerifier.verifyRefreshToken.mockReturnValue(errAsync('expired'));

      await expect(service.refreshAccessToken('expired')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'EXPIRED_JWT_REFRESH_TOKEN' } },
      });
      expect(userTokenReader.getByRefreshTokenOrThrow).not.toHaveBeenCalled();
    });

    it('손상된 refresh → INVALID_JWT_REFRESH_TOKEN', async () => {
      jwtVerifier.verifyRefreshToken.mockReturnValue(errAsync('invalid'));

      await expect(service.refreshAccessToken('garbage')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'INVALID_JWT_REFRESH_TOKEN' } },
      });
    });

    it('DB 에 없는 refresh → reader 가 던지는 USER_TOKEN_NOT_FOUND 가 그대로 propagate', async () => {
      jwtVerifier.verifyRefreshToken.mockReturnValue(okAsync(VerifiedJwtResult.of({ userId: 5 })));
      userTokenReader.getByRefreshTokenOrThrow.mockRejectedValue(
        new UnauthorizedException({ errorType: { code: 'USER_TOKEN_NOT_FOUND' } }),
      );

      await expect(service.refreshAccessToken('orphan-refresh')).rejects.toMatchObject({
        response: { errorType: { code: 'USER_TOKEN_NOT_FOUND' } },
      });
      expect(userTokenRemover.removeByRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('정상: refresh 토큰 제거 (pushToken 미전송 시 device 는 그대로)', async () => {
      userTokenReader.findByRefreshToken.mockResolvedValue({ userId: 5 } as unknown as GetUserTokenResult);
      userTokenRemover.removeByRefreshToken.mockResolvedValue(undefined);

      await service.logout(5, 'refresh-token', null);

      expect(userTokenRemover.removeByRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(userDeviceRemover.removeByPushToken).not.toHaveBeenCalled();
    });

    it('pushToken 함께 보내면 device 도 삭제', async () => {
      userTokenReader.findByRefreshToken.mockResolvedValue({ userId: 5 } as unknown as GetUserTokenResult);
      userTokenRemover.removeByRefreshToken.mockResolvedValue(undefined);

      await service.logout(5, 'refresh-token', 'tok-1');

      expect(userTokenRemover.removeByRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(userDeviceRemover.removeByPushToken).toHaveBeenCalledWith('tok-1');
    });

    it('refresh 토큰 자체가 없으면 noop (token / device 모두 변경 X)', async () => {
      userTokenReader.findByRefreshToken.mockResolvedValue(null);

      await service.logout(5, 'unknown', 'tok-1');

      expect(userTokenRemover.removeByRefreshToken).not.toHaveBeenCalled();
      expect(userDeviceRemover.removeByPushToken).not.toHaveBeenCalled();
    });

    it('userId 가 다르면 noop (탈취 방지)', async () => {
      userTokenReader.findByRefreshToken.mockResolvedValue({ userId: 999 } as unknown as GetUserTokenResult);

      await service.logout(5, 'someone-elses-token', 'tok-1');

      expect(userTokenRemover.removeByRefreshToken).not.toHaveBeenCalled();
      expect(userDeviceRemover.removeByPushToken).not.toHaveBeenCalled();
    });
  });

  describe('getVerifiedUserByAccessJwt', () => {
    it('정상: JWT 검증 → user 반환', async () => {
      jwtVerifier.verifyAccessToken.mockReturnValue(okAsync(VerifiedJwtResult.of({ userId: 5 })));
      const user = buildUser(5);
      userReader.getByIdOrThrow.mockResolvedValue(user);

      const result = await service.getVerifiedUserByAccessJwt('access');

      expect(result).toBe(user);
    });

    it('만료 → EXPIRED_JWT_ACCESS_TOKEN', async () => {
      jwtVerifier.verifyAccessToken.mockReturnValue(errAsync('expired'));

      await expect(service.getVerifiedUserByAccessJwt('expired')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'EXPIRED_JWT_ACCESS_TOKEN' } },
      });
    });

    it('손상 → INVALID_JWT_ACCESS_TOKEN', async () => {
      jwtVerifier.verifyAccessToken.mockReturnValue(errAsync('invalid'));

      await expect(service.getVerifiedUserByAccessJwt('bad')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'INVALID_JWT_ACCESS_TOKEN' } },
      });
    });
  });
});
