import { decimalToString, quantity, rescale, unitRate } from "@/modules/finance/fixed-decimal";
import { formatMoney } from "@/modules/finance/format-money";

/** Presentation only: the recorded rate keeps its six exact decimal places. */
export function formatQuoteRate(rate: string, currency: string): string {
  return formatMoney(decimalToString(rescale(unitRate(rate), 0, "HALF_UP")), currency);
}

export function formatQuoteArea(area: string): string {
  return decimalToString(quantity(area)).replace(/\.?0+$/, "");
}
