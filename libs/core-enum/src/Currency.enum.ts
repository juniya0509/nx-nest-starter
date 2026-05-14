import { Enum, EnumConstNames, EnumType } from 'ts-jenum';

@Enum('code')
export class Currency extends EnumType<Currency>() {
  static readonly KRW = new Currency('KRW', '₩', 0);
  static readonly USD = new Currency('USD', '$', 2);
  static readonly EUR = new Currency('EUR', '€', 2);
  static readonly JPY = new Currency('JPY', '¥', 0);
  // static readonly SGD = new Currency('SGD', 'S$', 2);
  // static readonly MYR = new Currency('MYR', 'RM', 2);
  // static readonly HKD = new Currency('HKD', 'HK$', 2);
  // static readonly IDR = new Currency('IDR', 'Rp', 2);
  // static readonly TWD = new Currency('TWD', 'NT$', 2);
  // static readonly GBP = new Currency('GBP', '£', 2);
  // static readonly CAD = new Currency('CAD', 'C$', 2);
  // static readonly AUD = new Currency('AUD', 'A$', 2);
  // static readonly MXN = new Currency('MXN', 'MX$', 2);
  // static readonly CHF = new Currency('CHF', 'SFr', 2);
  // static readonly DKK = new Currency('DKK', 'kr', 2);
  // static readonly BGN = new Currency('BGN', 'лв', 2);
  // static readonly CZK = new Currency('CZK', 'Kč', 2);
  // static readonly HUF = new Currency('HUF', 'Ft', 2);
  // static readonly PLN = new Currency('PLN', 'zł', 2);
  // static readonly RON = new Currency('RON', 'lei', 2);

  private constructor(
    readonly _code: string,
    readonly _symbol: string,
    readonly _decimalPlaces: number,
  ) {
    super();
  }

  get code(): string {
    return this._code;
  }

  get symbol(): string {
    return this._symbol;
  }

  get decimalPlaces(): number {
    return this._decimalPlaces;
  }
}

export const currencyCodeList = Currency.keys();

export type CurrencyCodeUnion = EnumConstNames<typeof Currency>;
