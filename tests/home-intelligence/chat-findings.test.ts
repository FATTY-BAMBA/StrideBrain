import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  runtime: vi.fn(),
  comparison: vi.fn(),
  economics: vi.fn(),
  panel: vi.fn(),
  run: vi.fn(),
}));
vi.mock("@/lib/server/demo-value-context", () => ({ loadDemoValueContext: mocks.context }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.runtime }));
vi.mock("@/lib/server/comparison-services", () => ({
  createComparisonServices: () => ({
    getComparison: { execute: mocks.comparison },
    getEconomics: { execute: mocks.economics },
    getFreshness: { check: async () => ({ state: "CURRENT" }) },
    getEvidencePanel: { execute: mocks.panel },
    runComparison: { execute: mocks.run },
  }),
}));
import { askHomeAction } from "@/app/[locale]/home-chat-actions";
import { initialHomeChatState } from "@/modules/home-intelligence/chat-contracts";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
const comparison = {
  run: { id: "comparison-own" },
  activeContext: { projectKey: "J-OWN", activeQuoteVersionKey: "quote-own" },
  matches: [],
  defaultSelectedProjectKeys: [],
};
const economics = {
  run: { id: "economics-own", comparisonRunId: "comparison-own" },
  accessScope: "FULL_ACTUAL",
  selectedProjectKeys: [],
  categories: [{ categoryId: "CUSTOM_MILLWORK" }, { categoryId: "SIGNAGE" }],
  claims: [
    {
      claimKey: "opaque-above",
      kind: "CATEGORY_QUOTED_VARIANCE" as const,
      titleEn: "Stored claim",
      titleZhTw: "已儲存項目",
      evidenceReferenceIds: [],
      warningCodes: [],
      categoryId: "CUSTOM_MILLWORK",
      value: { direction: "ABOVE", variancePercent: "12.34" },
    },
    {
      claimKey: "opaque-below",
      kind: "CATEGORY_FORECAST_ACTUAL_VARIANCE" as const,
      titleEn: "Stored claim",
      titleZhTw: "已儲存項目",
      evidenceReferenceIds: [],
      warningCodes: [],
      categoryId: "SIGNAGE",
      value: { direction: "BELOW", variancePercent: "-8.26" },
    },
  ],
};
const context = {
  projects: [],
  workspace: {
    project: {
      businessKey: "J-OWN",
      scopeCategories: [{ categoryId: "CUSTOM_MILLWORK" }, { categoryId: "SIGNAGE" }],
    },
    openActions: [],
  },
  intelligence: { kind: "AVAILABLE", comparison, economics },
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.context.mockResolvedValue(context);
  mocks.runtime.mockResolvedValue({ organizationId: "trusted" });
  mocks.comparison.mockResolvedValue({ kind: "COMPLETE", result: comparison });
  mocks.economics.mockResolvedValue(economics);
  mocks.panel.mockResolvedValue({ kind: "READY", view: { sources: [] } });
});
async function ask(message: string, locale = "en") {
  const data = new FormData();
  data.set("locale", locale);
  data.set("message", message);
  data.set("projectKey", "J-OWN");
  return askHomeAction(initialHomeChatState, data);
}
describe("Home chat job-specific findings within existing intents", () => {
  it.each(["en", "zh-TW"])("uses own semantic claims and correct signs in %s", async (locale) => {
    const result = await ask(
      locale === "en" ? "What looks unusual in the quote?" : "報價有哪些異常？",
      locale,
    );
    const reply = result.turns.at(-1)!;
    expect(reply.bullets?.join(" ")).toContain("12.3%");
    expect(reply.bullets?.join(" ")).toContain("8.3%");
    expect(reply.bullets?.join(" ")).toContain(locale === "en" ? "below" : "低 ");
    expect(reply.bullets).toEqual(
      economics.claims.map((claim) => claimFindingText(claim, locale === "en" ? "en" : "zh-TW")),
    );
    expect(JSON.stringify(reply)).not.toMatch(/stone|lighting|石材|照明/i);
    expect(mocks.context).toHaveBeenCalledWith(locale, "J-OWN");
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it.each(["What supports the imported stone difference?", "What about lighting in the quote?"])(
    "returns no record for absent category: %s",
    async (query) => {
      const reply = (await ask(query)).turns.at(-1)!;
      expect(reply.text).toBe("There is no record for that category in this job.");
      expect(reply.bullets).toBeUndefined();
      expect(reply.citations).toBeUndefined();
      expect(mocks.panel).not.toHaveBeenCalled();
    },
  );
  it("does not expose financial text from structural-only or unquoted results", async () => {
    mocks.context.mockResolvedValue({
      ...context,
      intelligence: {
        kind: "AVAILABLE",
        comparison,
        economics: { ...economics, accessScope: "STRUCTURAL_ONLY" },
      },
    });
    expect(
      JSON.stringify((await ask("What looks unusual in the quote?")).turns.at(-1)),
    ).not.toMatch(/%|NT\$/);
    mocks.context.mockResolvedValue({
      ...context,
      intelligence: {
        kind: "AVAILABLE",
        comparison: {
          ...comparison,
          activeContext: { ...comparison.activeContext, activeQuoteVersionKey: undefined },
        },
        economics,
      },
    });
    const reply = (await ask("What looks unusual in the quote?")).turns.at(-1)!;
    expect(reply.text).toContain("need a quote");
    expect(reply.bullets).toBeUndefined();
  });
  it("does not add standalone category intents", async () => {
    const reply = (await ask("Custom millwork")).turns.at(-1)!;
    expect(reply.text).toContain("can’t answer that reliably");
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it.each(["en", "zh-TW"])(
    "rejects out-of-date saved and remembered findings in %s",
    async (locale) => {
      const previous = await ask("What looks unusual in the quote?");
      mocks.context.mockResolvedValue({ ...context, intelligence: { kind: "OUT_OF_DATE" } });
      vi.clearAllMocks();
      const data = new FormData();
      data.set("locale", locale);
      data.set("projectKey", "J-OWN");
      for (const query of ["What looks unusual in the quote?", "Show those sources", "Why?"]) {
        data.set("message", query);
        const result = await askHomeAction(previous, data);
        expect(result.turns.at(-1)?.text).toBe(
          locale === "en"
            ? "The saved comparison is out of date. Open the comparison to run it again."
            : "已儲存的比較已過期，請開啟比較後重新執行。",
        );
        expect(result.turns.at(-1)?.action?.href).toBe(`/${locale}/projects/J-OWN/compare`);
        expect(result.turns.at(-1)?.bullets).toBeUndefined();
        expect(result.turns.at(-1)?.citations).toBeUndefined();
        expect(result.context).toEqual({});
      }
      expect(mocks.comparison).not.toHaveBeenCalled();
      expect(mocks.economics).not.toHaveBeenCalled();
      expect(mocks.panel).not.toHaveBeenCalled();
      expect(mocks.run).not.toHaveBeenCalled();
    },
  );
  it("does not reuse remembered findings when the saved-findings read is unavailable", async () => {
    mocks.context.mockResolvedValue({ ...context, intelligence: { kind: "UNAVAILABLE" } });
    expect((await ask("What looks unusual in the quote?")).turns.at(-1)?.text).toContain(
      "Saved findings are unavailable.",
    );
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.panel).not.toHaveBeenCalled();
  });
  it.each(["millwork", "signage"])(
    "narrows an existing quote intent to the %s alias",
    async (alias) => {
      const reply = (await ask(`What looks unusual in the ${alias} quote?`)).turns.at(-1)!;
      expect(reply.bullets).toHaveLength(1);
      expect(reply.bullets![0]).toContain(
        alias === "millwork" ? "Custom millwork:" : "Signage and display installation:",
      );
    },
  );
  it("narrows an existing evidence intent to an absent category", async () => {
    const reply = (await ask("What evidence supports the handover difference?")).turns.at(-1)!;
    expect(reply.text).toBe("There is no record for that category in this job.");
    expect(mocks.panel).not.toHaveBeenCalled();
  });
  it("does not interpret milestone as stone", async () => {
    const reply = (await ask("What looks unusual in the milestone quote?")).turns.at(-1)!;
    expect(reply.bullets).toHaveLength(2);
    expect(reply.text).not.toContain("no record");
  });
  it.each(["en", "zh-TW"])(
    "shows saved match scores without cost percentages for an unquoted job in %s",
    async (locale) => {
      mocks.context.mockResolvedValue({
        ...context,
        intelligence: {
          kind: "AVAILABLE",
          comparison: {
            ...comparison,
            activeContext: { ...comparison.activeContext, activeQuoteVersionKey: undefined },
            matches: [
              {
                project: { projectKey: "past-own", nameEn: "Past job", nameZhTw: "歷史專案" },
                displayScore: 52,
              },
            ],
          },
        },
      });
      const reply = (
        await ask(locale === "en" ? "Have we done similar work?" : "以前做過類似專案嗎？", locale)
      ).turns.at(-1)!;
      expect(reply.bullets).toEqual([`${locale === "en" ? "Past job" : "歷史專案"} · 52/100`]);
      expect(JSON.stringify(reply)).not.toMatch(/%|NT\$/);
    },
  );
  it("clears the remembered finding after an absent-category answer", async () => {
    const previous = await ask("What looks unusual in the quote?");
    expect(previous.context.activeClaimKey).toBe("opaque-above");
    const data = new FormData();
    data.set("locale", "en");
    data.set("message", "What about imported stone?");
    data.set("projectKey", "J-OWN");
    const result = await askHomeAction(previous, data);
    expect(result.turns.at(-1)?.text).toBe("There is no record for that category in this job.");
    expect(result.context.activeClaimKey).toBeUndefined();
    expect(result.context.lastIntent).toBeUndefined();
  });
});
