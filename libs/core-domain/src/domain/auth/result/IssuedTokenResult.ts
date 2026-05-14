type IssuedTokenResultProps = {
  readonly token: string;
  readonly expiresAt: Date;
};

export class IssuedTokenResult {
  private constructor(private readonly result: IssuedTokenResultProps) {}

  get token(): string {
    return this.result.token;
  }

  get expiresAt(): Date {
    return this.result.expiresAt;
  }

  static of(result: IssuedTokenResultProps): IssuedTokenResult {
    return new IssuedTokenResult(result);
  }
}
