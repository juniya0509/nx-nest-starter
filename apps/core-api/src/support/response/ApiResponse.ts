import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { ApiErrorMessage } from './ApiErrorMessage';
import { apiResponseResultCodeList, ApiResponseResultCodeUnion } from './ApiResponseResultType';

export class ApiResponse<T> {
  @Exclude() private readonly _result: ApiResponseResultCodeUnion;
  @Exclude() private readonly _data: T | null = null;
  @Exclude() private readonly _error: ApiErrorMessage | null = null;

  private constructor(_result: ApiResponseResultCodeUnion, _data: T | null = null, _error: ApiErrorMessage | null = null) {
    this._result = _result;
    this._data = _data;
    this._error = _error;
  }

  @ApiProperty({ enum: apiResponseResultCodeList })
  @Expose()
  get result(): ApiResponseResultCodeUnion {
    return this._result;
  }

  @ApiProperty()
  @Expose()
  get data(): T | null {
    return this._data;
  }

  @ApiProperty({
    type: ApiErrorMessage,
    nullable: true,
  })
  @Expose()
  get error(): ApiErrorMessage | null {
    return this._error;
  }

  static success(): ApiResponse<null> {
    return new ApiResponse('SUCCESS', null, null);
  }

  static successWithData<SuccessData>(data: SuccessData): ApiResponse<SuccessData> {
    return new ApiResponse('SUCCESS', data, null);
  }

  static error(traceId: string, errorCode: string, errorMessage: string, errorData?: unknown): ApiResponse<null> {
    return new ApiResponse('ERROR', null, ApiErrorMessage.of(traceId, errorCode, errorMessage, errorData));
  }
}
