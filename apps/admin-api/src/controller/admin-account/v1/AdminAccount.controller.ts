import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminAccountService } from '../../../domain/admin-account/AdminAccount.service';
import { AdminPermission } from '../../../enum/AdminPermission.enum';
import { AdminAuth } from '../../../middleware/auth/AdminAuth.decorator';
import { AdminRequestUser, AdminRequestUserPayload } from '../../../middleware/auth/AdminRequestUser.decorator';
import { AdminSwaggerApiOperation } from '../../../support/api-docs/AdminSwaggerApiOperation';
import { AdminSwaggerApiResponseError } from '../../../support/api-docs/AdminSwaggerApiResponseError';
import { AdminSwaggerApiResponseSuccess } from '../../../support/api-docs/AdminSwaggerApiResponseSuccess';
import { AdminSwaggerApiTags } from '../../../support/api-docs/AdminSwaggerApiTags';
import { AdminApiError } from '../../../support/error/AdminApiError';
import { AdminApiResponse } from '../../../support/response/AdminApiResponse';

import { AdminAccountIdParam } from './request/AdminAccountIdReq.dto';
import { AdminCreateAccountReq } from './request/AdminCreateAccountReq.dto';
import { AdminGetAccountListQuery } from './request/AdminGetAccountListReq.dto';
import { AdminSetPermissionsReq } from './request/AdminSetPermissionsReq.dto';
import { AdminSetPresetsReq } from './request/AdminSetPresetsReq.dto';
import { AdminGetAccountListRes } from './response/AdminGetAccountListRes.dto';
import { AdminGetAccountRes } from './response/AdminGetAccountRes.dto';

@AdminSwaggerApiTags('Admin Account')
@Controller()
export class AdminAccountController {
  constructor(private readonly adminAccountService: AdminAccountService) {}

  @AdminSwaggerApiOperation({
    summary: '관리자 계정 등록',
    description:
      '특정 사용자(user.id)를 관리자로 등록합니다.\n' +
      '권한 부여는 별도 API(`PUT /v1/admin-accounts/:id/permissions`, `PUT /v1/admin-accounts/:id/presets`)로 진행해주세요.',
  })
  @AdminSwaggerApiResponseSuccess(201, null, '관리자 등록 성공')
  @AdminSwaggerApiResponseError(404, [AdminApiError.USER_NOT_FOUND])
  @AdminSwaggerApiResponseError(409, [AdminApiError.ADMIN_ACCOUNT_ALREADY_EXISTS])
  @AdminAuth({ requireAll: [AdminPermission.ADMIN_ACCOUNT_MANAGE] })
  @HttpCode(201)
  @Post('/v1/admin-accounts')
  async createAdminAccount(@Body() request: AdminCreateAccountReq): Promise<AdminApiResponse<null>> {
    await this.adminAccountService.createAdminAccount(request.toAdminCreateAccountData());
    return AdminApiResponse.success();
  }

  @AdminSwaggerApiOperation({
    summary: '관리자 계정 목록 조회',
    description: '페이지네이션 기반으로 관리자 계정 목록을 조회합니다. 키워드로 사용자 이메일/이름을 부분 검색할 수 있습니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminGetAccountListRes)
  @AdminAuth({ requireAll: [AdminPermission.ADMIN_ACCOUNT_MANAGE] })
  @Get('/v1/admin-accounts')
  async getAdminAccountList(@Query() request: AdminGetAccountListQuery): Promise<AdminApiResponse<AdminGetAccountListRes>> {
    const { totalPages, totalResults, list } = await this.adminAccountService.getAdminAccountList(request.toAdminGetAccountListData());

    return AdminApiResponse.successWithData(AdminGetAccountListRes.of(totalPages, totalResults, list));
  }

  @AdminSwaggerApiOperation({
    summary: '내 관리자 계정 조회',
    description:
      '현재 로그인한 관리자 본인의 계정 정보를 조회합니다.\n' +
      '직접 부여된 권한, 적용된 프리셋, 유효 권한이 모두 포함됩니다.\n' +
      '관리자 권한이 있는 모든 사용자가 호출 가능합니다 (별도 권한 불필요).',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminGetAccountRes)
  @AdminAuth()
  @Get('/v1/admin-accounts/me')
  async getMyAdminAccount(@AdminRequestUser() requestAdminUser: AdminRequestUserPayload): Promise<AdminApiResponse<AdminGetAccountRes>> {
    const result = await this.adminAccountService.getAdminAccount(requestAdminUser!.adminAccount.id);
    return AdminApiResponse.successWithData(AdminGetAccountRes.of(result));
  }

  @AdminSwaggerApiOperation({
    summary: '관리자 계정 단건 조회',
    description: '관리자 계정의 정보를 조회합니다. 직접 부여된 권한, 적용된 프리셋, 유효 권한이 모두 포함됩니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminGetAccountRes)
  @AdminSwaggerApiResponseError(404, [AdminApiError.ADMIN_ACCOUNT_NOT_FOUND, CoreDomainError.USER_NOT_FOUND])
  @AdminAuth({ requireAll: [AdminPermission.ADMIN_ACCOUNT_MANAGE] })
  @Get('/v1/admin-accounts/:id')
  async getAdminAccount(@Param() request: AdminAccountIdParam): Promise<AdminApiResponse<AdminGetAccountRes>> {
    const result = await this.adminAccountService.getAdminAccount(request.id);
    return AdminApiResponse.successWithData(AdminGetAccountRes.of(result));
  }

  @AdminSwaggerApiOperation({
    summary: '관리자 계정 삭제',
    description:
      '관리자 자격을 해제합니다 (soft delete). 직접 부여된 권한과 적용된 프리셋도 모두 정리됩니다. 사용자(user) 자체는 영향을 받지 않습니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, null, '삭제 성공')
  @AdminSwaggerApiResponseError(404, [AdminApiError.ADMIN_ACCOUNT_NOT_FOUND, CoreDomainError.USER_NOT_FOUND])
  @AdminAuth({ requireAll: [AdminPermission.ADMIN_ACCOUNT_MANAGE] })
  @HttpCode(200)
  @Delete('/v1/admin-accounts/:id')
  async deleteAdminAccount(@Param() request: AdminAccountIdParam): Promise<AdminApiResponse<null>> {
    await this.adminAccountService.deleteAdminAccount(request.id);
    return AdminApiResponse.success();
  }

  @AdminSwaggerApiOperation({
    summary: '관리자 직접 권한 set 교체',
    description:
      '관리자에게 직접 부여된 권한을 전체 교체합니다 (atomic).\n' +
      '요청에 포함된 권한 코드만 남기고, 그 외 직접 부여 권한은 모두 제거됩니다.\n' +
      '프리셋을 통한 권한은 영향받지 않습니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, null, '권한 갱신 성공')
  @AdminSwaggerApiResponseError(404, [AdminApiError.ADMIN_ACCOUNT_NOT_FOUND, CoreDomainError.USER_NOT_FOUND])
  @AdminAuth({ requireAll: [AdminPermission.ADMIN_PERMISSION_ASSIGN] })
  @HttpCode(200)
  @Put('/v1/admin-accounts/:id/permissions')
  async setAdminAccountPermissions(
    @Param() param: AdminAccountIdParam,
    @Body() request: AdminSetPermissionsReq,
  ): Promise<AdminApiResponse<null>> {
    await this.adminAccountService.replaceDirectPermissions(param.id, request.permissionCodes);
    return AdminApiResponse.success();
  }

  @AdminSwaggerApiOperation({
    summary: '관리자 적용 프리셋 set 교체',
    description:
      '관리자에게 적용된 프리셋을 전체 교체합니다 (atomic).\n' +
      '요청에 포함된 프리셋 ID만 적용 상태로 남고, 그 외 프리셋은 적용 해제됩니다.\n' +
      '직접 부여된 권한은 영향받지 않습니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, null, '프리셋 갱신 성공')
  @AdminSwaggerApiResponseError(400, [AdminApiError.INVALID_PRESET_ID])
  @AdminSwaggerApiResponseError(404, [AdminApiError.ADMIN_ACCOUNT_NOT_FOUND])
  @AdminAuth({ requireAll: [AdminPermission.ADMIN_PERMISSION_ASSIGN] })
  @HttpCode(200)
  @Put('/v1/admin-accounts/:id/presets')
  async setAdminAccountPresets(@Param() param: AdminAccountIdParam, @Body() request: AdminSetPresetsReq): Promise<AdminApiResponse<null>> {
    await this.adminAccountService.replaceAppliedPresets(param.id, request.presetIds);
    return AdminApiResponse.success();
  }
}
