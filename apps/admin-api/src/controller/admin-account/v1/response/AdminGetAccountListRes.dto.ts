import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { AdminAccountListItemResult } from '../../../../domain/admin-account/result/AdminAccountListItemResult';

import { AdminAccountListItemRes } from './AdminAccountListItemRes.dto';

export class AdminGetAccountListRes {
  @Exclude() private readonly _totalPages: number;
  @Exclude() private readonly _totalResults: number;
  @Exclude() private readonly _list: AdminAccountListItemRes[];

  constructor(totalPages: number, totalResults: number, list: AdminAccountListItemResult[]) {
    this._totalPages = totalPages;
    this._totalResults = totalResults;
    this._list = list.map((item) => AdminAccountListItemRes.of(item));
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
  @ApiProperty({ type: [AdminAccountListItemRes], description: '관리자 계정 목록' })
  @Type(() => AdminAccountListItemRes)
  get list(): AdminAccountListItemRes[] {
    return this._list;
  }

  static of(totalPages: number, totalResults: number, list: AdminAccountListItemResult[]): AdminGetAccountListRes {
    return new AdminGetAccountListRes(totalPages, totalResults, list);
  }
}
