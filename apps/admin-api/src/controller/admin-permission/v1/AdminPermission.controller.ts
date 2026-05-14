import { Controller, Get } from '@nestjs/common';

import { AdminPermissionService } from '../../../domain/admin-permission/AdminPermission.service';
import { AdminPermission } from '../../../enum/AdminPermission.enum';
import { AdminAuth } from '../../../middleware/auth/AdminAuth.decorator';
import { AdminSwaggerApiOperation } from '../../../support/api-docs/AdminSwaggerApiOperation';
import { AdminSwaggerApiResponseSuccess } from '../../../support/api-docs/AdminSwaggerApiResponseSuccess';
import { AdminSwaggerApiTags } from '../../../support/api-docs/AdminSwaggerApiTags';
import { AdminApiResponse } from '../../../support/response/AdminApiResponse';

import { AdminGetPermissionListRes } from './response/AdminGetPermissionListRes.dto';

@AdminSwaggerApiTags('Admin Permission')
@Controller()
export class AdminPermissionController {
  constructor(private readonly adminPermissionService: AdminPermissionService) {}

  @AdminSwaggerApiOperation({
    summary: '권한 카탈로그 조회',
    description:
      '시스템에 정의된 모든 권한 코드를 조회합니다.\n' +
      '관리자에게 권한을 부여하거나 프리셋을 구성할 때 UI 셀렉트 옵션으로 사용합니다.\n' +
      '결과는 그룹 코드 → 권한 코드 순으로 정렬되어 반환됩니다.',
  })
  @AdminSwaggerApiResponseSuccess(200, AdminGetPermissionListRes)
  @AdminAuth({ requireAll: [AdminPermission.ADMIN_PERMISSION_LIST] })
  @Get('/v1/admin-permissions')
  async getPermissionList(): Promise<AdminApiResponse<AdminGetPermissionListRes>> {
    const list = await this.adminPermissionService.getCatalog();
    return AdminApiResponse.successWithData(AdminGetPermissionListRes.of(list));
  }
}
