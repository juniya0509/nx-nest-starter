import { Controller, Get } from '@nestjs/common';

import { UserService } from '@libs/core-domain/src/domain/user/User.service';
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { RequestUser, RequestUserPayload } from '../../../middleware/auth/RequestUser.decorator';
import { UserAuthGuardOptional } from '../../../middleware/auth/UserAuthGuardOptional.decorator';
import { SwaggerApiOperation } from '../../../support/api-docs/SwaggerApiOperation';
import { SwaggerApiResponseError } from '../../../support/api-docs/SwaggerApiResponseError';
import { SwaggerApiResponseSuccess } from '../../../support/api-docs/SwaggerApiResponseSuccess';
import { SwaggerApiTags } from '../../../support/api-docs/SwaggerApiTags';
import { ApiResponse } from '../../../support/response/ApiResponse';

import { GetMeRes } from './response/GetMeRes.dto';

@SwaggerApiTags('User')
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @SwaggerApiOperation({
    summary: 'Get Me',
    description: '현재 로그인된 유저(나)의 기본 정보를 가져온다. 로그인 안 된 상태면 data는 null로 응답.',
  })
  @SwaggerApiResponseSuccess(200, [GetMeRes, null])
  @SwaggerApiResponseError(401, [CoreDomainError.INVALID_JWT_ACCESS_TOKEN, CoreDomainError.EXPIRED_JWT_ACCESS_TOKEN])
  @SwaggerApiResponseError(404, [CoreDomainError.USER_NOT_FOUND])
  @UserAuthGuardOptional()
  @Get('/v1/users/me')
  async getMe(@RequestUser() requestUser: RequestUserPayload): Promise<ApiResponse<GetMeRes | null>> {
    if (requestUser === null) {
      return ApiResponse.successWithData<GetMeRes | null>(null);
    }

    const user = await this.userService.getUserById(requestUser.id);
    return ApiResponse.successWithData<GetMeRes | null>(GetMeRes.of(user));
  }
}
