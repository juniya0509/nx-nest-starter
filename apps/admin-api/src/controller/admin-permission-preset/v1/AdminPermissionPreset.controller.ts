import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';

import { AdminPermissionPresetService } from '../../../domain/admin-permission-preset/AdminPermissionPreset.service';
import { AdminPermission } from '../../../enum/AdminPermission.enum';
import { AdminAuth } from '../../../middleware/auth/AdminAuth.decorator';
import { AdminSwaggerApiOperation } from '../../../support/api-docs/AdminSwaggerApiOperation';
import { AdminSwaggerApiResponseError } from '../../../support/api-docs/AdminSwaggerApiResponseError';
import { AdminSwaggerApiResponseSuccess } from '../../../support/api-docs/AdminSwaggerApiResponseSuccess';
import { AdminSwaggerApiTags } from '../../../support/api-docs/AdminSwaggerApiTags';
import { AdminApiError } from '../../../support/error/AdminApiError';
import { AdminApiResponse } from '../../../support/response/AdminApiResponse';

import { AdminCreatePresetReq } from './request/AdminCreatePresetReq.dto';
import { AdminPresetIdParam } from './request/AdminPresetIdReq.dto';
import { AdminUpdatePresetReq } from './request/AdminUpdatePresetReq.dto';
import { AdminCreatePresetRes } from './response/AdminCreatePresetRes.dto';
import { AdminGetPresetListRes } from './response/AdminGetPresetListRes.dto';
import { AdminGetPresetRes } from './response/AdminGetPresetRes.dto';

@AdminSwaggerApiTags('Admin Permission Preset')
@Controller()
export class AdminPermissionPresetController {
  constructor(private readonly adminPermissionPresetService: AdminPermissionPresetService) {}

  @AdminSwaggerApiOperation({
    summary: '권한 프리셋 생성',
    description: '여러 권한을 묶은 프리셋을 생성합니다. 프리셋이 적용된 관리자에게는 즉시 반영됩니다 (참조형).',
  })
  @AdminSwaggerApiResponseSuccess(201, AdminCreatePresetRes)
  @AdminSwaggerApiResponseError(409, [AdminApiError.PERMISSION_PRESET_CODE_DUPLICATE])
  @AdminAuth({ requireAll: [AdminPermission.PERMISSION_PRESET_MANAGE] })
  @HttpCode(201)
  @Post('/v1/admin-permission-presets')
  async createPreset(@Body() request: AdminCreatePresetReq): Promise<AdminApiResponse<AdminCreatePresetRes>> {
    const id = await this.adminPermissionPresetService.createPreset(request.toAdminCreatePermissionPresetData());
    return AdminApiResponse.successWithData(AdminCreatePresetRes.of(id));
  }

  @AdminSwaggerApiOperation({
    summary: '권한 프리셋 목록 조회',
    description: '등록된 모든 프리셋을 조회합니다. 각 프리셋의 권한 개수가 함께 반환됩니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminGetPresetListRes)
  @AdminAuth({ requireAll: [AdminPermission.PERMISSION_PRESET_MANAGE] })
  @Get('/v1/admin-permission-presets')
  async getPresetList(): Promise<AdminApiResponse<AdminGetPresetListRes>> {
    const list = await this.adminPermissionPresetService.getPresetList();
    return AdminApiResponse.successWithData(AdminGetPresetListRes.of(list));
  }

  @AdminSwaggerApiOperation({
    summary: '권한 프리셋 단건 조회',
    description: '프리셋 정보와 포함된 권한 코드 목록을 조회합니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminGetPresetRes)
  @AdminSwaggerApiResponseError(404, [AdminApiError.PERMISSION_PRESET_NOT_FOUND])
  @AdminAuth({ requireAll: [AdminPermission.PERMISSION_PRESET_MANAGE] })
  @Get('/v1/admin-permission-presets/:id')
  async getPreset(@Param() request: AdminPresetIdParam): Promise<AdminApiResponse<AdminGetPresetRes>> {
    const result = await this.adminPermissionPresetService.getPreset(request.id);
    return AdminApiResponse.successWithData(AdminGetPresetRes.of(result));
  }

  @AdminSwaggerApiOperation({
    summary: '권한 프리셋 수정',
    description:
      '프리셋의 이름/설명/권한 구성을 수정합니다.\n' +
      '권한 코드 목록은 전체 교체 방식으로 동작합니다 (요청에 포함된 코드만 남고 나머지는 제거).\n' +
      '이 프리셋이 적용된 모든 관리자에게는 즉시 반영됩니다 (참조형).',
  })
  @AdminSwaggerApiResponseSuccess(200, null, '수정 성공')
  @AdminSwaggerApiResponseError(404, [AdminApiError.PERMISSION_PRESET_NOT_FOUND])
  @AdminAuth({ requireAll: [AdminPermission.PERMISSION_PRESET_MANAGE] })
  @HttpCode(200)
  @Patch('/v1/admin-permission-presets/:id')
  async updatePreset(@Param() param: AdminPresetIdParam, @Body() request: AdminUpdatePresetReq): Promise<AdminApiResponse<null>> {
    await this.adminPermissionPresetService.updatePreset(param.id, request.toAdminUpdatePermissionPresetData());
    return AdminApiResponse.success();
  }

  @AdminSwaggerApiOperation({
    summary: '권한 프리셋 삭제',
    description: '프리셋을 삭제합니다 (soft delete). 이 프리셋이 적용되어 있던 관리자들은 해당 프리셋이 자동으로 적용 해제됩니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, null, '삭제 성공')
  @AdminSwaggerApiResponseError(404, [AdminApiError.PERMISSION_PRESET_NOT_FOUND])
  @AdminAuth({ requireAll: [AdminPermission.PERMISSION_PRESET_MANAGE] })
  @HttpCode(200)
  @Delete('/v1/admin-permission-presets/:id')
  async deletePreset(@Param() request: AdminPresetIdParam): Promise<AdminApiResponse<null>> {
    await this.adminPermissionPresetService.deletePreset(request.id);
    return AdminApiResponse.success();
  }
}
