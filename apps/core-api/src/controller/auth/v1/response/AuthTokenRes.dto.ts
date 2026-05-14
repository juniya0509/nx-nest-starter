import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { AuthTokenResult } from '@libs/core-domain/src/domain/auth/result/AuthTokenResult';

export class AuthTokenRes {
  @Exclude() private readonly _accessToken: string;
  @Exclude() private readonly _accessTokenExpiresIn: number;
  @Exclude() private readonly _refreshToken: string;
  @Exclude() private readonly _refreshTokenExpiresIn: number;
  @Exclude() private readonly _userId: number;
  @Exclude() private readonly _userEmail: string;
  @Exclude() private readonly _userFullname: string;
  @Exclude() private readonly _userAvatarUrl: string | null;

  constructor(authToken: AuthTokenResult) {
    this._accessToken = authToken.accessToken;
    this._accessTokenExpiresIn = authToken.accessTokenExpiresIn;
    this._refreshToken = authToken.refreshToken;
    this._refreshTokenExpiresIn = authToken.refreshTokenExpiresIn;
    this._userId = authToken.user.id;
    this._userEmail = authToken.user.email;
    this._userFullname = authToken.user.fullname;
    this._userAvatarUrl = authToken.user.avatarUrl;
  }

  @ApiProperty({
    type: 'string',
    enum: ['Bearer'],
    description: 'OAuth 2.0 token type — 항상 "Bearer". Authorization 헤더는 `Bearer <accessToken>` 형식으로 전송.',
  })
  @Expose()
  get tokenType(): 'Bearer' {
    return 'Bearer';
  }

  @ApiProperty({ type: 'string', description: 'JWT access token' })
  @Expose()
  get accessToken(): string {
    return this._accessToken;
  }

  @ApiProperty({ type: 'integer', description: 'access token 만료까지 남은 초' })
  @Expose()
  get accessTokenExpiresIn(): number {
    return this._accessTokenExpiresIn;
  }

  @ApiProperty({ type: 'string', description: 'JWT refresh token' })
  @Expose()
  get refreshToken(): string {
    return this._refreshToken;
  }

  @ApiProperty({ type: 'integer', description: 'refresh token 만료까지 남은 초' })
  @Expose()
  get refreshTokenExpiresIn(): number {
    return this._refreshTokenExpiresIn;
  }

  @ApiProperty({ type: 'integer', description: '로그인된 유저 ID' })
  @Expose()
  get userId(): number {
    return this._userId;
  }

  @ApiProperty({ type: 'string', description: '유저 이메일' })
  @Expose()
  get userEmail(): string {
    return this._userEmail;
  }

  @ApiProperty({ type: 'string', description: '유저 이름' })
  @Expose()
  get userFullname(): string {
    return this._userFullname;
  }

  @ApiProperty({ type: 'string', nullable: true, description: '유저 아바타 URL' })
  @Expose()
  get userAvatarUrl(): string | null {
    return this._userAvatarUrl;
  }

  static of(authToken: AuthTokenResult): AuthTokenRes {
    return new AuthTokenRes(authToken);
  }
}
