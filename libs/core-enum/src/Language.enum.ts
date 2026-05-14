import { Enum, EnumConstNames, EnumType } from 'ts-jenum';

@Enum('code')
export class Language extends EnumType<Language>() {
  static readonly 'en-US' = new Language('en-US', 'English');
  static readonly ko = new Language('ko', '한국어');
  static readonly fr = new Language('fr', 'Français');
  static readonly es = new Language('es', 'Español');
  static readonly de = new Language('de', 'Deutsch');
  static readonly ja = new Language('ja', '日本語');
  static readonly ms = new Language('ms', 'Bahasa Melayu');

  private constructor(
    readonly _code: string,
    readonly _name: string,
  ) {
    super();
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }
}

export const languageCodeList = Language.keys();

export type LanguageCodeUnion = EnumConstNames<typeof Language>;
