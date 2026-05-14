import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CoreDomainError } from '../../support/error/CoreDomainError';
import { MailService } from '../mail/Mail.service';
import { CreateUserData } from '../user/data/CreateUserData';
import { CreateUserOauthData } from '../user/data/CreateUserOauthData';
import { CreateUserTokenData } from '../user/data/CreateUserTokenData';
import { UpsertUserDeviceData } from '../user/data/UpsertUserDeviceData';
import { GetUserResult } from '../user/result/GetUserResult';
import { UserCreator } from '../user/User.creator';
import { UserReader } from '../user/User.reader';
import { UserDeviceCreator } from '../user/UserDevice.creator';
import { UserDeviceRemover } from '../user/UserDevice.remover';
import { UserOauthCreator } from '../user/UserOauth.creator';
import { UserOauthReader } from '../user/UserOauth.reader';
import { UserTokenCreator } from '../user/UserToken.creator';
import { UserTokenReader } from '../user/UserToken.reader';
import { UserTokenRemover } from '../user/UserToken.remover';

import { AuthReader } from './Auth.reader';
import { OauthCallbackData } from './data/OauthCallbackData';
import { JwtIssuer } from './Jwt.issuer';
import { JwtVerifier } from './Jwt.verifier';
import { AuthTokenResult } from './result/AuthTokenResult';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authReader: AuthReader,
    private readonly userReader: UserReader,
    private readonly userCreator: UserCreator,
    private readonly userOauthReader: UserOauthReader,
    private readonly userOauthCreator: UserOauthCreator,
    private readonly userTokenReader: UserTokenReader,
    private readonly userTokenCreator: UserTokenCreator,
    private readonly userTokenRemover: UserTokenRemover,
    private readonly userDeviceCreator: UserDeviceCreator,
    private readonly userDeviceRemover: UserDeviceRemover,
    private readonly jwtIssuer: JwtIssuer,
    private readonly jwtVerifier: JwtVerifier,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async handleOauthCallback(data: OauthCallbackData): Promise<AuthTokenResult> {
    const logtoUser = await this.authReader.resolveLogtoUserInfo(data.logtoAccessToken);
    const existingUserOauth = await this.userOauthReader.findByLogtoUserId(logtoUser.logtoUserId);

    const findOrCreate = await this.userCreator.findOrCreateIfNoOauth(
      CreateUserData.fromOauthUserInfo({
        email: logtoUser.email,
        firstname: logtoUser.firstname,
        lastname: logtoUser.lastname,
        avatarUrl: logtoUser.avatarUrl,
        defaultLanguage: data.lang,
      }),
      existingUserOauth,
    );

    const user = await this.userReader.getByIdOrThrow(existingUserOauth?.userId ?? findOrCreate.userId!);

    if (findOrCreate.isNewUser) {
      // 가입 흐름의 부수효과 — 메일 발송 실패가 가입을 롤백시키지 않도록 try/catch 후 로깅만.
      this.mailService.sendWelcome(user).catch((err) => {
        this.logger.warn(`sendWelcome failed for userId=${user.id}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    const existingForProvider = await this.userOauthReader.findByUserIdAndProvider(user.id, data.provider);
    if (!existingForProvider) {
      await this.userOauthCreator.createUserOauth(
        CreateUserOauthData.fromOauthUserInfo({
          userId: user.id,
          logtoUserId: logtoUser.logtoUserId,
          provider: data.provider,
          providerUserId: logtoUser.resolveProviderUserId(data.provider),
        }),
      );
    }

    if (data.device) {
      // 클라이언트가 push token 을 보낸 경우에만 등록. 권한 거부한 사용자는 device 없이 로그인 가능.
      await this.userDeviceCreator.upsertByPushToken(
        UpsertUserDeviceData.of({
          userId: user.id,
          deviceType: data.device.deviceType,
          pushToken: data.device.pushToken,
          language: data.device.language,
        }),
      );
    }

    const accessToken = await this.jwtIssuer.issueAccessToken(user.id);
    const refreshToken = await this.jwtIssuer.issueRefreshToken(user.id);

    await this.userTokenCreator.createUserToken(
      CreateUserTokenData.fromIssuedToken({
        userId: user.id,
        refreshToken: refreshToken.token,
        expiresAt: refreshToken.expiresAt,
      }),
    );

    return AuthTokenResult.of({
      accessToken: accessToken.token,
      accessTokenExpiresIn: this.configService.get<number>('ACCESS_JWT_EXPIRES_IN_SECOND')!,
      refreshToken: refreshToken.token,
      refreshTokenExpiresIn: this.configService.get<number>('REFRESH_JWT_EXPIRES_IN_SECOND')!,
      user,
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokenResult> {
    const verifyResult = await this.jwtVerifier.verifyRefreshToken(refreshToken);

    if (verifyResult.isErr()) {
      const errorType =
        verifyResult.error === 'expired' ? CoreDomainError.EXPIRED_JWT_REFRESH_TOKEN : CoreDomainError.INVALID_JWT_REFRESH_TOKEN;
      throw new UnauthorizedException({ errorType });
    }

    await this.userTokenReader.getByRefreshTokenOrThrow(refreshToken);
    await this.userTokenRemover.removeByRefreshToken(refreshToken);

    const user = await this.userReader.getByIdOrThrow(verifyResult.value.userId);

    const newAccessToken = await this.jwtIssuer.issueAccessToken(user.id);
    const newRefreshToken = await this.jwtIssuer.issueRefreshToken(user.id);

    await this.userTokenCreator.createUserToken(
      CreateUserTokenData.fromIssuedToken({
        userId: user.id,
        refreshToken: newRefreshToken.token,
        expiresAt: newRefreshToken.expiresAt,
      }),
    );

    return AuthTokenResult.of({
      accessToken: newAccessToken.token,
      accessTokenExpiresIn: this.configService.get<number>('ACCESS_JWT_EXPIRES_IN_SECOND')!,
      refreshToken: newRefreshToken.token,
      refreshTokenExpiresIn: this.configService.get<number>('REFRESH_JWT_EXPIRES_IN_SECOND')!,
      user,
    });
  }

  async logout(userId: number, refreshToken: string, pushToken: string | null): Promise<void> {
    const userToken = await this.userTokenReader.findByRefreshToken(refreshToken);
    if (!userToken || userToken.userId !== userId) return;

    await this.userTokenRemover.removeByRefreshToken(refreshToken);

    if (pushToken) {
      await this.userDeviceRemover.removeByPushToken(pushToken);
    }
  }

  async getVerifiedUserByAccessJwt(accessJwt: string): Promise<GetUserResult> {
    const verifyResult = await this.jwtVerifier.verifyAccessToken(accessJwt);

    if (verifyResult.isErr()) {
      const errorType =
        verifyResult.error === 'expired' ? CoreDomainError.EXPIRED_JWT_ACCESS_TOKEN : CoreDomainError.INVALID_JWT_ACCESS_TOKEN;
      throw new UnauthorizedException({ errorType });
    }

    return this.userReader.getByIdOrThrow(verifyResult.value.userId);
  }
}
