import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

import { OauthCallbackData } from '@libs/core-domain/src/domain/auth/data/OauthCallbackData';

import { AuthProvider, AuthProviderUnion, authProviderList } from '@libs/core-enum/src/AuthProvider.enum';
import { LanguageCodeUnion, languageCodeList } from '@libs/core-enum/src/Language.enum';
import { UserDeviceTypeUnion, userDeviceTypeList } from '@libs/core-enum/src/UserDeviceType.enum';

class OauthCallbackDeviceReq {
  @ApiProperty({
    enum: userDeviceTypeList,
    description: '디바이스 타입',
  })
  @IsIn([...userDeviceTypeList])
  readonly deviceType!: UserDeviceTypeUnion;

  @ApiProperty({
    type: 'string',
    minLength: 1,
    description: 'FCM registration token (FE 의 firebase messaging SDK 가 발급)',
  })
  @IsString()
  @IsNotEmpty()
  readonly pushToken!: string;

  @ApiProperty({
    enum: languageCodeList,
    description: '이 디바이스의 언어 (push 알림 언어로 사용). user.defaultLanguage 와 별개.',
  })
  @IsIn([...languageCodeList])
  readonly language!: LanguageCodeUnion;
}

export class OauthCallbackReq {
  @ApiProperty({
    type: 'string',
    minLength: 1,
    description: 'Logto SDK가 발급한 access token (FE의 SDK.getAccessToken() 결과)',
  })
  @IsString()
  @IsNotEmpty()
  readonly logtoAccessToken!: string;

  @ApiProperty({
    enum: AuthProvider.keys(),
    description: '로그인 수단 (FE에서 사용자가 선택한 버튼)',
  })
  @IsIn([...authProviderList])
  readonly provider!: AuthProviderUnion;

  @ApiProperty({
    type: OauthCallbackDeviceReq,
    required: false,
    description:
      'FCM 등록 정보. push 권한을 받아 token 을 보낼 수 있는 클라이언트만 채우면 됨. ' +
      '미전송 시 device 등록 skip (push 알림 발송 대상에서 제외).',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OauthCallbackDeviceReq)
  readonly device?: OauthCallbackDeviceReq;

  toOauthCallbackData(lang: LanguageCodeUnion): OauthCallbackData {
    return OauthCallbackData.fromReqDto({
      logtoAccessToken: this.logtoAccessToken,
      provider: this.provider,
      lang,
      device: this.device ? { deviceType: this.device.deviceType, pushToken: this.device.pushToken, language: this.device.language } : null,
    });
  }
}
