import { Enum, EnumType } from 'ts-jenum';

@Enum('code')
export class CoreDomainError extends EnumType<CoreDomainError>() {
  static readonly DEFAULT_ERROR = new CoreDomainError('DEFAULT_ERROR', '서버에러 발생');
  static readonly DEFAULT_BAD_REQUEST_ERROR = new CoreDomainError('DEFAULT_BAD_REQUEST_ERROR', '잘못된 요청');
  static readonly DEFAULT_NOT_FOUND = new CoreDomainError('DEFAULT_NOT_FOUND', '존재하지 않음');
  static readonly PAYLOAD_TOO_LARGE = new CoreDomainError('PAYLOAD_TOO_LARGE', '파일의 사이즈가 너무 큼');

  static readonly UNSUPPORTED_FILE_FORMAT = new CoreDomainError('UNSUPPORTED_FILE_FORMAT', '지원하지 않는 파일 확장자');
  static readonly FILE_NOT_FOUND = new CoreDomainError('FILE_NOT_FOUND', '업로드된 파일이 없음');

  static readonly INVALID_JWT_ACCESS_TOKEN = new CoreDomainError('INVALID_JWT_ACCESS_TOKEN', '유효하지 않는 토큰');
  static readonly EXPIRED_JWT_ACCESS_TOKEN = new CoreDomainError('EXPIRED_JWT_ACCESS_TOKEN', '만료된 토큰');
  static readonly INVALID_JWT_REFRESH_TOKEN = new CoreDomainError('INVALID_JWT_REFRESH_TOKEN', '유효하지 않는 토큰');
  static readonly EXPIRED_JWT_REFRESH_TOKEN = new CoreDomainError('EXPIRED_JWT_REFRESH_TOKEN', '만료된 토큰');
  static readonly NOT_LOGGED_IN = new CoreDomainError('NOT_LOGGED_IN', '로그인이 되어있지 않음');
  static readonly NON_EXISTENT_USER = new CoreDomainError('NON_EXISTENT_USER', '존재하지 않는 유저');
  static readonly NOT_ACTIVED_USER = new CoreDomainError('NOT_ACTIVED_USER', '활성화 되지 않은 유저');
  static readonly DO_NOT_HAVE_PERMISSION = new CoreDomainError('DO_NOT_HAVE_PERMISSION', '접근 권한이 없음');
  static readonly INVALID_VERIFICATION_CODE = new CoreDomainError('INVALID_VERIFICATION_CODE', '유효하지 않은 인증코드');

  static readonly USER_NOT_FOUND = new CoreDomainError('USER_NOT_FOUND', '존재하지 않는 유저');
  static readonly DUPLICATE_EMAIL = new CoreDomainError('DUPLICATE_EMAIL', '이미 사용중인 이메일');
  static readonly DUPLICATE_PHONE_NUMBER = new CoreDomainError('DUPLICATE_PHONE_NUMBER', '이미 사용중인 전화번호');
  static readonly USER_DEVICE_NOT_FOUND = new CoreDomainError('USER_DEVICE_NOT_FOUND', '존재하지 않는 유저 디바이스');
  static readonly USER_TOKEN_NOT_FOUND = new CoreDomainError('USER_TOKEN_NOT_FOUND', '존재하지 않는 유저 토큰');

  static readonly OAUTH_AUTHENTICATION_FAILED = new CoreDomainError('OAUTH_AUTHENTICATION_FAILED', 'OAuth 인증 실패');
  static readonly OAUTH_USER_INFO_FETCH_FAILED = new CoreDomainError('OAUTH_USER_INFO_FETCH_FAILED', 'OAuth 사용자 정보 조회 실패');

  static readonly MAIL_SEND_FAILED = new CoreDomainError('MAIL_SEND_FAILED', '이메일 발송 실패');
  static readonly INVALID_MAIL_RECIPIENT = new CoreDomainError('INVALID_MAIL_RECIPIENT', '유효하지 않은 수신자');

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
