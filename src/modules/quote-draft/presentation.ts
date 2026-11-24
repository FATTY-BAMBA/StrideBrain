import {
  pricePerAreaInFirmUnit,
  type AreaDisplayUnit,
} from "@/modules/firm-lists/domain/area-unit";
import { decimalToString, quantity, rescale } from "@/modules/finance/fixed-decimal";
import { formatMoney } from "@/modules/finance/format-money";

/** Exact rate display without a currency prefix, for labelled evidence traces. */
export function formatAreaRateNumber(rate: string, unit: AreaDisplayUnit): string {
  const decimal = decimalToString(rescale(pricePerAreaInFirmUnit(rate, unit), 2, "HALF_UP"));
  const [whole = "0", fraction = ""] = decimal.split(".");
  const tail = fraction.replace(/0+$/, "");
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (tail ? `.${tail}` : "");
}

/** Presentation only: the recorded rate keeps its six exact decimal places. */
export function formatQuoteRate(
  rate: string,
  currency: string,
  unit: AreaDisplayUnit = "m2",
): string {
  const displayed = pricePerAreaInFirmUnit(rate, unit);
  return formatMoney(decimalToString(rescale(displayed, 0, "HALF_UP")), currency);
}

export function formatQuoteArea(area: string): string {
  return decimalToString(quantity(area)).replace(/\.?0+$/, "");
}
