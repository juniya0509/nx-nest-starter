import { AuthProviderUnion } from '@libs/core-enum/src/AuthProvider.enum';
import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';
import { UserDeviceTypeUnion } from '@libs/core-enum/src/UserDeviceType.enum';

export type OauthCallbackDeviceInfo = {
  readonly deviceType: UserDeviceTypeUnion;
  readonly pushToken: string;
  readonly language: LanguageCodeUnion;
};

type OauthCallbackDataProps = {
  readonly logtoAccessToken: string;
  readonly provider: AuthProviderUnion;
  /** 신규 가입 시 user.defaultLanguage 로 저장될 언어 코드. controller 에서 x-user-lang 헤더 → fallback 'en-US'. */
  readonly lang: LanguageCodeUnion;
  /** 클라이언트가 push 권한을 받아 FCM token 을 보낸 경우에만 채워진다. 미수신 시 device 등록 skip. */
  readonly device: OauthCallbackDeviceInfo | null;
};

export class OauthCallbackData {
  private constructor(private readonly data: OauthCallbackDataProps) {}

  get logtoAccessToken(): string {
    return this.data.logtoAccessToken;
  }

  get provider(): AuthProviderUnion {
    return this.data.provider;
  }

  get lang(): LanguageCodeUnion {
    return this.data.lang;
  }

  get device(): OauthCallbackDeviceInfo | null {
    return this.data.device;
  }

  static fromReqDto(data: OauthCallbackDataProps): OauthCallbackData {
    return new OauthCallbackData({ ...data });
  }
}
