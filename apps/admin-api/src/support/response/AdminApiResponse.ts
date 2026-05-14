import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { AdminApiErrorMessage } from './AdminApiErrorMessage';
import { adminApiResponseResultCodeList, AdminApiResponseResultCodeUnion } from './AdminApiResponseResultType';

export class AdminApiResponse<T> {
  @Exclude() private readonly _result: AdminApiResponseResultCodeUnion;
  @Exclude() private readonly _data: T | null = null;
  @Exclude() private readonly _error: AdminApiErrorMessage | null = null;

  private constructor(_result: AdminApiResponseResultCodeUnion, _data: T | null = null, _error: AdminApiErrorMessage | null = null) {
    this._result = _result;
    this._data = _data;
    this._error = _error;
  }

  @ApiProperty({ enum: adminApiResponseResultCodeList })
  @Expose()
  get result(): AdminApiResponseResultCodeUnion {
    return this._result;
  }

  @ApiProperty()
  @Expose()
  get data(): T | null {
    return this._data;
  }

  @ApiProperty({
    type: AdminApiErrorMessage,
    nullable: true,
  })
  @Expose()
  get error(): AdminApiErrorMessage | null {
    return this._error;
  }

  static success(): AdminApiResponse<null> {
    return new AdminApiResponse('SUCCESS', null, null);
  }

  static successWithData<SuccessData>(data: SuccessData): AdminApiResponse<SuccessData> {
    return new AdminApiResponse('SUCCESS', data, null);
  }

  static error(traceId: string, errorCode: string, errorMessage: string, errorData?: unknown): AdminApiResponse<null> {
    return new AdminApiResponse('ERROR', null, AdminApiErrorMessage.of(traceId, errorCode, errorMessage, errorData));
  }
}
