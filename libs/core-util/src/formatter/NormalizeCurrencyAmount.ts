import Decimal from 'decimal.js';

import { Currency, CurrencyCodeUnion } from '@libs/core-enum/src/Currency.enum';

const normalizeCurrencyAmount = (currencyCode: CurrencyCodeUnion, amount: number) => {
  const { decimalPlaces } = Currency.valueOf(currencyCode) as Currency;
  return new Decimal(amount).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP).toNumber();
};

export default normalizeCurrencyAmount;
