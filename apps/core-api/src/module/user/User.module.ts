import { Module } from '@nestjs/common';

import { UserService } from '@libs/core-domain/src/domain/user/User.service';

import { UserController } from '../../controller/user/v1/User.controller';
import { AuthModule } from '../auth/Auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
