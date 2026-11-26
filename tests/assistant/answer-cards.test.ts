import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AnswerText } from "@/components/assistant/answer-text";
import { AnswerFactRegistry } from "@/modules/assistant/domain/fact-answers";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
vi.stubGlobal("React", React);
const quote = (key: string): AssistantSource => ({
  sourceId: key,
  label: `Job ${key}`,
  href: `/zh-TW/projects/${key}/quote`,
  projectKeys: [key],
  display: { kind: "QUOTE", title: `Job ${key}`, reference: key },
  facts: {
    name: `Job ${key}`,
    reference: key,
    documentNumber: `${key}-Q1`,
    validUntil: "2026-12-22",
    status: "Issued",
    acceptedOn: "Not accepted yet",
    amounts: { totalAmount: "NT$6,720,000" },
  },
});
const render = (locale: "en" | "zh-TW", sources: AssistantSource[], ...refs: string[]) => {
  const registry = new AnswerFactRegistry(locale);
  registry.register(sources);
  const result = registry.render({
    parts: [{ say: "RECORDS_SHOW" }, ...refs.map((show) => ({ show }))],
    followUps: [],
  });
  if (result.kind !== "ACCEPTED") throw Error(result.kind);
  const html = renderToStaticMarkup(
    React.createElement(AnswerText, {
      text: result.answer.text,
      facts: true,
      presentation: result.answer.presentation,
    }),
  );
  return { ...result, html };
};
describe("server-built record cards", () => {
  it.each(["en", "zh-TW"] as const)(
    "renders two labeled records with page labels, description lists and one link each in %s",
    (locale) => {
      const out = render(
        locale,
        [quote("A"), quote("B")],
        "s1.name",
        "s1.amounts.totalAmount",
        "s2.amounts.totalAmount",
      );
      expect(out.html.match(/<section /g)).toHaveLength(2);
      expect(out.html.match(/aria-labelledby=/g)).toHaveLength(2);
      expect(out.html.match(/<dl /g)).toHaveLength(2);
      expect(out.html.match(/<a /g)).toHaveLength(2);
      expect(out.html).toContain("<strong>NT$6,720,000</strong>");
      expect(out.html).toContain(locale === "en" ? "Total including tax" : "含稅總計");
      expect(out.html).not.toMatch(/Here is what|紀錄顯示/);
      expect(out.answer.text).toMatch(/Here is what|紀錄顯示/);
      expect(out.html).toContain("/zh-TW/projects/A/quote");
    },
  );
  it("deduplicates a record from another tool when it already belongs to the list and shows only the mirrored page fields", () => {
    const count: AssistantSource = {
      sourceId: "count",
      label: "等待客戶回覆的報價",
      href: "/zh-TW/quotes",
      projectKeys: ["A"],
      display: { kind: "AWAITING_LIST", title: "等待客戶回覆的報價" },
      facts: { count: 1, appliedStageGroup: "所有階段群組" },
    };
    const out = render(
      "zh-TW",
      [
        { ...quote("A"), countSourceId: "count" },
        count,
        { ...quote("A"), sourceId: "different-tool" },
      ],
      "s3.amounts.totalAmount",
      "s2.list",
    );
    expect(out.html.match(/<section /g)).toHaveLength(1);
    expect(out.html.match(/Job A/g)).toHaveLength(1);
    expect(out.html).toContain("A-Q1");
    expect(out.html).toContain("2026-12-22");
    expect(out.html).not.toMatch(/Issued|Not accepted|6,720|階段群組/);
  });
  it("keeps an item price and its client price with quieter provenance, with no repeated metadata rows", () => {
    const out = render(
      "zh-TW",
      [
        {
          ...quote("A"),
          display: { kind: "ITEM_PRICE", title: "天花板", unit: "坪" },
          facts: {
            description: "天花板",
            unit: "坪",
            lastPrice: "NT$3,800",
            lastQuoted: "2026-11-25",
            timesQuoted: 2,
            documentNumber: "A-Q1",
            clientLastPrice: "NT$3,500",
            clientLastQuoted: "2026-11-20",
            clientDocumentNumber: "B-Q1",
          },
        },
      ],
      "s1.lastPrice",
      "s1.clientLastPrice",
    );
    expect(out.html).toContain("每坪");
    expect(out.html).toContain("開啟價格表");
    expect(out.html.match(/<dt>/g)).toHaveLength(2);
    expect(out.html.match(/<small /g)).toHaveLength(2);
    expect(out.html.match(/報價單號/g)).toHaveLength(2);
    for (const value of ["NT$3,800", "NT$3,500", "2026-11-25", "2026-11-20", "A-Q1", "B-Q1"])
      expect(out.html).toContain(value);
  });
  it.each(["s1.list", "s1.count"])(
    "renders an empty list as a plain sentence without a card or link: %s",
    (ref) => {
      const out = render(
        "zh-TW",
        [
          {
            ...quote("A"),
            projectKeys: [],
            display: { kind: "AWAITING_LIST", title: "等待客戶回覆的報價" },
            facts: { count: 0 },
          },
        ],
        ref,
      );
      expect(out.html).toContain("目前沒有等待客戶回覆的報價。");
      expect(out.html).not.toMatch(/<section|<a |<dl/);
    },
  );
  it("keeps refusals plain and renders older stored text as before", () => {
    const refusal = renderToStaticMarkup(
      React.createElement(AnswerText, { text: "沒有可用紀錄。", facts: false }),
    );
    expect(refusal).not.toMatch(/<section|<dl/);
    const older = renderToStaticMarkup(
      React.createElement(AnswerText, {
        text: "紀錄顯示：\n\n專案 A\n含稅總計：NT$100",
        facts: true,
      }),
    );
    expect(older).toContain("紀錄顯示：");
    expect(older).toContain("<strong>專案 A</strong>");
    expect(older).toContain("含稅總計：NT$100");
  });
  it.each(["quotedPrice", "reconciledActualCost", "overallDifference"])(
    "bundles the full closed-job reading when %s is selected",
    (field) => {
      const out = render(
        "en",
        [
          {
            ...quote("A"),
            facts: {
              quotedPrice: "NT$100",
              reconciledActualCost: "NT$90",
              overallDifference: "Actual cost is NT$10 below the quote.",
            },
          },
        ],
        `s1.${field}`,
      );
      expect(out.html.match(/<dt>/g)).toHaveLength(3);
      for (const value of ["NT$100", "NT$90", "Actual cost is NT$10 below the quote."])
        expect(out.html).toContain(value);
    },
  );
});

describe("layout overflow never discards valid selections", () => {
  it.each(["en", "zh-TW"] as const)(
    "keeps the first twelve printed rows in model order in %s",
    (locale) => {
      const sources = [
        {
          ...quote("A"),
          facts: { findings: Array.from({ length: 11 }, (_, i) => ({ text: `Fact A ${i}` })) },
        },
        { ...quote("B"), facts: { findings: [{ text: "Fact B 0" }, { text: "Fact B 1" }] } },
      ];
      const refs = [
        "s2.findings.0.text",
        ...Array.from({ length: 11 }, (_, i) => `s1.findings.${i}.text`),
        "s2.findings.1.text",
      ];
      const out = render(locale, sources, ...refs);
      const cards = out.answer.presentation!.blocks.filter((b) => b.kind === "CARD");
      expect(cards.flatMap((c) => c.rows)).toHaveLength(12);
      expect(cards.map((c) => c.title)).toEqual(["Job B", "Job A"]);
      expect(cards[0]!.rows.map((r) => r.value)).toEqual(["Fact B 0"]);
      expect(cards[1]!.rows.map((r) => r.value)).toEqual(
        Array.from({ length: 11 }, (_, i) => `Fact A ${i}`),
      );
      const remaining = locale === "en" ? "1 more fact." : "另有 1 項。";
      expect(cards[0]!.remaining).toBe(remaining);
      expect(cards[1]!.remaining).toBeUndefined();
      expect(out.html).toMatch(
        new RegExp(`<footer[^>]*><span[^>]*>${remaining.replace(".", "\\.")}</span><a `),
      );
      expect(out.html).not.toContain("Fact B 1");
      expect(out.answer.text).toContain(remaining);
      expect(out.selection.shown).toHaveLength(13);
      const registry = new AnswerFactRegistry(locale);
      registry.register(sources);
      expect(
        registry.render({
          parts: [
            { say: "RECORDS_SHOW" },
            ...refs.slice(0, 12).map((show) => ({ show })),
            { show: "s2.unknown" },
          ],
          followUps: [],
        }),
      ).toMatchObject({ reason: "UNKNOWN_REFERENCE" });
    },
  );
  it("counts expanded closed readings, with heading-only references taking no rows", () => {
    const sources = Array.from({ length: 5 }, (_, i) => ({
      ...quote(String(i)),
      facts: {
        name: `Job ${i}`,
        reference: String(i),
        quotedPrice: `NT$${100 + i}`,
        reconciledActualCost: `NT$${90 + i}`,
        overallDifference: `Difference ${i}`,
      },
    }));
    const out = render(
      "en",
      sources,
      "s1.name",
      "s1.reference",
      ...sources.map((_, i) => `s${i + 1}.quotedPrice`),
    );
    const cards = out.answer.presentation!.blocks.filter((b) => b.kind === "CARD");
    expect(cards.map((c) => c.rows.length)).toEqual([3, 3, 3, 3, 0]);
    expect(cards[4]!.remaining).toBe("3 more facts.");
    expect(out.html).not.toContain("NT$104");
    expect(out.html).toContain("Job 4");
  });
  it.each(["en", "zh-TW"] as const)(
    "prints only the first selected list in full in %s",
    (locale) => {
      const first = {
        ...quote("first"),
        projectKeys: [],
        display: { kind: "JOB_LIST" as const, title: "First list" },
        facts: { count: 12 },
      };
      const second = {
        ...quote("second"),
        projectKeys: [],
        display: { kind: "JOB_LIST" as const, title: "Second list" },
        facts: { count: 1 },
      };
      const empty = {
        ...quote("empty"),
        projectKeys: [],
        display: { kind: "JOB_LIST" as const, title: "Empty list" },
        facts: { count: 0 },
      };
      const children = Array.from({ length: 12 }, (_, i) => ({
        ...quote(`F${i}`),
        countSourceId: "first",
        facts: { stage: "Construction" },
      }));
      const child = { ...quote("S"), countSourceId: "second" };
      const out = render(
        locale,
        [first, second, empty, ...children, child],
        "s1.list",
        "s2.list",
        "s3.list",
        "s16.status",
      );
      const cards = out.answer.presentation!.blocks.filter((b) => b.kind === "CARD");
      expect(cards.map((c) => c.title)).toEqual([
        "First list",
        "Second list",
        "Empty list",
        "Job S",
      ]);
      expect(cards[0]!.list!.rows).toHaveLength(10);
      expect(cards[0]!.list!.remaining).toBe(locale === "en" ? "2 more records." : "另有 2 筆。");
      expect(cards[1]!.list).toMatchObject({ count: 1, rows: [], remaining: null });
      expect(cards[2]!.list).toMatchObject({ count: 0, rows: [], remaining: null });
      expect(cards[3]!.rows[0]!.value).toBe("Issued");
      expect(out.html.match(/<ul /g)).toHaveLength(1);
      expect(out.html.match(/<a /g)).toHaveLength(4);
    },
  );
});
