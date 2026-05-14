import { Enum, EnumConstNames, EnumType } from 'ts-jenum';

@Enum('code')
export class AuthProvider extends EnumType<AuthProvider>() {
  static readonly KAKAO = new AuthProvider('KAKAO', '카카오 로그인');
  static readonly NAVER = new AuthProvider('NAVER', '네이버 로그인');
  static readonly APPLE = new AuthProvider('APPLE', '애플 로그인');
  static readonly GOOGLE = new AuthProvider('GOOGLE', '구글 로그인');
  static readonly EMAIL = new AuthProvider('EMAIL', '이메일 OTP 로그인');

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

export type AuthProviderUnion = EnumConstNames<typeof AuthProvider>;

export const authProviderList = AuthProvider.keys();
