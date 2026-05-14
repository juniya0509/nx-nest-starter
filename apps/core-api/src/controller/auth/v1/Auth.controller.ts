import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';

import { AuthService } from '@libs/core-domain/src/domain/auth/Auth.service';
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { LanguageCodeUnion, languageCodeList } from '@libs/core-enum/src/Language.enum';

import { RequestUser, RequestUserPayload } from '../../../middleware/auth/RequestUser.decorator';
import { UserAuthGuard } from '../../../middleware/auth/UserAuthGuard.decorator';
import { SwaggerApiOperation } from '../../../support/api-docs/SwaggerApiOperation';
import { SwaggerApiResponseError } from '../../../support/api-docs/SwaggerApiResponseError';
import { SwaggerApiResponseSuccess } from '../../../support/api-docs/SwaggerApiResponseSuccess';
import { SwaggerApiTags } from '../../../support/api-docs/SwaggerApiTags';
import { ApiResponse } from '../../../support/response/ApiResponse';

import { LogoutReq } from './request/LogoutReq.dto';
import { OauthCallbackReq } from './request/OauthCallbackReq.dto';
import { RefreshTokenReq } from './request/RefreshTokenReq.dto';
import { AuthTokenRes } from './response/AuthTokenRes.dto';

@SwaggerApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SwaggerApiOperation({
    summary: 'OAuth 로그인 (Sign In / Sign Up)',
    description:
      'Logto SDK로 소셜 로그인(Kakao / Naver / Apple / Google) 또는 이메일 OTP 인증을 완료한 뒤, SDK가 발급한 access token을 본 endpoint에 전달해 서비스의 인증 토큰을 발급받습니다.\n' +
      'Logto SDK에서 받은 `logtoAccessToken`를 요청 본문으로 보냅니다.\n' +
      '만약 신규 사용자의 경우 자동으로 회원가입 처리 후 동일한 응답 형식으로 토큰(내부 Access JWT, Refresh JWT)이 발급됩니다.\n' +
      '발급받은 Access JWT는 이후 인증이 필요한 모든 API 호출 시 `Authorization: Bearer <token>` 헤더에 포함해주세요.\n' +
      'Access JWT 만료 시 `POST /v1/auth/refresh`로 갱신할 수 있습니다.',
  })
  @SwaggerApiResponseSuccess(201, AuthTokenRes)
  @SwaggerApiResponseError(401, [CoreDomainError.OAUTH_AUTHENTICATION_FAILED, CoreDomainError.OAUTH_USER_INFO_FETCH_FAILED])
  @SwaggerApiResponseError(409, [CoreDomainError.DUPLICATE_EMAIL])
  @HttpCode(201)
  @Post('/v1/auth/oauth/callback')
  async handleOauthCallback(
    @Body() request: OauthCallbackReq,
    @Headers('x-user-lang') headerLang: string | undefined,
  ): Promise<ApiResponse<AuthTokenRes>> {
    const lang = resolveLang(headerLang);
    const authToken = await this.authService.handleOauthCallback(request.toOauthCallbackData(lang));
    return ApiResponse.successWithData(AuthTokenRes.of(authToken));
  }

  @SwaggerApiOperation({
    summary: 'Access JWT 재발급 (Refresh)',
    description:
      '저장해둔 Refresh JWT로 만료된 Access JWT를 재발급받습니다.\n' +
      '요청 본문에 기존 Refresh JWT를 전달합니다.\n' +
      '매 호출마다 새 Access JWT와 Refresh JWT가 함께 발급되며, 응답으로 받은 새 Refresh JWT로 기존 값을 갱신해주세요.\n' +
      '직전에 사용한 Refresh JWT는 사용 불가 처리되므로 동일한 토큰으로 두 번 호출할 수 없습니다.',
  })
  @SwaggerApiResponseSuccess(201, AuthTokenRes)
  @SwaggerApiResponseError(401, [
    CoreDomainError.INVALID_JWT_REFRESH_TOKEN,
    CoreDomainError.EXPIRED_JWT_REFRESH_TOKEN,
    CoreDomainError.USER_TOKEN_NOT_FOUND,
  ])
  @Post('/v1/auth/refresh')
  async refreshToken(@Body() request: RefreshTokenReq): Promise<ApiResponse<AuthTokenRes>> {
    const authToken = await this.authService.refreshAccessToken(request.refreshToken);
    return ApiResponse.successWithData(AuthTokenRes.of(authToken));
  }

  @SwaggerApiOperation({
    summary: '로그아웃',
    description:
      '현재 디바이스의 Refresh JWT를 무효화하여 토큰 갱신을 차단합니다.\n' +
      '요청 본문에 무효화할 Refresh JWT를 전달합니다.\n' +
      '다른 기기에서 로그인한 세션은 영향을 받지 않습니다 (디바이스별 독립).\n' +
      '호출 후 클라이언트는 저장해둔 Access JWT와 Refresh JWT를 모두 제거해주세요.',
  })
  @SwaggerApiResponseSuccess(200, null)
  @SwaggerApiResponseError(401, [
    CoreDomainError.NOT_LOGGED_IN,
    CoreDomainError.INVALID_JWT_ACCESS_TOKEN,
    CoreDomainError.EXPIRED_JWT_ACCESS_TOKEN,
  ])
  @UserAuthGuard()
  @HttpCode(200)
  @Post('/v1/auth/logout')
  async logout(@RequestUser() requestUser: RequestUserPayload, @Body() request: LogoutReq): Promise<ApiResponse<null>> {
    await this.authService.logout(requestUser!.id, request.refreshToken, request.pushToken ?? null);
    return ApiResponse.success();
  }
}

/** x-user-lang 헤더 → 지원되는 LanguageCodeUnion 으로 정규화. 미지원/누락 시 'en-US' fallback. */
function resolveLang(headerValue: string | undefined): LanguageCodeUnion {
  if (headerValue && (languageCodeList as ReadonlyArray<string>).includes(headerValue)) {
    return headerValue as LanguageCodeUnion;
  }
  return 'en-US';
}
