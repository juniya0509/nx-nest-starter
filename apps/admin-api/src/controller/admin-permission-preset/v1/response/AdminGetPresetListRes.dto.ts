import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { AdminPermissionPresetListItemResult } from '../../../../domain/admin-permission-preset/result/AdminPermissionPresetListItemResult';

import { AdminPresetListItemRes } from './AdminPresetListItemRes.dto';

export class AdminGetPresetListRes {
  @Exclude() private readonly _list: AdminPresetListItemRes[];

  constructor(list: AdminPermissionPresetListItemResult[]) {
    this._list = list.map((item) => AdminPresetListItemRes.of(item));
  }

  @Expose()
  @ApiProperty({ type: [AdminPresetListItemRes], description: '프리셋 목록' })
  @Type(() => AdminPresetListItemRes)
  get list(): AdminPresetListItemRes[] {
    return this._list;
  }

  static of(list: AdminPermissionPresetListItemResult[]): AdminGetPresetListRes {
    return new AdminGetPresetListRes(list);
  }
}
