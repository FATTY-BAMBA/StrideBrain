import { expect, it } from "vitest";
import { formatMoney } from "@/modules/finance/format-money";
import { formatQuoteArea, formatQuoteRate } from "@/modules/quote-draft/presentation";
it("rounds displayed rates half up without floats and trims only fractional area zeros", () => {
  expect(formatQuoteRate("5833.333333", "TWD")).toBe("NT$5,833");
  expect(formatQuoteRate("5833.500000", "TWD")).toBe("NT$5,834");
  expect(formatQuoteRate("9007199254740993.500000", "TWD")).toBe("NT$9,007,199,254,740,994");
  expect(formatQuoteArea("641.000")).toBe("641");
  expect(formatQuoteArea("641.500")).toBe("641.5");
  expect(formatQuoteArea("100.000")).toBe("100");
  expect(formatQuoteArea("0.010")).toBe("0.01");
});
it("formats money identically for Home, overview and Quote without floating point", () => {
  expect(formatMoney("6400000.00", "TWD")).toBe("NT$6,400,000");
  expect(formatMoney("9007199254740992.01", "TWD")).toBe("NT$9,007,199,254,740,992.01");
  expect(formatMoney("0.00", "TWD")).toBe("NT$0");
});
