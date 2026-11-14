import { describe, expect, it } from "vitest";

import {
  add,
  calculateLineAmount,
  decimalFromString,
  decimalToString,
  divide,
  lineReconciles,
  median,
  money,
  multiply,
  quantity,
  rescale,
  unitRate,
  variancePercent,
  withinTolerance,
} from "@/modules/finance/fixed-decimal";

describe("fixed-decimal financial arithmetic", () => {
  it("parses and formats exact decimal strings without binary floating point", () => {
    expect(decimalToString(money("16480000"))).toBe("16480000.00");
    expect(decimalToString(quantity("640.125"))).toBe("640.125");
    expect(decimalToString(unitRate("19765.625"))).toBe("19765.625000");
  });

  it("rejects input precision that exceeds the declared scale", () => {
    expect(() => decimalFromString("1.001", 2)).toThrow(/fractional digits/);
    expect(() => decimalFromString("NT$1", 2)).toThrow(/Invalid decimal string/);
  });

  it("rounds line amounts half-up to TWD cents", () => {
    const result = calculateLineAmount(quantity("3.000"), unitRate("10.005000"));
    expect(decimalToString(result)).toBe("30.02");
  });

  it("supports exact addition, multiplication, division, and rescaling", () => {
    expect(decimalToString(add(money("10.25"), money("2.75")))).toBe("13.00");
    expect(
      decimalToString(
        multiply(decimalFromString("12.5000", 4), decimalFromString("8", 0), 2),
      ),
    ).toBe("100.00");
    expect(
      decimalToString(divide(money("10.00"), money("4.00"), 4)),
    ).toBe("2.5000");
    expect(decimalToString(rescale(decimalFromString("1.235", 3), 2))).toBe(
      "1.24",
    );
  });

  it("uses a deterministic half-up median for odd and even samples", () => {
    const odd = median([money("10.00"), money("30.00"), money("20.00")], 2);
    const even = median(
      [money("10.00"), money("11.00"), money("20.00"), money("21.00")],
      2,
    );
    expect(odd && decimalToString(odd)).toBe("20.00");
    expect(even && decimalToString(even)).toBe("15.50");
  });

  it("calculates exact percentage variance with a shared display scale", () => {
    expect(
      decimalToString(variancePercent(money("118.00"), money("100.00"), 4)),
    ).toBe("18.0000");
    expect(
      decimalToString(variancePercent(money("95.00"), money("100.00"), 4)),
    ).toBe("-5.0000");
  });

  it("reconciles quantity × unit rate using an explicit tolerance", () => {
    expect(
      lineReconciles(quantity("2.000"), unitRate("50.000000"), money("100.00")),
    ).toBe(true);
    expect(
      lineReconciles(quantity("2.000"), unitRate("50.000000"), money("100.02")),
    ).toBe(false);
    expect(withinTolerance(money("100.00"), money("100.01"), money("0.01"))).toBe(
      true,
    );
  });
});
