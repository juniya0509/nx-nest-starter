import { GetUserResult } from '@libs/core-domain/src/domain/user/result/GetUserResult';

import { AdminAccountResult } from '../../admin-account/result/AdminAccountResult';

type AdminContextResultProps = {
  readonly user: GetUserResult;
  readonly adminAccount: AdminAccountResult;
  readonly permissionCodes: ReadonlySet<string>;
};

export class AdminContextResult {
  private constructor(private readonly result: AdminContextResultProps) {}

  get user(): GetUserResult {
    return this.result.user;
  }

  get adminAccount(): AdminAccountResult {
    return this.result.adminAccount;
  }

  get permissionCodes(): ReadonlySet<string> {
    return this.result.permissionCodes;
  }

  hasPermission(code: string): boolean {
    return this.result.permissionCodes.has(code);
  }

  hasAllPermissions(codes: readonly string[]): boolean {
    return codes.every((code) => this.result.permissionCodes.has(code));
  }

  hasAnyPermission(codes: readonly string[]): boolean {
    return codes.some((code) => this.result.permissionCodes.has(code));
  }

  static of(result: AdminContextResultProps): AdminContextResult {
    return new AdminContextResult(result);
  }
}
