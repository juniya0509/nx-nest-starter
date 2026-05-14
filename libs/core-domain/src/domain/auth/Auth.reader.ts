import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CoreDomainError } from '../../support/error/CoreDomainError';

import { LogtoUserInfoResult } from './result/LogtoUserInfoResult';

@Injectable()
export class AuthReader {
  constructor(private readonly configService: ConfigService) {}

  async resolveLogtoUserInfo(logtoAccessToken: string): Promise<LogtoUserInfoResult> {
    const endpoint = this.configService.get<string>('LOGTO_ENDPOINT')!;

    const response = await fetch(`${endpoint}/oidc/me`, {
      headers: { Authorization: `Bearer ${logtoAccessToken}` },
    });

    if (!response.ok) {
      throw new UnauthorizedException({ errorType: CoreDomainError.OAUTH_AUTHENTICATION_FAILED });
    }

    return LogtoUserInfoResult.fromLogtoApiResponse(await response.json());
  }
}
