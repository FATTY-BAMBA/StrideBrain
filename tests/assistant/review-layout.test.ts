import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AnswerText } from "@/components/assistant/answer-text";
import { AnswerFactRegistry } from "@/modules/assistant/domain/fact-answers";
import { quoteDocumentCopy } from "@/modules/localization/quote-document";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
vi.stubGlobal("React", React);
const row: AssistantSource = {
  sourceId: "item",
  label: "天花板（坪）",
  href: "/zh-TW/quotes/prices",
  projectKeys: ["J"],
  countSourceId: "count",
  facts: {
    description: "天花板",
    unit: "坪",
    lastPrice: "NT$3,800",
    lastQuoted: "2026-11-25",
    timesQuoted: 2,
    documentNumber: "J-Q2",
    clientLastPrice: "NT$3,500",
    clientLastQuoted: "2026-11-20",
    clientDocumentNumber: "J-Q1",
  },
};
const count: AssistantSource = {
  sourceId: "count",
  label: "價格表",
  href: "/zh-TW/quotes/prices",
  projectKeys: ["J"],
  facts: { count: 1 },
};
const select = (...refs: string[]) => ({
  parts: [{ say: "RECORDS_SHOW" }, ...refs.map((show) => ({ show }))],
  followUps: [],
});
describe("PR80 hosted layout regressions", () => {
  it.each(["en", "zh-TW"] as const)(
    "keeps item prices with their page provenance in %s",
    (locale) => {
      const registry = new AnswerFactRegistry(locale);
      registry.register([row, count]);
      const out = registry.render(
        select("s1.lastPrice", "s1.clientLastPrice", "s1.description", "s1.unit"),
      );
      expect(out.kind).toBe("ACCEPTED");
      if (out.kind !== "ACCEPTED") return;
      for (const text of [
        "天花板（坪）",
        "NT$3,800",
        "2026-11-25",
        "J-Q2",
        "NT$3,500",
        "2026-11-20",
        "J-Q1",
      ])
        expect(out.answer.text).toContain(text);
      expect(out.answer.text).toContain(locale === "en" ? "Times quoted: 2" : "報價次數：2");
      expect(out.answer.text).not.toMatch(/(?:Item:|Unit:|項目：|單位：)/);
      const withExplicitDates = registry.render(
        select("s1.lastPrice", "s1.lastQuoted", "s1.documentNumber"),
      );
      expect(
        withExplicitDates.kind === "ACCEPTED" && withExplicitDates.answer.text.match(/2026-11-25/g),
      ).toHaveLength(1);
    },
  );
  it.each([true, false])(
    "drops row facts covered by a list regardless of order (%s)",
    (listFirst) => {
      const registry = new AnswerFactRegistry("zh-TW");
      registry.register([row, count]);
      const refs = ["s1.lastPrice", "s1.clientLastPrice", "s2.count"];
      const out = registry.render(
        select(...(listFirst ? ["s2.list", ...refs] : [...refs, "s2.list"])),
      );
      expect(out.kind).toBe("ACCEPTED");
      if (out.kind !== "ACCEPTED") return;
      expect(out.answer.text.match(/NT\$3,800/g)).toHaveLength(1);
      expect(out.answer.text.match(/天花板（坪）/g)).toHaveLength(1);
      expect(out.answer.text.match(/紀錄筆數/g)).toHaveLength(1);
    },
  );
  it.each(["en", "zh-TW"] as const)(
    "uses the Quote page’s tax labels and hides heading-only identity in %s",
    (locale) => {
      const registry = new AnswerFactRegistry(locale);
      registry.register([
        {
          ...row,
          label: "信義旗艦店裝修 · PRJ-XINYI-026",
          facts: {
            name: "信義旗艦店裝修",
            reference: "PRJ-XINYI-026",
            amounts: { totalAmount: "NT$17,304,000", taxAmount: "NT$824,000" },
          },
        },
      ]);
      const out = registry.render(
        select("s1.name", "s1.reference", "s1.amounts.totalAmount", "s1.amounts.taxAmount"),
      );
      expect(out.kind).toBe("ACCEPTED");
      if (out.kind !== "ACCEPTED") return;
      expect(out.answer.text).toContain(quoteDocumentCopy(locale).total);
      expect(out.answer.text).toContain(quoteDocumentCopy(locale).tax);
      expect(out.answer.text.match(/PRJ-XINYI-026/g)).toHaveLength(1);
      expect(out.answer.text).not.toMatch(/Job name:|Job reference:|專案名稱：|專案編號：/);
    },
  );
  it("renders distinct accessible record sections and strong headings, while escaping record text", () => {
    const text =
      "紀錄顯示：\n\n專案一 · J-1\n含稅總計：NT$100\n\n<script>專案二</script> · J-2\n含稅總計：NT$200";
    const html = renderToStaticMarkup(React.createElement(AnswerText, { text, facts: true }));
    expect(html.match(/<section /g)).toHaveLength(2);
    expect(html).toContain("<strong>專案一 · J-1</strong>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
