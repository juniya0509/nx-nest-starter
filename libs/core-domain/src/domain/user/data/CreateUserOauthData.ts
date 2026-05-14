import { AuthProviderUnion } from '@libs/core-enum/src/AuthProvider.enum';

type CreateUserOauthDataProps = {
  readonly userId: number;
  readonly logtoUserId: string;
  readonly provider: AuthProviderUnion;
  readonly providerUserId: string | null;
};

export class CreateUserOauthData {
  private constructor(private readonly data: CreateUserOauthDataProps) {}

  get userId(): number {
    return this.data.userId;
  }

  get logtoUserId(): string {
    return this.data.logtoUserId;
  }

  get provider(): AuthProviderUnion {
    return this.data.provider;
  }

  get providerUserId(): string | null {
    return this.data.providerUserId;
  }

  static fromOauthUserInfo(data: CreateUserOauthDataProps): CreateUserOauthData {
    return new CreateUserOauthData({ ...data });
  }
}
