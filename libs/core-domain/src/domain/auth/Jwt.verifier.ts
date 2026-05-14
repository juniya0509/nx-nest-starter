import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { err, ok, ResultAsync } from 'neverthrow';

import { VerifiedJwtResult } from './result/VerifiedJwtResult';

export type JwtVerifyError = 'expired' | 'invalid';

type JwtPayload = {
  sub: number;
  type: 'access' | 'refresh';
};

@Injectable()
export class JwtVerifier {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  verifyAccessToken(token: string): ResultAsync<VerifiedJwtResult, JwtVerifyError> {
    const secret = this.configService.get<string>('ACCESS_JWT_SECRET_KEY')!;

    return ResultAsync.fromPromise<JwtPayload, JwtVerifyError>(this.jwtService.verifyAsync<JwtPayload>(token, { secret }), (error) => {
      const errorName = typeof error === 'object' && error !== null && 'name' in error ? (error as { name?: string }).name : null;
      return errorName === 'TokenExpiredError' ? 'expired' : 'invalid';
    }).andThen((payload) => {
      if (payload.type !== 'access') {
        return err<VerifiedJwtResult, JwtVerifyError>('invalid');
      }
      return ok<VerifiedJwtResult, JwtVerifyError>(VerifiedJwtResult.of({ userId: payload.sub }));
    });
  }

  verifyRefreshToken(token: string): ResultAsync<VerifiedJwtResult, JwtVerifyError> {
    const secret = this.configService.get<string>('REFRESH_JWT_SECRET_KEY')!;

    return ResultAsync.fromPromise<JwtPayload, JwtVerifyError>(this.jwtService.verifyAsync<JwtPayload>(token, { secret }), (error) => {
      const errorName = typeof error === 'object' && error !== null && 'name' in error ? (error as { name?: string }).name : null;
      return errorName === 'TokenExpiredError' ? 'expired' : 'invalid';
    }).andThen((payload) => {
      if (payload.type !== 'refresh') {
        return err<VerifiedJwtResult, JwtVerifyError>('invalid');
      }
      return ok<VerifiedJwtResult, JwtVerifyError>(VerifiedJwtResult.of({ userId: payload.sub }));
    });
  }
}
