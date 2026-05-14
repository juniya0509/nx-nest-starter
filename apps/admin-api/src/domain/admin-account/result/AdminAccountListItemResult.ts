import { AdminAccountStatusUnion } from '../../../enum/AdminAccountStatus.enum';

type AdminAccountListItemResultProps = {
  readonly id: number;
  readonly userId: number;
  readonly userEmail: string;
  readonly userFirstname: string | null;
  readonly userLastname: string | null;
  readonly userAvatarUrl: string | null;
  readonly status: AdminAccountStatusUnion;
  readonly memo: string | null;
  readonly createdAt: Date;
};

export class AdminAccountListItemResult {
  private constructor(private readonly result: AdminAccountListItemResultProps) {}

  get id(): number {
    return this.result.id;
  }

  get userId(): number {
    return this.result.userId;
  }

  get userEmail(): string {
    return this.result.userEmail;
  }

  get userFullname(): string {
    return [this.result.userFirstname, this.result.userLastname]
      .filter((part): part is string => part !== null && part.length > 0)
      .join(' ');
  }

  get userAvatarUrl(): string | null {
    return this.result.userAvatarUrl;
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

  static of(result: AdminAccountListItemResultProps): AdminAccountListItemResult {
    return new AdminAccountListItemResult(result);
  }
}
