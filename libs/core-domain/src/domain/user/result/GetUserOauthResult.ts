import { AuthProviderUnion } from '@libs/core-enum/src/AuthProvider.enum';

type GetUserOauthResultProps = {
  readonly id: number;
  readonly userId: number;
  readonly logtoUserId: string;
  readonly provider: AuthProviderUnion;
  readonly providerUserId: string | null;
};

export class GetUserOauthResult {
  private constructor(private readonly result: GetUserOauthResultProps) {}

  get id(): number {
    return this.result.id;
  }

  get userId(): number {
    return this.result.userId;
  }

  get logtoUserId(): string {
    return this.result.logtoUserId;
  }

  get provider(): AuthProviderUnion {
    return this.result.provider;
  }

  get providerUserId(): string | null {
    return this.result.providerUserId;
  }

  static of(result: GetUserOauthResultProps): GetUserOauthResult {
    return new GetUserOauthResult(result);
  }
}
