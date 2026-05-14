import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { AdminUserListItemResult } from '../../../../domain/user/result/AdminUserListItemResult';

import { AdminUserListItemRes } from './AdminUserListItemRes.dto';

export class AdminGetUserListRes {
  @Exclude() private readonly _totalPages: number;
  @Exclude() private readonly _totalResults: number;
  @Exclude() private readonly _list: AdminUserListItemRes[];

  constructor(totalPages: number, totalResults: number, list: AdminUserListItemResult[]) {
    this._totalPages = totalPages;
    this._totalResults = totalResults;
    this._list = list.map((item) => AdminUserListItemRes.of(item));
  }

  @Expose()
  @ApiProperty({ type: 'integer', description: '총 페이지 수' })
  get totalPages(): number {
    return this._totalPages;
  }

  @Expose()
  @ApiProperty({ type: 'integer', description: '총 결과 개수' })
  get totalResults(): number {
    return this._totalResults;
  }

  @Expose()
  @ApiProperty({ type: [AdminUserListItemRes], description: '유저 목록' })
  @Type(() => AdminUserListItemRes)
  get list(): AdminUserListItemRes[] {
    return this._list;
  }

  static of(totalPages: number, totalResults: number, list: AdminUserListItemResult[]): AdminGetUserListRes {
    return new AdminGetUserListRes(totalPages, totalResults, list);
  }
}
