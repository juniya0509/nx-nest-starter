type GetUserTokenResultProps = {
  readonly id: number;
  readonly userId: number;
  readonly refreshToken: string;
  readonly expiresAt: Date;
};

export class GetUserTokenResult {
  private constructor(private readonly result: GetUserTokenResultProps) {}

  get id(): number {
    return this.result.id;
  }

  get userId(): number {
    return this.result.userId;
  }

  get refreshToken(): string {
    return this.result.refreshToken;
  }

  get expiresAt(): Date {
    return this.result.expiresAt;
  }

  static of(result: GetUserTokenResultProps): GetUserTokenResult {
    return new GetUserTokenResult(result);
  }
}
