import { Enum, EnumType } from 'ts-jenum';

@Enum('code')
export class BatchError extends EnumType<BatchError>() {
  static readonly DEFAULT_ERROR = new BatchError('DEFAULT_ERROR', 'batch 작업 중 알 수 없는 오류');
  static readonly JOB_FAILED = new BatchError('JOB_FAILED', 'batch job 실행 실패');

  private constructor(
    readonly _code: string,
    readonly _summary: string,
  ) {
    super();
  }

  get code(): string {
    return this._code;
  }

  get summary(): string {
    return this._summary;
  }

  get source(): 'Batch' {
    return 'Batch';
  }
}
