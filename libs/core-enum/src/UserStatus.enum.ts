import { Enum, EnumConstNames, EnumType } from 'ts-jenum';

@Enum('code')
export class UserStatus extends EnumType<UserStatus>() {
  static readonly ACTIVE = new UserStatus('ACTIVE', '활성화');
  static readonly SUSPENDED = new UserStatus('SUSPENDED', '정지');
  static readonly WITHDRAWN = new UserStatus('WITHDRAWN', '탈퇴');
  static readonly DELETED = new UserStatus('DELETED', '삭제');

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

export type UserStatusUnion = EnumConstNames<typeof UserStatus>;

export const userStatusList = UserStatus.keys();
