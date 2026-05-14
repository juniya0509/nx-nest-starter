import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import dayjs from 'dayjs';

import { IssuedTokenResult } from './result/IssuedTokenResult';

@Injectable()
export class JwtIssuer {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async issueAccessToken(userId: number): Promise<IssuedTokenResult> {
    const secret = this.configService.get<string>('ACCESS_JWT_SECRET_KEY')!;
    const expiresInSeconds = this.configService.get<number>('ACCESS_JWT_EXPIRES_IN_SECOND')!;
    const expiresAt = dayjs().add(expiresInSeconds, 'second').toDate();
    const token = await this.jwtService.signAsync({ sub: userId, type: 'access' }, { secret, expiresIn: expiresInSeconds });

    return IssuedTokenResult.of({ token, expiresAt });
  }

  async issueRefreshToken(userId: number): Promise<IssuedTokenResult> {
    const secret = this.configService.get<string>('REFRESH_JWT_SECRET_KEY')!;
    const expiresInSeconds = this.configService.get<number>('REFRESH_JWT_EXPIRES_IN_SECOND')!;
    const expiresAt = dayjs().add(expiresInSeconds, 'second').toDate();
    const token = await this.jwtService.signAsync({ sub: userId, type: 'refresh' }, { secret, expiresIn: expiresInSeconds });

    return IssuedTokenResult.of({ token, expiresAt });
  }
}
