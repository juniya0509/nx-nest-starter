import { AdminAccountStatusUnion } from '../../../enum/AdminAccountStatus.enum';

type AppliedPresetEntry = {
  readonly id: number;
  readonly code: string;
  readonly name: string;
};

type AdminGetAccountResultProps = {
  readonly id: number;
  readonly userId: number;
  readonly userEmail: string;
  readonly userFirstname: string | null;
  readonly userLastname: string | null;
  readonly userAvatarUrl: string | null;
  readonly status: AdminAccountStatusUnion;
  readonly memo: string | null;
  readonly createdAt: Date;
  readonly directPermissionCodes: string[];
  readonly appliedPresets: AppliedPresetEntry[];
  readonly effectivePermissionCodes: string[];
};

export class AdminGetAccountResult {
  private constructor(private readonly result: AdminGetAccountResultProps) {}

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

  get directPermissionCodes(): string[] {
    return this.result.directPermissionCodes;
  }

  get appliedPresets(): AppliedPresetEntry[] {
    return this.result.appliedPresets;
  }

  get effectivePermissionCodes(): string[] {
    return this.result.effectivePermissionCodes;
  }

  static of(result: AdminGetAccountResultProps): AdminGetAccountResult {
    return new AdminGetAccountResult(result);
  }
}
