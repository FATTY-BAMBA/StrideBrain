import { expect, it, vi } from "vitest";
const money = vi.hoisted(() => ({ text: "NT$100 $& $$ $` $'" }));
vi.mock("@/modules/finance/format-money", () => ({ formatMoney: () => money.text }));
import { closedDifferenceText } from "@/modules/home-desk/presentation";
it.each(["en", "zh-TW"] as const)(
  "inserts formatted money literally, including replacement-pattern characters (%s)",
  (locale) => {
    const text = closedDifferenceText(
      {
        amount: "100.00",
        absoluteAmount: "100.00",
        basisPoints: "1000",
        percentOfQuote: "10.0",
        direction: "BELOW",
      },
      "TWD",
      locale,
    );
    expect(text).toBe(
      locale === "en"
        ? `Actual cost was ${money.text} below the quote (10.0% of the quote).`
        : `實際成本比報價低 ${money.text}（報價的 10.0%）`,
    );
  },
);
