import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthReader } from './Auth.reader';

describe('AuthReader', () => {
  let reader: AuthReader;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AuthReader, { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('https://logto.local') } }],
    }).compile();

    reader = moduleRef.get(AuthReader);
    configService = moduleRef.get(ConfigService);
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('resolveLogtoUserInfo', () => {
    it('정상 응답 → LogtoUserInfoResult 반환', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          sub: 'logto-user-1',
          email: 'a@test.com',
          given_name: 'Alice',
          family_name: 'Lee',
          picture: 'https://avatar/a.png',
          identities: { kakao: { userId: 'k_123' } },
        }),
      } as Response);

      const result = await reader.resolveLogtoUserInfo('access-token');

      expect(result.logtoUserId).toBe('logto-user-1');
      expect(result.email).toBe('a@test.com');
      expect(result.firstname).toBe('Alice');
      expect(result.lastname).toBe('Lee');
      expect(result.avatarUrl).toBe('https://avatar/a.png');
      expect(result.resolveProviderUserId('KAKAO')).toBe('k_123');
      expect(fetchSpy).toHaveBeenCalledWith('https://logto.local/oidc/me', {
        headers: { Authorization: 'Bearer access-token' },
      });
      expect(configService.get).toHaveBeenCalledWith('LOGTO_ENDPOINT');
    });

    it('Logto 응답 ok=false → OAUTH_AUTHENTICATION_FAILED UnauthorizedException', async () => {
      fetchSpy.mockResolvedValue({ ok: false, json: async () => ({}) } as Response);

      await expect(reader.resolveLogtoUserInfo('bad-token')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'OAUTH_AUTHENTICATION_FAILED' } },
      });
    });

    it('email 누락된 응답 → OAUTH_USER_INFO_FETCH_FAILED UnauthorizedException', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ sub: 'no-email-user' }) } as Response);

      await expect(reader.resolveLogtoUserInfo('token')).rejects.toMatchObject({
        constructor: UnauthorizedException,
        response: { errorType: { code: 'OAUTH_USER_INFO_FETCH_FAILED' } },
      });
    });
  });
});
