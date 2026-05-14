import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorMessage {
  @ApiProperty()
  readonly traceId: string;

  @ApiProperty()
  readonly code: string;

  @ApiProperty()
  readonly message: string;

  @ApiProperty({ required: false, nullable: true })
  readonly data?: unknown;

  private constructor(traceId: string, code: string, message: string, data?: unknown) {
    this.traceId = traceId;
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static of(traceId: string, code: string, message: string, data?: unknown): ApiErrorMessage {
    return new ApiErrorMessage(traceId, code, message, data);
  }
}
