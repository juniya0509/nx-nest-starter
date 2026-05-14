type AdminCreateAccountDataProps = {
  readonly userId: number;
  readonly memo: string | null;
};

export class AdminCreateAccountData {
  private constructor(private readonly data: AdminCreateAccountDataProps) {}

  get userId(): number {
    return this.data.userId;
  }

  get memo(): string | null {
    return this.data.memo;
  }

  static fromReqDto(data: AdminCreateAccountDataProps): AdminCreateAccountData {
    return new AdminCreateAccountData(data);
  }
}
