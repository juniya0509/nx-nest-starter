import { AdminAccountStatusUnion } from '../../../enum/AdminAccountStatus.enum';

type AdminAccountResultProps = {
  readonly id: number;
  readonly userId: number;
  readonly status: AdminAccountStatusUnion;
  readonly memo: string | null;
  readonly createdAt: Date;
};

export class AdminAccountResult {
  private constructor(private readonly result: AdminAccountResultProps) {}

  get id(): number {
    return this.result.id;
  }

  get userId(): number {
    return this.result.userId;
  }

  get status(): AdminAccountStatusUnion {
    return this.result.status;
  }

  get memo(): string | null {
    return this.result.memo;
  }

  get createdAt(): Date {
    return this.result.createdAt;
  }

  get isActive(): boolean {
    return this.result.status === 'ACTIVE';
  }

  static of(result: AdminAccountResultProps): AdminAccountResult {
    return new AdminAccountResult(result);
  }
}
