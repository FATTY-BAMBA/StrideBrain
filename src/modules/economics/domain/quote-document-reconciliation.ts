import {
  add,
  compare,
  decimalFromString,
  divide,
  money,
  multiply,
  rescale,
  subtract,
  sum,
} from "@/modules/finance/fixed-decimal";
import type { FinancialObservationRecord } from "./contracts";
/** Check document facts independently at the observation boundary; never trust their stored total. */
export function quoteDocumentReconciliation(record: FinancialObservationRecord): {
  lineFailure: boolean;
  totalFailure: boolean;
} {
  if (
    !record.quoteDocument ||
    record.observationType !== "QUOTED_PRICE" ||
    record.subjectType !== "QUOTE_VERSION"
  )
    return { lineFailure: true, totalFailure: true };
  try {
    const base = sum(
      record.lines
        .filter((line) => line.quoteCalculation?.kind === "ITEM")
        .map((line) => money(line.amount)),
      2,
    );
    let total = money("0"),
      lineFailure = false;
    for (const line of record.lines) {
      const calculation = line.quoteCalculation,
        quantity = decimalFromString(line.quantity, 3),
        rate = decimalFromString(line.unitRate, 6),
        amount = money(line.amount);
      if (
        !calculation ||
        line.subjectType !== "QUOTE_ITEM" ||
        amount.atoms < 0n ||
        quantity.atoms < 0n ||
        rate.atoms < 0n
      ) {
        lineFailure = true;
        continue;
      }
      const percentage =
        calculation.kind === "PERCENTAGE"
          ? decimalFromString(calculation.percentage ?? "", 2)
          : null;
      if (percentage && (percentage.atoms < 0n || quantity.atoms !== 0n || rate.atoms !== 0n))
        lineFailure = true;
      const expected = percentage
        ? multiply(base, divide(percentage, decimalFromString("100", 0), 4), 0, "HALF_UP")
        : multiply(quantity, rate, 0, "HALF_UP");
      if (compare(expected, amount) !== 0) lineFailure = true;
      total = add(total, amount);
    }
    const discount = money(record.quoteDocument.discountAmount);
    const discountInvalid =
      discount.atoms < 0n ||
      compare(discount, total) > 0 ||
      compare(discount, rescale(discount, 0)) !== 0;
    return {
      lineFailure,
      totalFailure:
        discountInvalid || compare(subtract(total, discount), money(record.totalAmount)) !== 0,
    };
  } catch {
    return { lineFailure: true, totalFailure: true };
  }
}
