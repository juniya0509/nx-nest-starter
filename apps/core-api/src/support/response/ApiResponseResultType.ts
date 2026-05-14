import { Enum, EnumConstNames, EnumType } from 'ts-jenum';

@Enum('code')
export class ApiResponseResultType extends EnumType<ApiResponseResultType>() {
  static readonly SUCCESS = new ApiResponseResultType('SUCCESS');
  static readonly ERROR = new ApiResponseResultType('ERROR');

  private constructor(readonly _code: string) {
    super();
  }

  get code(): string {
    return this._code;
  }
}

export const apiResponseResultCodeList = ApiResponseResultType.keys();
export type ApiResponseResultCodeUnion = EnumConstNames<typeof ApiResponseResultType>;
