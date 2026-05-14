import { GetUserResult } from '../../user/result/GetUserResult';

type AuthTokenResultProps = {
  readonly accessToken: string;
  readonly accessTokenExpiresIn: number;
  readonly refreshToken: string;
  readonly refreshTokenExpiresIn: number;
  readonly user: GetUserResult;
};

export class AuthTokenResult {
  private constructor(private readonly result: AuthTokenResultProps) {}

  get accessToken(): string {
    return this.result.accessToken;
  }

  get accessTokenExpiresIn(): number {
    return this.result.accessTokenExpiresIn;
  }

  get refreshToken(): string {
    return this.result.refreshToken;
  }

  get refreshTokenExpiresIn(): number {
    return this.result.refreshTokenExpiresIn;
  }

  get user(): GetUserResult {
    return this.result.user;
  }

  static of(result: AuthTokenResultProps): AuthTokenResult {
    return new AuthTokenResult(result);
  }
}
