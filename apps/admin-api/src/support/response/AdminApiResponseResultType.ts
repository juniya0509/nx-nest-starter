import { Enum, EnumConstNames, EnumType } from 'ts-jenum';

@Enum('code')
export class AdminApiResponseResultType extends EnumType<AdminApiResponseResultType>() {
  static readonly SUCCESS = new AdminApiResponseResultType('SUCCESS');
  static readonly ERROR = new AdminApiResponseResultType('ERROR');

  private constructor(readonly _code: string) {
    super();
  }

  get code(): string {
    return this._code;
  }
}

export const adminApiResponseResultCodeList = AdminApiResponseResultType.keys();
export type AdminApiResponseResultCodeUnion = EnumConstNames<typeof AdminApiResponseResultType>;
