import { Enum, EnumConstNames, EnumType } from 'ts-jenum';

@Enum('code')
export class AdminAccountStatus extends EnumType<AdminAccountStatus>() {
  static readonly ACTIVE = new AdminAccountStatus('ACTIVE', '활성화');
  static readonly SUSPENDED = new AdminAccountStatus('SUSPENDED', '정지');

  private constructor(
    readonly _code: string,
    readonly _description: string,
  ) {
    super();
  }

  get code(): string {
    return this._code;
  }

  get description(): string {
    return this._description;
  }
}

export type AdminAccountStatusUnion = EnumConstNames<typeof AdminAccountStatus>;

export const adminAccountStatusList = AdminAccountStatus.keys();
