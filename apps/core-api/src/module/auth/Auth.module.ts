import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { UserRepository } from '@libs/core-database/src/mysql/entity/user/User.repository';
import { UserDeviceRepository } from '@libs/core-database/src/mysql/entity/user/UserDevice.repository';
import { UserOauthRepository } from '@libs/core-database/src/mysql/entity/user/UserOauth.repository';
import { UserTokenRepository } from '@libs/core-database/src/mysql/entity/user/UserToken.repository';
import { TypeOrmCustomRepositoryModule } from '@libs/core-database/src/mysql/module/TypeOrmCustomRepository.module';

import { AuthReader } from '@libs/core-domain/src/domain/auth/Auth.reader';
import { AuthService } from '@libs/core-domain/src/domain/auth/Auth.service';
import { JwtIssuer } from '@libs/core-domain/src/domain/auth/Jwt.issuer';
import { JwtVerifier } from '@libs/core-domain/src/domain/auth/Jwt.verifier';
import { UserCreator } from '@libs/core-domain/src/domain/user/User.creator';
import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';
import { UserDeviceCreator } from '@libs/core-domain/src/domain/user/UserDevice.creator';
import { UserDeviceRemover } from '@libs/core-domain/src/domain/user/UserDevice.remover';
import { UserOauthCreator } from '@libs/core-domain/src/domain/user/UserOauth.creator';
import { UserOauthReader } from '@libs/core-domain/src/domain/user/UserOauth.reader';
import { UserTokenCreator } from '@libs/core-domain/src/domain/user/UserToken.creator';
import { UserTokenReader } from '@libs/core-domain/src/domain/user/UserToken.reader';
import { UserTokenRemover } from '@libs/core-domain/src/domain/user/UserToken.remover';

import { AuthController } from '../../controller/auth/v1/Auth.controller';
import { AuthGuard } from '../../middleware/auth/AuthGuard';
import { MailModule } from '../mail/Mail.module';

@Module({
  imports: [
    TypeOrmCustomRepositoryModule.forCustomRepository([UserRepository, UserOauthRepository, UserTokenRepository, UserDeviceRepository]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_JWT_SECRET_KEY'),
      }),
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthReader,
    JwtIssuer,
    JwtVerifier,
    UserReader,
    UserCreator,
    UserOauthReader,
    UserOauthCreator,
    UserTokenReader,
    UserTokenCreator,
    UserTokenRemover,
    UserDeviceCreator,
    UserDeviceRemover,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [JwtVerifier, UserReader, AuthService],
})
export class AuthModule {}
