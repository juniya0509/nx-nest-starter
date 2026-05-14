import { Controller, Get, Param, Query } from '@nestjs/common';

import { AdminUserService } from '../../../domain/user/AdminUser.service';
import { AdminPermission } from '../../../enum/AdminPermission.enum';
import { AdminAuth } from '../../../middleware/auth/AdminAuth.decorator';
import { AdminSwaggerApiOperation } from '../../../support/api-docs/AdminSwaggerApiOperation';
import { AdminSwaggerApiResponseSuccess } from '../../../support/api-docs/AdminSwaggerApiResponseSuccess';
import { AdminSwaggerApiTags } from '../../../support/api-docs/AdminSwaggerApiTags';
import { AdminApiResponse } from '../../../support/response/AdminApiResponse';

import { AdminGetUserListQuery } from './request/AdminGetUserListReq.dto';
import { AdminUserIdParam } from './request/AdminGetUserReq.dto';
import { AdminGetUserListRes } from './response/AdminGetUserListRes.dto';
import { AdminGetUserRes } from './response/AdminGetUserRes.dto';

@AdminSwaggerApiTags('User')
@Controller()
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @AdminSwaggerApiOperation({
    summary: '유저 목록 조회',
    description: '페이지네이션 기반으로 유저 목록을 조회합니다. 키워드(이메일/이름 부분 일치)와 상태로 필터링할 수 있습니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminGetUserListRes)
  @AdminAuth({ requireAll: [AdminPermission.USER_LIST] })
  @Get('/v1/users')
  async getUserList(@Query() request: AdminGetUserListQuery): Promise<AdminApiResponse<AdminGetUserListRes>> {
    const { totalPages, totalResults, list } = await this.adminUserService.getUserList(request.toAdminGetUserListData());

    return AdminApiResponse.successWithData(AdminGetUserListRes.of(totalPages, totalResults, list));
  }

  @AdminSwaggerApiOperation({
    summary: '유저 상세 조회',
    description: '유저 ID로 상세 정보를 조회합니다. 해당 유저의 관리자 계정 보유 여부(isAdmin)도 함께 반환합니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminGetUserRes)
  @AdminAuth({ requireAll: [AdminPermission.USER_READ] })
  @Get('/v1/users/:id')
  async getUser(@Param() param: AdminUserIdParam): Promise<AdminApiResponse<AdminGetUserRes>> {
    const result = await this.adminUserService.getUser(param.id);

    return AdminApiResponse.successWithData(AdminGetUserRes.of(result));
  }
}
