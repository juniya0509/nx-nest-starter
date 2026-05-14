import { Enum, EnumType } from 'ts-jenum';

@Enum('code')
export class AdminPermission extends EnumType<AdminPermission>() {
  static readonly ADMIN_ACCOUNT_MANAGE = new AdminPermission('ADMIN_ACCOUNT_MANAGE', 'admin-management', '관리자 계정 등록/조회/삭제');
  static readonly PERMISSION_PRESET_MANAGE = new AdminPermission(
    'PERMISSION_PRESET_MANAGE',
    'admin-management',
    '권한 프리셋 생성/수정/삭제/조회',
  );
  static readonly ADMIN_PERMISSION_ASSIGN = new AdminPermission(
    'ADMIN_PERMISSION_ASSIGN',
    'admin-management',
    '관리자에게 권한/프리셋 부여',
  );
  static readonly ADMIN_PERMISSION_LIST = new AdminPermission('ADMIN_PERMISSION_LIST', 'admin-management', '권한 카탈로그 조회');

  static readonly USER_LIST = new AdminPermission('USER_LIST', 'user', '유저 목록 조회');
  static readonly USER_READ = new AdminPermission('USER_READ', 'user', '유저 단건 조회');
  static readonly USER_SUSPEND = new AdminPermission('USER_SUSPEND', 'user', '유저 정지');

  static readonly MAIL_SEND = new AdminPermission('MAIL_SEND', 'mail', '고객에게 이메일 발송');

  static readonly PUSH_SEND = new AdminPermission('PUSH_SEND', 'push', '고객에게 push 알림 발송');

  private constructor(
    readonly _code: string,
    readonly _group: string,
    readonly _description: string,
  ) {
    super();
  }

  get code(): string {
    return this._code;
  }

  get group(): string {
    return this._group;
  }

  get description(): string {
    return this._description;
  }
}

export const adminPermissionList = AdminPermission.values();

export const adminPermissionCodeList = AdminPermission.values().map((permission) => permission.code);
