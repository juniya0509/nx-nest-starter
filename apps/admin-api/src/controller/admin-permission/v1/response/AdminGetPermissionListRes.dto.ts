import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { AdminPermissionResult } from '../../../../domain/admin-permission/result/AdminPermissionResult';

import { AdminPermissionItemRes } from './AdminPermissionItemRes.dto';

export class AdminGetPermissionListRes {
  @Exclude() private readonly _list: AdminPermissionItemRes[];

  constructor(list: AdminPermissionResult[]) {
    this._list = list.map((item) => AdminPermissionItemRes.of(item));
  }

  @Expose()
  @ApiProperty({ type: [AdminPermissionItemRes], description: '권한 카탈로그 목록 (그룹 → 코드 정렬)' })
  @Type(() => AdminPermissionItemRes)
  get list(): AdminPermissionItemRes[] {
    return this._list;
  }

  static of(list: AdminPermissionResult[]): AdminGetPermissionListRes {
    return new AdminGetPermissionListRes(list);
  }
}
