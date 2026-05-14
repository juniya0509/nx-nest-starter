type CreateUserTokenDataProps = {
  readonly userId: number;
  readonly refreshToken: string;
  readonly expiresAt: Date;
};

export class CreateUserTokenData {
  private constructor(private readonly data: CreateUserTokenDataProps) {}

  get userId(): number {
    return this.data.userId;
  }

  get refreshToken(): string {
    return this.data.refreshToken;
  }

  get expiresAt(): Date {
    return this.data.expiresAt;
  }

  static fromIssuedToken(data: CreateUserTokenDataProps): CreateUserTokenData {
    return new CreateUserTokenData({ ...data });
  }
}
