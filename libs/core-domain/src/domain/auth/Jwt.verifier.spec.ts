import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtVerifier } from './Jwt.verifier';

describe('JwtVerifier', () => {
  let verifier: JwtVerifier;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        JwtVerifier,
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    verifier = moduleRef.get(JwtVerifier);
    jwtService = moduleRef.get(JwtService);
    configService = moduleRef.get(ConfigService);
  });

  describe('verifyAccessToken', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('access-secret');
    });

    it('정상 access 토큰 → ok({ userId })', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 42, type: 'access' });

      const result = await verifier.verifyAccessToken('valid-token');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(42);
      }
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', { secret: 'access-secret' });
    });

    it('만료 (TokenExpiredError) → err("expired")', async () => {
      jwtService.verifyAsync.mockRejectedValue({ name: 'TokenExpiredError' });

      const result = await verifier.verifyAccessToken('expired-token');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('expired');
      }
    });

    it('손상된 토큰 (other error) → err("invalid")', async () => {
      jwtService.verifyAsync.mockRejectedValue({ name: 'JsonWebTokenError' });

      const result = await verifier.verifyAccessToken('bad-token');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('invalid');
      }
    });

    it('refresh 타입 토큰을 access 로 검증하면 invalid', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 42, type: 'refresh' });

      const result = await verifier.verifyAccessToken('refresh-token-passed-as-access');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('invalid');
      }
    });
  });

  describe('verifyRefreshToken', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('refresh-secret');
    });

    it('정상 refresh 토큰 → ok({ userId })', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 7, type: 'refresh' });

      const result = await verifier.verifyRefreshToken('valid-refresh');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(7);
      }
    });

    it('access 타입 토큰을 refresh 로 검증하면 invalid', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 7, type: 'access' });

      const result = await verifier.verifyRefreshToken('access-token-passed-as-refresh');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('invalid');
      }
    });

    it('만료 → err("expired")', async () => {
      jwtService.verifyAsync.mockRejectedValue({ name: 'TokenExpiredError' });

      const result = await verifier.verifyRefreshToken('expired-refresh');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('expired');
      }
    });
  });
});
