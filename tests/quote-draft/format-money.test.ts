import { expect, it } from "vitest";
import { formatMoney } from "@/modules/finance/format-money";
it("formats money identically for Home, overview and Quote without floating point", () => {
  expect(formatMoney("6400000.00", "TWD")).toBe("NT$6,400,000");
  expect(formatMoney("9007199254740992.01", "TWD")).toBe("NT$9,007,199,254,740,992.01");
  expect(formatMoney("0.00", "TWD")).toBe("NT$0");
});
