import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/modules/assistant/domain/grounding";
import { labelledFacts } from "@/modules/assistant/domain/display-facts";
import { assistantFactCopy, assistantFactLabels } from "@/modules/localization/assistant";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
import paidFixtures from "./sb060-rejected-answer-fixtures.json";

const source: AssistantSource = {
  sourceId: "quote",
  href: "/en/projects/PRJ-ACTIVE-001/quote",
  label: "PRJ-ACTIVE-001",
  projectKeys: ["PRJ-ACTIVE-001"],
  facts: {
    amounts: {
      amountBeforeTax: "NT$11,110,200",
      taxAmount: "NT$555,510",
      totalAmount: "NT$11,665,710",
    },
  },
  typedFactPaths: ["amounts"],
};
const answer = (text: string) => ({ text, sourceIds: [source.sourceId], followUps: [] });
const check = (text: string, locale: "en" | "zh-TW" = "en", cited = source) =>
  checkAnswer(answer(text), [cited], locale);

describe("SB-060 amount-label order", () => {
  it("accepts the exact discarded paid answer without changing its amounts", () => {
    const text = paidFixtures.find((f) => f.id === "en-home-reference-total")!.text;
    const quoted = {
      ...source,
      facts: {
        amounts: {
          amountBeforeTax: "NT$11,110,000",
          taxAmount: "NT$555,500",
          totalAmount: "NT$11,665,500",
        },
      },
    };
    expect(check(text, "en", quoted)).toMatchObject({ kind: "ACCEPTED", answer: { text } });
  });
  it.each([
    ["with NT$555,510 tax and NT$11,110,200 before tax", "en"],
    ["Tax NT$555,510 and NT$11,110,200 before tax", "en"],
    ["NT$555,510 tax and NT$11,110,200 before tax and NT$11,665,710 total", "en"],
    ["Total NT$11,665,710 (with NT$555,510 tax and NT$11,110,200 before tax)", "en"],
    ["Tax NT$555,510 and amount before tax NT$11,110,200; NT$11,665,710 total", "en"],
    ["NT$555,510 營業稅及 NT$11,110,200 未稅金額", "zh-TW"],
    ["總額 NT$11,665,710（NT$555,510 稅額及 NT$11,110,200 未稅金額）", "zh-TW"],
  ] as const)("accepts each amount's label in its clause: %s", (text, locale) => {
    expect(check(text, locale)).toMatchObject({ kind: "ACCEPTED", answer: { text } });
  });
  it.each([
    ["總額 NT$11,665,710（含稅 NT$11,110,200，稅額 NT$555,510）", "zh-TW"],
    ["PRJ-ACTIVE-001 的未稅金額為 NT$11,665,710。", "zh-TW"],
    ["營業稅 NT$11,110,200", "zh-TW"],
    ["The amount before tax is NT$11,665,710.", "en"],
    ["The quote totals NT$11,110,200.", "en"],
    ["The quote is NT$11,110,200 including tax.", "en"],
    ["with NT$11,110,200 tax and NT$555,510 before tax", "en"],
    ["NT$555,510 tax and NT$11,665,710 before tax", "en"],
    ["NT$555,510 tax and NT$11,110,200", "en"],
    ["NT$555,510 tax and before tax NT$11,110,200", "en"],
    ["NT$555,510 稅額及 NT$11,665,710 未稅金額", "zh-TW"],
  ] as const)(
    "retains the security gate and never borrows a previous label: %s",
    (text, locale) => {
      expect(check(text, locale)).toEqual({ kind: "REJECTED", reason: "AMOUNT_LABEL" });
    },
  );
});

const demolition = "拆除、隔間與天花",
  lighting = "照明與電氣";
const findings = [
  {
    category: demolition,
    claimKind: "CATEGORY_FORECAST_ACTUAL_VARIANCE",
    text: `${demolition}：預估成本比過往已核對實際成本高 9.4%`,
  },
  {
    category: demolition,
    claimKind: "CATEGORY_QUOTED_VARIANCE",
    text: `${demolition}：報價比過往報價高 7.1%`,
  },
  {
    category: lighting,
    claimKind: "CATEGORY_QUOTED_VARIANCE",
    text: `${lighting}：報價比過往報價高 9.4%`,
  },
];
const saved = {
  ...source,
  facts: { findings },
  typedFactPaths: ["findings.*.text", "findings.*.category"],
};
describe("SB-060 finding category scope", () => {
  it.each([
    `${demolition}的預估成本高 9.4%，報價高 7.1%；${lighting}報價高 9.4%`,
    `1. **${demolition}**：預估成本高 9.4%，\n報價高 7.1%\n2. ${lighting}：報價高 9.4%`,
    `- ${demolition}：報價高 7.1%，預估成本高 9.4%\n- ${lighting}：報價高 9.4%`,
  ])("expands every matched clause to exact saved sentences: %s", (text) => {
    const result = check(text, "zh-TW", saved);
    expect(result.kind).toBe("ACCEPTED");
    if (result.kind !== "ACCEPTED") return;
    expect(result.answer.text.split("\n").sort()).toEqual(findings.map((f) => f.text).sort());
  });
  it("uses the saved direction, never the model's direction", () => {
    expect(check(`${demolition}的報價低 7.1%，預估成本低 9.4%`, "zh-TW", saved)).toMatchObject({
      kind: "ACCEPTED",
      answer: { text: `${findings[1]!.text}\n${findings[0]!.text}` },
    });
  });
  it.each([
    `${lighting}的預估成本高 9.4%`,
    `${demolition}的報價高 9.4%`,
    `${demolition}的報價高 7.1%，預估成本高 7.1%`,
    `${demolition}工程：報價高 7.1%，預估成本高 9.4%`,
    `${demolition}的預估成本高 9.4%；報價高 9.4%`,
    `${demolition}的預估成本高 9.4%;報價高 9.4%`,
    `${demolition}的預估成本高 9.4%。報價高 9.4%`,
    `1. ${demolition}：預估成本高 9.4%\n2. 報價高 9.4%`,
    `- ${demolition}：預估成本高 9.4%\n- 報價高 9.4%`,
  ])("rejects wrong category/kind and never carries a category past a boundary: %s", (text) => {
    expect(check(text, "zh-TW", saved)).toEqual({ kind: "REJECTED", reason: "FINDING_SENTENCE" });
  });
  it("rejects absent and duplicate percentage findings", () => {
    expect(check(`${demolition}的報價高 7.3%`, "zh-TW", saved)).toEqual({
      kind: "REJECTED",
      reason: "UNSUPPORTED_NUMBER",
    });
    const duplicate = { ...saved, facts: { findings: [...findings, findings[1]!] } };
    expect(check(`${demolition}的報價高 7.1%`, "zh-TW", duplicate)).toEqual({
      kind: "REJECTED",
      reason: "FINDING_SENTENCE",
    });
  });
  it("carries a case-insensitive English label within a sentence but not across a full stop", () => {
    const s = {
      ...saved,
      facts: {
        findings: [
          {
            category: "Demolition",
            claimKind: "CATEGORY_QUOTED_VARIANCE",
            text: "Demolition: quoted price is 7.1% above past quoted prices.",
          },
          {
            category: "Demolition",
            claimKind: "CATEGORY_FORECAST_ACTUAL_VARIANCE",
            text: "Demolition: forecast cost is 9.4% above past reconciled actual costs.",
          },
          {
            category: "Lighting",
            claimKind: "CATEGORY_QUOTED_VARIANCE",
            text: "Lighting: quoted price is 9.4% above past quoted prices.",
          },
        ],
      },
    };
    expect(
      check("demolition: quoted price is 7.1% above, forecast cost is 9.4% above.", "en", s),
    ).toMatchObject({
      kind: "ACCEPTED",
      answer: {
        text: s.facts.findings
          .slice(0, 2)
          .map((f) => f.text)
          .join("\n"),
      },
    });
    expect(
      check("Demolition: quoted price is 7.1% above. Forecast cost is 9.4% above.", "en", s),
    ).toMatchObject({ kind: "REJECTED", reason: "FINDING_SENTENCE" });
  });
});
describe("SB-060 acceptance wording", () => {
  it.each(["en", "zh-TW"] as const)(
    "projects state and date with distinct labels in %s",
    (locale) => {
      const labels = assistantFactLabels(locale),
        value = assistantFactCopy(locale).notAccepted;
      const state = labelledFacts({ issued: { acceptedOn: value } }, locale);
      expect(state).toEqual({
        [labels.issued!]: {
          [labels.acceptance!]: locale === "en" ? "not accepted yet" : "尚未接受",
        },
      });
      expect(JSON.stringify(state)).not.toContain(labels.acceptedOn!);
      expect(labelledFacts({ acceptedOn: value }, locale)).toEqual({
        [labels.acceptance!]: locale === "en" ? "not accepted yet" : "尚未接受",
      });
      expect(labelledFacts({ issued: { acceptedOn: "2026-12-22" } }, locale)).toEqual({
        [labels.issued!]: { [labels.acceptedOn!]: "2026-12-22" },
      });
    },
  );
});
