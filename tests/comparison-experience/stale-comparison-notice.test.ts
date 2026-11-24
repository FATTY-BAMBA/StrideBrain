import { seededFirmLists } from "@/fixtures/firm-lists";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StaleComparisonNotice } from "@/components/comparisons/stale-comparison-notice";
import type { ComparisonFreshness } from "@/modules/comparisons/domain/freshness";

vi.mock("@/app/[locale]/projects/[projectKey]/compare/actions", () => ({
  runComparisonAction: vi.fn(),
}));

const stale: ComparisonFreshness = {
  comparisonRunId: "cmprun_saved",
  enrichmentRunId: "econrun_saved",
  state: "STALE",
  changedSources: [
    {
      sourceKey: "safe-opaque-source",
      titleEn: "Imported stone final cost",
      titleZhTw: "進口石材最終成本",
      projectNameEn: "Nanjing Brand Experience",
      projectNameZhTw: "南京品牌體驗中心",
      previousAuthority: "RECONCILED_ACTUAL",
      currentAuthority: "OBSERVED",
      reasons: ["AUTHORITY"],
    },
  ],
};

describe("Saved comparison stale warning", () => {
  it.each(["en", "zh-TW"] as const)(
    "identifies the source and before/after authority in %s without presenting write controls",
    (locale) => {
      const html = renderToStaticMarkup(
        createElement(StaleComparisonNotice, {
          catalog: seededFirmLists,
          freshness: stale,
          locale,
          projectKey: "PRJ-XINYI-026",
        }),
      );
      expect(html).toContain('role="alert"');
      expect(html).toContain(locale === "en" ? "This result is stale" : "此比較結果已過時");
      expect(html).toContain(locale === "en" ? "Nanjing Brand Experience" : "南京品牌體驗中心");
      expect(html).toContain(locale === "en" ? "Observed" : "已擷取");
      expect(html).toContain(locale === "en" ? "Re-run comparison" : "重新比較");
      expect(html).toContain('name="projectKey" value="PRJ-XINYI-026"');
      expect(html).toContain(`name="locale" value="${locale}"`);
      expect(html).not.toContain('name="proposalKey"');
      expect(html).not.toContain('name="comparisonRunId"');
      expect(html).not.toMatch(/RECONCILED_ACTUAL|OBSERVED/);
    },
  );
  it("does not show a warning for verified unchanged information", () => {
    expect(
      renderToStaticMarkup(
        createElement(StaleComparisonNotice, {
          catalog: seededFirmLists,
          freshness: { ...stale, state: "CURRENT", changedSources: [] },
          locale: "en",
          projectKey: "PRJ-XINYI-026",
        }),
      ),
    ).toBe("");
  });
  it("describes a failed freshness check without inventing a changed source", () => {
    const html = renderToStaticMarkup(
      createElement(StaleComparisonNotice, {
        catalog: seededFirmLists,
        freshness: { ...stale, state: "UNVERIFIED", changedSources: [] },
        locale: "en",
        projectKey: "PRJ-XINYI-026",
      }),
    );
    expect(html).toContain("could not be checked");
    expect(html).not.toContain("Nanjing");
    expect(html).not.toContain("This result is stale");
  });
});
