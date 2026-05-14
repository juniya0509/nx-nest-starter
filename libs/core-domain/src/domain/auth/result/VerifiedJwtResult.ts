type VerifiedJwtResultProps = {
  readonly userId: number;
};

export class VerifiedJwtResult {
  private constructor(private readonly result: VerifiedJwtResultProps) {}

  get userId(): number {
    return this.result.userId;
  }

  static of(result: VerifiedJwtResultProps): VerifiedJwtResult {
    return new VerifiedJwtResult(result);
  }
}
