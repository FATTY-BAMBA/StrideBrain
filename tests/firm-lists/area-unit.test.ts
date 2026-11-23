import { describe, expect, it } from "vitest";
import { areaInFirmUnit, areaToSquareMetres } from "@/modules/firm-lists/domain/area-unit";

describe("firm area unit", () => {
  it("converts by the exact 400/121 ratio and stores three decimal places", () => {
    expect(areaToSquareMetres("100", "ping")).toBe("330.579");
    expect(areaInFirmUnit("330.579", "ping")).toBe("100");
    expect(areaToSquareMetres("121", "ping")).toBe("400.000");
    expect(areaToSquareMetres("85", "m2")).toBe("85.000");
  });
  it("rounds half up to at most two display decimals without trailing zeros", () => {
    expect(areaInFirmUnit("640.000", "ping")).toBe("193.6");
    expect(areaInFirmUnit("85.000", "ping")).toBe("25.71");
    expect(areaInFirmUnit("640.505", "m2")).toBe("640.51");
    expect(areaInFirmUnit("640.500", "m2")).toBe("640.5");
    expect(areaInFirmUnit("100.000", "m2")).toBe("100");
    expect(areaInFirmUnit("0.001", "m2")).toBe("0");
  });
  it.each(["0", "-1", "1e3", "1.0001", "NaN", "9999999999999999", "1,000"])(
    "rejects invalid input %s",
    (digits) => {
      expect(areaToSquareMetres(digits, "ping")).toBeNull();
    },
  );
  it("rejects overflow after conversion", () => {
    expect(areaToSquareMetres("999999999999999", "ping")).toBeNull();
  });
});
