// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type {
  ProjectWorkspaceDTO,
  ProjectWorkspaceState,
  EvidenceHealthDTO,
} from "@/modules/projects/domain/project-workspace";
import type { Locale } from "@/modules/localization/config";
import { workspaceStateCopies } from "@/modules/localization/workspace-state-copy";
const route = vi.hoisted(() => ({ locale: "en" }));
vi.mock("next/navigation", () => ({ useParams: () => route }));
import ComparisonLoading from "@/app/[locale]/projects/[projectKey]/compare/loading";
import { ProjectWorkspaceOverview } from "@/components/projects/project-workspace-overview";

const workspace: ProjectWorkspaceDTO = {
  version: "project-workspace.v1",
  state: "READY",
  warnings: [],
  dataMode: "DEMO_SYNTHETIC",
  project: {
    id: "project-test",
    businessKey: "PROJECT",
    name: { en: "Project", zhTw: "專案", display: "專案" },
    clientName: { en: "Client", zhTw: "客戶", display: "客戶" },
    status: "ACTIVE",
    stage: "QUOTE_REVIEW",
    comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
    subtype: "RETAIL_FLAGSHIP",
    location: {
      country: "TW",
      city: "Taipei City",
      district: "Xinyi District",
      display: "台北市信義區",
    },
    area: { value: "640", unit: "m2" },
    scopeCategories: [],
    demoData: true,
    dataClassification: "DEMO_SYNTHETIC",
  },
  commercial: {
    activeQuote: { state: "UNAVAILABLE", observationType: "QUOTED_PRICE", warningCodes: [] },
    activeForecast: {
      state: "UNAVAILABLE",
      observationType: "FORECAST_DIRECT_COST",
      warningCodes: [],
    },
    reconciledActual: {
      state: "UNAVAILABLE",
      observationType: "RECONCILED_ACTUAL_COST",
      warningCodes: [],
    },
    supplierOffers: [],
  },
  evidenceHealth: { state: "GOOD", labelKey: "evidence.good" },
  evidence: [],
  suppliers: [],
  materials: [],
  openActions: [],
  suggestedQuestions: [],
  permissions: {
    role: "PROJECT_MANAGER_ESTIMATOR",
    canRunComparison: true,
    canReadQuote: true,
    canReadForecast: true,
    canReadActual: true,
    canReadEvidence: true,
    canProposeInternalReview: true,
    canCreateInternalReview: true,
    canAssignInternalReview: true,
  },
};
const states = [
  "READY",
  "PARTIAL",
  "UNAVAILABLE",
  "PERMISSION_RESTRICTED",
  "CONFLICTED",
  "STALE",
] as const satisfies readonly ProjectWorkspaceState[];
const health = [
  "GOOD",
  "PARTIAL",
  "INSUFFICIENT",
  "CONFLICTED",
  "RESTRICTED",
] as const satisfies readonly EvidenceHealthDTO["state"][];
function render(value: ProjectWorkspaceDTO, locale: Locale) {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    createElement(ProjectWorkspaceOverview, { workspace: value, locale }),
  );
  return host;
}
describe.each(["en", "zh-TW"] as const)("Stage9 workspace/loading %s", (locale) => {
  it.each(states)("maps workspace state %s without exposing its internal identifier", (state) => {
    const label = workspaceStateCopies[locale].workspace[state];
    expect(label).toBeTruthy();
    expect(label).not.toBe(state);
    if (state !== "UNAVAILABLE") {
      const host = render({ ...workspace, state }, locale);
      expect(host.textContent).toContain(label);
      expect(host.textContent).not.toMatch(
        /\b(?:READY|GOOD|PARTIAL|CONFLICTED|RESTRICTED|PERMISSION_RESTRICTED|INSUFFICIENT|STALE)\b/,
      );
    }
  });
  it.each(health)("renders evidence-health state %s without leaking the enum", (state) => {
    const host = render(
      { ...workspace, evidenceHealth: { ...workspace.evidenceHealth, state } },
      locale,
    );
    expect(host.textContent).toContain(workspaceStateCopies[locale].evidence[state]);
    expect(host.textContent).not.toMatch(
      /\b(?:READY|GOOD|PARTIAL|CONFLICTED|RESTRICTED|INSUFFICIENT)\b/,
    );
  });
  it("exposes a localized named busy status, with the same skeleton", () => {
    route.locale = locale;
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(createElement(ComparisonLoading));
    const status = host.querySelector('[role="status"]');
    expect(status?.getAttribute("aria-busy")).toBe("true");
    expect(status?.getAttribute("aria-label")).toBe(
      locale === "en" ? "Loading comparable projects" : "正在載入歷史專案比較",
    );
    expect(host.querySelectorAll("section")).toHaveLength(3);
    if (locale === "zh-TW") expect(host.innerHTML).not.toContain("Loading comparable projects");
  });
});
it("keeps exhaustive locale parity and the reduced-motion animation override", () => {
  expect(Object.keys(workspaceStateCopies.en.workspace)).toEqual([...states]);
  expect(Object.keys(workspaceStateCopies.en.evidence)).toEqual([...health]);
  expect(Object.keys(workspaceStateCopies["zh-TW"].workspace)).toEqual([...states]);
  expect(Object.keys(workspaceStateCopies["zh-TW"].evidence)).toEqual([...health]);
  const css = readFileSync("src/components/comparisons/comparison-loading.module.css", "utf8");
  expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none/);
  expect(css).toContain("animation: shimmer 1.4s ease-in-out infinite");
});
