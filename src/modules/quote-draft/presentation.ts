import type { AreaDisplayUnit } from "@/modules/firm-lists/domain/area-unit";
import {
  decimalToString,
  quantity,
  rescale,
  unitRate,
  divide,
  decimalFromString,
} from "@/modules/finance/fixed-decimal";
import { formatMoney } from "@/modules/finance/format-money";

/** Presentation only: the recorded rate keeps its six exact decimal places. */
export function formatQuoteRate(
  rate: string,
  currency: string,
  unit: AreaDisplayUnit = "m2",
): string {
  const value = unitRate(rate);
  const displayed =
    unit === "m2"
      ? value
      : divide({ ...value, atoms: value.atoms * 400n }, decimalFromString("121", 0), 12, "HALF_UP");
  return formatMoney(decimalToString(rescale(displayed, 0, "HALF_UP")), currency);
}

export function formatQuoteArea(area: string): string {
  return decimalToString(quantity(area)).replace(/\.?0+$/, "");
}
