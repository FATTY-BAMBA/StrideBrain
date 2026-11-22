import { add, decimalFromString, decimalToString, money, multiply, sum } from "./fixed-decimal";

export const TAIWAN_BUSINESS_TAX_RATE = "0.05";
export type QuoteTotals = Readonly<{
  amountBeforeTax: string;
  taxAmount: string;
  totalAmount: string;
}>;

export function quoteTotals(amounts: readonly string[]): QuoteTotals {
  const beforeTax = sum(amounts.map(money), 2);
  const tax = multiply(beforeTax, decimalFromString(TAIWAN_BUSINESS_TAX_RATE, 2), 2);
  return {
    amountBeforeTax: decimalToString(beforeTax),
    taxAmount: decimalToString(tax),
    totalAmount: decimalToString(add(beforeTax, tax)),
  };
}
