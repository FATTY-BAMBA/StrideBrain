// @vitest-environment jsdom
import type * as ReactDOM from "react-dom";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComparisonExperienceView } from "@/modules/comparison-experience/contracts";
import type { Locale } from "@/modules/localization/config";
const mocks = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), pending: false }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/app/[locale]/projects/[projectKey]/compare/actions", () => ({
  updateComparisonSelectionAction: vi.fn(),
}));
vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof ReactDOM>()),
  useFormStatus: () => ({ pending: mocks.pending }),
}));
import { ComparisonExperienceClient } from "@/components/comparisons/comparison-experience-client";
const keys = ["A", "B", "C", "D"];
function view(
  id: string,
  selected: readonly string[],
  locale: Locale = "en",
): ComparisonExperienceView {
  return {
    version: "comparison-experience.v1",
    locale,
    route: {
      projectKey: "PROJECT",
      comparisonRunId: "comparison-stable",
      economicsRunId: id,
      selectedProjectKeys: selected,
    },
    heading: { eyebrow: "Comparison", title: "Project", description: "Stored result" },
    summary: {
      generatedAtLabel: "Today",
      policyLabel: "Project similarity",
      authorizedMatchCountLabel: "4",
      selectedCountLabel: String(selected.length),
      economicsStateLabel: "Complete",
      syntheticDataLabel: "Synthetic",
    },
    activeProject: {
      projectKey: "PROJECT",
      name: "Project",
      subtypeLabel: "Retail",
      areaLabel: "640",
      locationLabel: "Taipei",
    },
    cards: keys.map((key, index) => ({
      projectKey: key,
      name: key,
      rank: index + 1,
      scoreLabel: "88/100",
      band: "STRONG",
      bandLabel: "Strong match",
      evidenceCoverageLabel: "100%",
      locationLabel: "Taipei",
      areaLabel: "600",
      completionLabel: "2025",
      strongestFactors: [
        {
          factorKey: "AREA_SIMILARITY",
          label: "Area",
          state: "KNOWN",
          valueLabel: "Comparable area",
        },
      ],
      differences: [],
      unknowns: [],
      quotedHistoryAvailable: true,
      actualHistoryAvailable: true,
      warningLabels: [],
    })),
    initialSelectedProjectKeys: selected,
    maximumSelectedProjects: 3,
    table: { columns: [], sections: [] },
    synthesis: {
      history: [
        {
          key: "claim",
          title: "Claim",
          body: "Evidence",
          tone: "NEUTRAL",
          claimKey: "CURRENT_CLAIM",
        },
      ],
      differences: [],
      gaps: [],
      recommendation: { key: "recommendation", title: "Review", body: "Review", tone: "NEUTRAL" },
    },
    notices: [],
  };
}
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  mocks.pending = false;
  history.replaceState(null, "", "/en/projects/PROJECT/compare?run=comparison-stable&economics=A1");
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
async function render(id: string, selection: readonly string[], locale: Locale = "en") {
  await act(async () =>
    root.render(createElement(ComparisonExperienceClient, { view: view(id, selection, locale) })),
  );
}
function selected() {
  return [...host.querySelectorAll<HTMLInputElement>('input[name="selectedProjectKey"]')].map(
    (x) => x.value,
  );
}
function submit() {
  return host.querySelector<HTMLButtonElement>('button[type="submit"]')!;
}
async function toggle(index: number) {
  await act(async () =>
    host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[index]!.click(),
  );
}
describe.each(["en", "zh-TW"] as const)("Persisted selection navigation %s", (locale) => {
  it("supports ABC→AB→ABC and resets on historical reopen, without stale editor baseline", async () => {
    await render("A1", keys.slice(0, 3), locale);
    expect(submit().disabled).toBe(true);
    await toggle(2);
    expect(selected()).toEqual(["A", "B"]);
    expect(submit().disabled).toBe(false);
    await render("B", ["A", "B"], locale);
    expect(submit().disabled).toBe(true);
    await toggle(2);
    expect(selected()).toEqual(["A", "B", "C"]);
    expect(submit().disabled).toBe(false);
    await render("A2", keys.slice(0, 3), locale);
    expect(submit().disabled).toBe(true);
    await render("B", ["A", "B"], locale);
    expect(selected()).toEqual(["A", "B"]);
    expect(submit().disabled).toBe(true);
    await render("A1", keys.slice(0, 3), locale);
    expect(selected()).toEqual(keys.slice(0, 3));
  });
  it("retains unsaved editor selection across same-result locale navigation and disables empty/pending submissions", async () => {
    await render("A1", keys.slice(0, 3), locale);
    await toggle(2);
    await render("A1", keys.slice(0, 3), locale === "en" ? "zh-TW" : "en");
    expect(selected()).toEqual(["A", "B"]);
    mocks.pending = true;
    await render("A1", keys.slice(0, 3), locale);
    expect(submit().disabled).toBe(true);
    expect(submit().getAttribute("aria-busy")).toBe("true");
    mocks.pending = false;
    await toggle(0);
    await toggle(1);
    expect(selected()).toEqual([]);
    expect(submit().disabled).toBe(true);
  });
  it("keeps current economics when opening a structural factor from a stale browser URL", async () => {
    await render("B", ["A", "B"], locale);
    const trigger = [
      ...host.querySelectorAll<HTMLButtonElement>("button[data-evidence-trigger-id]"),
    ].find((button) => button.dataset.evidenceTriggerId?.includes("factor"));
    expect(trigger).toBeDefined();
    await act(async () => trigger!.click());
    const url = new URL(mocks.push.mock.calls.at(-1)![0], "http://localhost");
    expect(url.searchParams.get("economics")).toBe("B");
    expect(url.searchParams.get("evidenceMode")).toBe("factor");
    expect(url.searchParams.get("selected")).toBe("A,B");
  });
  it("opens evidence using the current persisted enrichment after a transition", async () => {
    await render("B", ["A", "B"], locale);
    await act(async () =>
      host
        .querySelector<HTMLButtonElement>('[data-evidence-trigger-id="evidence-synthesis-claim"]')!
        .click(),
    );
    const url = new URL(mocks.push.mock.calls.at(-1)![0], "http://localhost");
    expect(url.searchParams.get("economics")).toBe("B");
    expect(url.searchParams.get("evidenceClaim")).toBe("CURRENT_CLAIM");
  });
});
