import { Enum, EnumType } from 'ts-jenum';

@Enum('code')
export class ApiError extends EnumType<ApiError>() {
  static readonly DEFAULT_ERROR = new ApiError('DEFAULT_ERROR', '서버에러가 발생');
  static readonly DEFAULT_BAD_REQUEST_ERROR = new ApiError('DEFAULT_BAD_REQUEST_ERROR', '잘못된 요청');
  static readonly DEFAULT_NOT_FOUND = new ApiError('DEFAULT_NOT_FOUND', '존재하지 않는 경로');
  static readonly PAYLOAD_TOO_LARGE = new ApiError('PAYLOAD_TOO_LARGE', '요청하신 파일의 사이즈가 너무 큼');

  static readonly UNSUPPORTED_FILE_FORMAT = new ApiError('UNSUPPORTED_FILE_FORMAT', '지원하지 않는 파일 확장자');

  static readonly NOT_LOGGED_IN = new ApiError('NOT_LOGGED_IN', '로그인이 되어있지 않음');
  static readonly NON_EXISTENT_USER = new ApiError('NON_EXISTENT_USER', '존재하지 않는 유저');
  static readonly NOT_ACTIVED_USER = new ApiError('NOT_ACTIVED_USER', '활성화 되지 않은 유저');
  static readonly SUSPENDED_USER = new ApiError('SUSPENDED_USER', '활동이 정지된 유저');
  static readonly DO_NOT_HAVE_PERMISSION = new ApiError('DO_NOT_HAVE_PERMISSION', '접근 권한이 없음');

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

  get source(): 'Core' {
    return 'Core';
  }
}
