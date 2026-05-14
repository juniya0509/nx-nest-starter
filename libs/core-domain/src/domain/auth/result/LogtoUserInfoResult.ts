import { UnauthorizedException } from '@nestjs/common';

import { AuthProviderUnion } from '@libs/core-enum/src/AuthProvider.enum';

import { CoreDomainError } from '../../../support/error/CoreDomainError';

type LogtoUserInfoResultProps = {
  readonly logtoUserId: string;
  readonly email: string;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly avatarUrl: string | null;
  readonly identities: Record<string, { readonly userId: string }>;
};

type LogtoUserInfoApiResponse = {
  readonly sub: string;
  readonly email?: string;
  readonly given_name?: string | null;
  readonly family_name?: string | null;
  readonly name?: string | null;
  readonly picture?: string | null;
  readonly identities?: Record<string, { readonly userId: string }>;
};

export class LogtoUserInfoResult {
  private constructor(private readonly result: LogtoUserInfoResultProps) {}

  get logtoUserId(): string {
    return this.result.logtoUserId;
  }

  get email(): string {
    return this.result.email;
  }

  get firstname(): string | null {
    return this.result.firstname;
  }

  get lastname(): string | null {
    return this.result.lastname;
  }

  get avatarUrl(): string | null {
    return this.result.avatarUrl;
  }

  resolveProviderUserId(provider: AuthProviderUnion): string | null {
    if (provider === 'EMAIL') return null;
    return this.result.identities[provider.toLowerCase()]?.userId ?? null;
  }

  static fromLogtoApiResponse(raw: unknown): LogtoUserInfoResult {
    const response = raw as LogtoUserInfoApiResponse;

    if (!response.email) {
      throw new UnauthorizedException({ errorType: CoreDomainError.OAUTH_USER_INFO_FETCH_FAILED });
    }

    return new LogtoUserInfoResult({
      logtoUserId: response.sub,
      email: response.email,
      firstname: response.given_name ?? null,
      lastname: response.family_name ?? null,
      avatarUrl: response.picture ?? null,
      identities: response.identities ?? {},
    });
  }

  static of(result: LogtoUserInfoResultProps): LogtoUserInfoResult {
    return new LogtoUserInfoResult(result);
  }
}
