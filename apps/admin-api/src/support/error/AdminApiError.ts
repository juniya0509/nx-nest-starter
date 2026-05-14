import { Enum, EnumType } from 'ts-jenum';

@Enum('code')
export class AdminApiError extends EnumType<AdminApiError>() {
  static readonly DEFAULT_ERROR = new AdminApiError('DEFAULT_ERROR', '서버에러가 발생');
  static readonly DEFAULT_BAD_REQUEST_ERROR = new AdminApiError('DEFAULT_BAD_REQUEST_ERROR', '잘못된 요청');
  static readonly DEFAULT_NOT_FOUND = new AdminApiError('DEFAULT_NOT_FOUND', '존재하지 않는 경로');
  static readonly PAYLOAD_TOO_LARGE = new AdminApiError('PAYLOAD_TOO_LARGE', '요청하신 파일의 사이즈가 너무 큼');

  static readonly UNSUPPORTED_FILE_FORMAT = new AdminApiError('UNSUPPORTED_FILE_FORMAT', '지원하지 않는 파일 확장자');

  static readonly NOT_LOGGED_IN = new AdminApiError('NOT_LOGGED_IN', '로그인이 되어있지 않음');
  static readonly NON_EXISTENT_USER = new AdminApiError('NON_EXISTENT_USER', '존재하지 않는 유저');
  static readonly NOT_ACTIVED_USER = new AdminApiError('NOT_ACTIVED_USER', '활성화 되지 않은 유저');
  static readonly SUSPENDED_USER = new AdminApiError('SUSPENDED_USER', '활동이 정지된 유저');
  static readonly DO_NOT_HAVE_PERMISSION = new AdminApiError('DO_NOT_HAVE_PERMISSION', '접근 권한이 없음');

  static readonly INVALID_JWT_ACCESS_TOKEN = new AdminApiError('INVALID_JWT_ACCESS_TOKEN', '유효하지 않는 토큰');
  static readonly EXPIRED_JWT_ACCESS_TOKEN = new AdminApiError('EXPIRED_JWT_ACCESS_TOKEN', '만료된 토큰');

  static readonly USER_NOT_FOUND = new AdminApiError('USER_NOT_FOUND', '존재하지 않는 유저');
  static readonly UNACTIVE_USER = new AdminApiError('UNACTIVE_USER', '활성화 되지 않은 유저');

  static readonly ADMIN_ACCOUNT_NOT_FOUND = new AdminApiError('ADMIN_ACCOUNT_NOT_FOUND', '존재하지 않는 관리자 계정');
  static readonly ADMIN_ACCOUNT_ALREADY_EXISTS = new AdminApiError('ADMIN_ACCOUNT_ALREADY_EXISTS', '이미 등록된 관리자 계정');
  static readonly PERMISSION_PRESET_NOT_FOUND = new AdminApiError('PERMISSION_PRESET_NOT_FOUND', '존재하지 않는 권한 프리셋');
  static readonly PERMISSION_PRESET_CODE_DUPLICATE = new AdminApiError('PERMISSION_PRESET_CODE_DUPLICATE', '이미 사용중인 프리셋 코드');
  static readonly INVALID_PRESET_ID = new AdminApiError('INVALID_PRESET_ID', '유효하지 않은 프리셋 ID');

  private constructor(
    readonly _code: string,
    readonly _summary: string,
  ) {
    super();
  }

  get code(): string {
    return this._code;
  }

  get summary(): string {
    return this._summary;
  }

  get source(): 'Admin' {
    return 'Admin';
  }
}
