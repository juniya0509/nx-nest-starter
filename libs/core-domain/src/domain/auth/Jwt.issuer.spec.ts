import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtIssuer } from './Jwt.issuer';

describe('JwtIssuer', () => {
  let issuer: JwtIssuer;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        JwtIssuer,
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    issuer = moduleRef.get(JwtIssuer);
    jwtService = moduleRef.get(JwtService);
    configService = moduleRef.get(ConfigService);
  });

  describe('issueAccessToken', () => {
    it('ACCESS_JWT 시크릿 + 만료시간으로 type=access 토큰 발급', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'ACCESS_JWT_SECRET_KEY') return 'access-secret';
        if (key === 'ACCESS_JWT_EXPIRES_IN_SECOND') return 3600;
        return undefined;
      });
      jwtService.signAsync.mockResolvedValue('signed-access-token');

      const result = await issuer.issueAccessToken(42);

      expect(result.token).toBe('signed-access-token');
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 42, type: 'access' }, { secret: 'access-secret', expiresIn: 3600 });
    });
  });

  describe('issueRefreshToken', () => {
    it('REFRESH_JWT 시크릿 + 만료시간으로 type=refresh 토큰 발급', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'REFRESH_JWT_SECRET_KEY') return 'refresh-secret';
        if (key === 'REFRESH_JWT_EXPIRES_IN_SECOND') return 604800;
        return undefined;
      });
      jwtService.signAsync.mockResolvedValue('signed-refresh-token');

      const result = await issuer.issueRefreshToken(42);

      expect(result.token).toBe('signed-refresh-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 42, type: 'refresh' }, { secret: 'refresh-secret', expiresIn: 604800 });
    });
  });
});
