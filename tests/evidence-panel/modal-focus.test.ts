import { seededFirmLists } from "@/fixtures/firm-lists";
// @vitest-environment jsdom
import { act, createElement, Fragment, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProposalDTO } from "@/modules/internal-review/domain/contracts";
import { parseInternalReviewRoute } from "@/modules/internal-review-experience/route-state";
import type { Locale } from "@/modules/localization/config";
import type { ComparisonExperienceView } from "@/modules/comparison-experience/contracts";
import type {
  EvidencePanelOutcome,
  EvidencePanelSelection,
  EvidencePanelView,
} from "@/modules/evidence-panel/contracts";
import { getEvidencePanelCopy } from "@/modules/evidence-panel/copy";
import { parseEvidenceSelection } from "@/modules/evidence-panel/route-state";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/app/[locale]/projects/[projectKey]/compare/actions", () => ({
  updateComparisonSelectionAction: vi.fn(),
}));
import { ComparisonExperienceClient } from "@/components/comparisons/comparison-experience-client";
import { EvidencePanel } from "@/components/evidence/evidence-panel";

const claim: EvidencePanelSelection = {
  mode: "CLAIM",
  comparisonRunId: "run-focus",
  enrichmentRunId: "economics-focus",
  claimKey: "STONE_CLAIM",
};
const sourceKeys = ["a".repeat(24), "b".repeat(24)];
let root: Root;
let host: HTMLDivElement;
let locale: Locale;
let current: EvidencePanelSelection | null;
let removeSource = false;
let reviewFlow = false;
const scrollIntoView = vi.fn();

function proposal(): ProposalDTO {
  return {
    version: "internal-review-proposal.v1",
    businessKey: "proposal_focus",
    project: { projectKey: "PROJECT", name: "Project" },
    comparisonRunId: "run-focus",
    enrichmentRunId: "economics-focus",
    locale,
    timezone: "Asia/Taipei",
    titleOptions: [
      { key: "REVIEW", text: "Review" },
      { key: "CHECK", text: "Check" },
    ],
    rationaleOptions: [
      { key: "REVIEW", text: "Review" },
      { key: "REVIEW_NEXT", text: "Review next" },
    ],
    title: "Review",
    rationale: "Review",
    titleKey: "REVIEW",
    rationaleKey: "REVIEW",
    mandatoryStatements: [],
    warnings: [],
    assignees: [
      { key: "mei", displayName: "Mei" },
      { key: "iris", displayName: "Iris" },
    ],
    suggestedAssigneeKey: "mei",
    canAssign: true,
    suggestedDueDate: "2026-11-24",
    datePolicyEvaluatedAt: "2026-11-17T04:00:00Z",
    nextDatePolicyBoundaryAt: "2026-11-17T16:00:00Z",
    minDueDate: "2026-11-17",
    maxDueDate: "2027-11-17",
    expiresAt: "2026-11-18T12:00:00Z",
    idempotencyKey: "idempotency-focus",
    evidenceLinks: [{ claimKey: "STONE_CLAIM", label: "Stone evidence" }],
    returnContext: { selectedProjectKeys: ["A", "B"] },
  };
}

function view(): ComparisonExperienceView {
  return {
    catalog: seededFirmLists,
    version: "comparison-experience.v1",
    locale,
    route: {
      projectKey: "PROJECT",
      comparisonRunId: claim.comparisonRunId,
      economicsRunId: "economics-focus",
      selectedProjectKeys: ["A", "B"],
    },
    heading: { eyebrow: "Comparison", title: "Comparison", description: "Stored comparison" },
    summary: {
      generatedAtLabel: "Today",
      policyLabel: "Policy",
      authorizedMatchCountLabel: "0",
      selectedCountLabel: "2",
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
    cards: [],
    initialSelectedProjectKeys: ["A", "B"],
    maximumSelectedProjects: 3,
    table: { columns: [], sections: [] },
    synthesis: {
      history: [
        {
          key: "stone",
          title: "Stone",
          body: "Supporting evidence",
          tone: "NEUTRAL",
          claimKey: "STONE_CLAIM",
        },
      ],
      differences: [],
      gaps: [],
      recommendation: {
        key: "recommendation",
        title: "Review",
        body: "Review evidence",
        tone: "NEUTRAL",
      },
    },
    notices: [],
  };
}
function panel(selection: EvidencePanelSelection): EvidencePanelOutcome {
  const copy = getEvidencePanelCopy(locale);
  const parent: EvidencePanelSelection =
    selection.mode === "FACTOR"
      ? selection
      : selection.mode === "SOURCE" && selection.factorKey
        ? {
            mode: "FACTOR",
            comparisonRunId: selection.comparisonRunId,
            candidateProjectKey: selection.candidateProjectKey!,
            factorKey: selection.factorKey,
          }
        : claim;
  const keys =
    selection.mode === "SOURCE"
      ? [selection.sourceKey]
      : sourceKeys.filter((key) => !removeSource || key !== sourceKeys[1]);
  const result: EvidencePanelView = {
    catalog: seededFirmLists,
    version: "evidence-panel.v1",
    locale,
    mode: selection.mode,
    context: {
      projectKey: "PROJECT",
      projectName: "Synthetic project",
      comparisonRunId: claim.comparisonRunId,
      snapshotLabel: "Snapshot",
      stale: false,
      freshness: { comparisonRunId: claim.comparisonRunId, state: "CURRENT", changedSources: [] },
    },
    heading: {
      eyebrow: copy.eyebrow,
      title:
        selection.mode === "SOURCE"
          ? locale === "en"
            ? "Source details"
            : "來源明細"
          : copy.title,
      description: "",
    },
    sources: keys.map((key) => ({
      sourceKey: key,
      title: locale === "en" ? "Imported stone" : "進口石材",
      objectTypeLabel: copy.title,
      locatorLabel: "1",
      authorityState: "RECONCILED_ACTUAL",
      authorityLabel: "Synthetic",
      dataClassificationLabel: "Synthetic",
      conditions: [],
      conditionLabels: [],
      conflictKeys: ["CONFLICT_A"],
      preview: { state: "STRUCTURED", fields: [{ label: "Amount", value: "100" }] },
      sourceSelection: { ...parent, mode: "SOURCE", sourceKey: key },
    })),
    notices: [],
    ...(selection.mode === "SOURCE"
      ? { selectedSourceKey: selection.sourceKey, backSelection: parent }
      : {}),
    ...(selection.mode === "CONFLICT"
      ? {
          backSelection: claim,
          conflict: {
            conflictKey: selection.conflictKey,
            statusLabel: "Open",
            impactLabel: "Review",
            records: [],
          },
        }
      : {}),
  };
  return { kind: "READY", view: result };
}
function render(outcome?: EvidencePanelOutcome) {
  const route = parseInternalReviewRoute(
    Object.fromEntries(new URLSearchParams(window.location.search)),
  );
  const prepared = proposal();
  root.render(
    createElement(
      StrictMode,
      null,
      createElement(
        Fragment,
        null,
        createElement(
          "nav",
          null,
          createElement("a", { href: "/", id: "global-nav" }, "Home"),
          createElement("a", { href: "/projects", id: "project-nav" }, "Projects"),
        ),
        createElement(ComparisonExperienceClient, {
          view: view(),
          evidenceSelection: current,
          evidencePanel: current ? (outcome ?? panel(current)) : undefined,
          evidenceReturnId: reviewFlow
            ? (new URLSearchParams(window.location.search).get("evidenceReturn") ?? undefined)
            : "evidence-synthesis-stone",
          internalReview: reviewFlow
            ? {
                locale,
                projectKey: "PROJECT",
                comparisonRunId: "run-focus",
                enrichmentRunId: "economics-focus",
                canPrepare: true,
                returnContext: prepared.returnContext,
                route,
                proposalOutcome: route.proposalKey
                  ? { kind: "PREPARED", proposal: prepared }
                  : undefined,
              }
            : undefined,
        }),
        createElement("button", { id: "background-review" }, "Underlying review control"),
      ),
    ),
  );
}
async function commitNavigation(outcome?: EvidencePanelOutcome) {
  const href = router.push.mock.calls.at(-1)?.[0] as string;
  expect(href).toBeTruthy();
  window.history.replaceState(null, "", href);
  const p = new URLSearchParams(window.location.search);
  current = parseEvidenceSelection({
    comparisonRunId: p.get("run") ?? undefined,
    economicsRunId: p.get("economics") ?? undefined,
    evidenceMode: p.get("evidenceMode") ?? undefined,
    evidenceClaimKey: p.get("evidenceClaim") ?? undefined,
    evidenceSourceKey: p.get("evidenceSource") ?? undefined,
    evidenceConflictKey: p.get("evidenceConflict") ?? undefined,
    evidenceCandidateProjectKey: p.get("evidenceCandidate") ?? undefined,
    evidenceFactorKey: p.get("evidenceFactor") ?? undefined,
  });
  await act(async () => render(outcome));
}
function selectionMode() {
  return current?.mode;
}
function dialog() {
  return host.querySelector<HTMLElement>('[role="dialog"]')!;
}
function heading() {
  return host.querySelector<HTMLElement>("#evidence-panel-title")!;
}
function controls() {
  return [...dialog().querySelectorAll<HTMLButtonElement>("button")].filter(
    (el) => !el.disabled && !el.hidden,
  );
}
function sourceTrigger(index = 1) {
  return [...dialog().querySelectorAll<HTMLButtonElement>("button")].filter(
    (button) => button.textContent === getEvidencePanelCopy(locale).inspectSource,
  )[index]!;
}
async function press(key: string, shiftKey = false) {
  const event = new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true });
  await act(async () => document.activeElement!.dispatchEvent(event));
  return event;
}
async function drilldown(index = 1) {
  const trigger = sourceTrigger(index);
  const identity = trigger.dataset.panelTrigger;
  trigger.focus();
  await act(async () => trigger.click());
  // The old authorized parent remains focused while a server navigation is pending.
  expect(dialog().contains(document.activeElement)).toBe(true);
  await commitNavigation();
  expect(document.activeElement).toBe(heading());
  expect(document.activeElement).not.toBe(document.body);
  return identity;
}

beforeEach(() => {
  locale = "en";
  current = claim;
  removeSource = false;
  reviewFlow = false;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        ({ ok: true, json: async () => ({ kind: "PREPARED", proposal: proposal() }) }) as Response,
    ),
  );

  vi.stubGlobal("CSS", { escape: (value: string) => value });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (
    this: HTMLElement,
  ) {
    return (this.hidden || this.style.display === "none"
      ? []
      : [{ width: window.innerWidth, height: 40 }]) as unknown as DOMRectList;
  });
  scrollIntoView.mockClear();
  router.push.mockReset();
  router.replace.mockReset();
  window.history.replaceState(
    null,
    "",
    "/en/projects/PROJECT/compare?run=run-focus&economics=economics-focus&selected=A%2CB&reviewTitle=CHECK&reviewRationale=REVIEW_NEXT&reviewAssignee=iris&reviewDue=2026-12-20&evidenceMode=claim&evidenceClaim=STONE_CLAIM&evidenceReturn=evidence-synthesis-stone",
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  document.body.style.overflow = "";
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

const layouts = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
  ["narrow", 320, 740],
  ["200%-equivalent constrained DOM", 640, 400],
] as const;

describe.each(["en", "zh-TW"] as const)("F-08 modal hierarchy (%s)", (language) => {
  it("keeps factor meaning visible before sources while calculation mechanics stay collapsed", async () => {
    locale = language;
    current = {
      mode: "FACTOR",
      comparisonRunId: claim.comparisonRunId,
      candidateProjectKey: "candidate-focus",
      factorKey: "AREA_SIMILARITY",
    };
    const outcome = panel(current);
    if (outcome.kind !== "READY") throw new Error("Expected ready fixture");
    const factor = {
      kind: "FACTOR" as const,
      policyVersion: "v1",
      policyDescription: "Policy details",
      factorKey: "AREA_SIMILARITY" as const,
      factorLabel: "Area",
      state: "KNOWN" as const,
      stateLabel: "Known",
      normalizedValueLabel: "0.88",
      weightLabel: "20",
      contributionLabel: "17.7",
      totalScoreLabel: "81.3/100",
      evidenceCoverageLabel: "100%",
      explanationLabel: "The floor areas are similar.",
    };
    await act(async () => render({ ...outcome, view: { ...outcome.view, trace: factor } }));
    const summary = dialog().querySelector('section[aria-label="Area"]')!;
    expect(summary.closest("details")).toBeNull();
    expect(summary.textContent).toContain(factor.explanationLabel);
    expect(summary.textContent).toContain(factor.stateLabel);
    const sources = dialog().querySelector("#evidence-sources-title")!;
    expect(
      summary.compareDocumentPosition(sources) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(dialog().querySelector("details")?.open).toBe(false);
    expect(dialog().querySelector("header button")).not.toBeNull();
    expect(heading().closest("header")).toBeNull();
  });
  it.each(layouts)(
    "keeps source focus contained in %s, with and without reduced motion",
    async (_name, width, height) => {
      locale = language;
      vi.stubGlobal("innerWidth", width);
      vi.stubGlobal("innerHeight", height);
      // jsdom supplies no layout or real zoom. These are constrained DOM inputs,
      // not native reflow/zoom acceptance. No animation/timer is advanced for focus.
      for (const reduce of [false, true]) {
        vi.stubGlobal(
          "matchMedia",
          vi.fn(() => ({ matches: reduce })),
        );
        await act(async () => render());
        const boundary = dialog();
        const id = await drilldown();
        expect(dialog()).toBe(boundary);
        expect(host.querySelectorAll('[aria-modal="true"]')).toHaveLength(1);
        const sourceControls = controls();
        expect((await press("Tab", true)).defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(sourceControls.at(-1));
        expect((await press("Tab")).defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(sourceControls[0]);
        expect((await press("Tab", true)).defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(sourceControls.at(-1));
        // Both directions recover when a removed/blurred control leaves BODY active.
        for (const reverse of [false, true]) {
          (document.activeElement as HTMLElement).blur();
          expect(document.activeElement).toBe(document.body);
          expect((await press("Tab", reverse)).defaultPrevented).toBe(true);
          expect(document.activeElement).toBe(reverse ? sourceControls.at(-1) : sourceControls[0]);
        }
        for (const id of ["global-nav", "project-nav", "background-review"]) {
          document.getElementById(id)!.focus();
          expect(document.activeElement).toBe(heading());
          expect(dialog().contains(document.activeElement)).toBe(true);
        }
        expect(scrollIntoView).toHaveBeenCalledWith({
          behavior: "instant",
          block: "nearest",
          inline: "nearest",
        });
        await press("Escape");
        await commitNavigation();
        expect(selectionMode()).toBe("CLAIM");
        expect((document.activeElement as HTMLElement).dataset.panelTrigger).toBe(id);
        expect(document.activeElement).toBe(sourceTrigger());
        expect(dialog()).toBe(boundary);
        // The existing route builder preserves comparison and draft selectors.
        const params = new URLSearchParams(window.location.search);
        expect(params.get("run")).toBe("run-focus");
        expect(params.get("economics")).toBe("economics-focus");
        expect(params.get("selected")).toBe("A,B");
        expect(params.get("reviewTitle")).toBe("CHECK");
        expect(params.get("reviewRationale")).toBe("REVIEW_NEXT");
        expect(params.get("reviewAssignee")).toBe("iris");
        expect(params.get("reviewDue")).toBe("2026-12-20");
        await press("Escape");
        await commitNavigation();
        expect(dialog()).toBeNull();
        expect(document.activeElement).toBe(
          host.querySelector('[data-evidence-trigger-id="evidence-synthesis-stone"]'),
        );
        expect(document.body.style.overflow).toBe("");
        current = claim;
      }
    },
  );

  it("returns the exact second source trigger on the visible close/back control", async () => {
    locale = language;
    await act(async () => render());
    const id = await drilldown();
    await act(async () => controls()[0]!.click());
    await commitNavigation();
    expect((document.activeElement as HTMLElement).dataset.panelTrigger).toBe(id);
    expect(document.activeElement).toBe(sourceTrigger());
  });

  it("falls back to the parent heading when authorization removes the original source", async () => {
    locale = language;
    await act(async () => render());
    await drilldown();
    removeSource = true;
    await press("Escape");
    await commitNavigation();
    expect(document.activeElement).toBe(heading());
    expect(dialog().contains(document.activeElement)).toBe(true);
  });

  it.each(["UNAVAILABLE", "ACCESS_CHANGED", "RESTRICTED", "FAILED"] as const)(
    "retains one safe focus boundary for a %s source",
    async (kind) => {
      locale = language;
      await act(async () => render());
      const trigger = sourceTrigger();
      const id = trigger.dataset.panelTrigger;
      trigger.focus();
      await act(async () => trigger.click());
      await commitNavigation({ kind, requestId: "safe-reference" });
      expect(document.activeElement).toBe(heading());
      expect(host.querySelectorAll('[aria-modal="true"]')).toHaveLength(1);
      expect(dialog().querySelector("[data-source-key]")).toBeNull();
      expect(dialog().textContent).not.toContain("Imported stone");
      expect((await press("Tab", true)).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(controls()[0]);
      expect((await press("Tab")).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(controls()[0]);
      await press("Escape");
      await commitNavigation();
      expect((document.activeElement as HTMLElement).dataset.panelTrigger).toBe(id);
    },
  );

  it("unwinds source → conflict → source → claim one Escape at a time", async () => {
    locale = language;
    await act(async () => render());
    await drilldown();
    const conflict = [...dialog().querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === getEvidencePanelCopy(locale).inspectConflict,
    )!;
    const id = conflict.dataset.panelTrigger;
    conflict.focus();
    await act(async () => conflict.click());
    await commitNavigation();
    expect(selectionMode()).toBe("CONFLICT");
    expect(document.activeElement).toBe(heading());
    await press("Escape");
    await commitNavigation();
    expect(selectionMode()).toBe("SOURCE");
    expect((document.activeElement as HTMLElement).dataset.panelTrigger).toBe(id);
    await press("Escape");
    await commitNavigation();
    expect(selectionMode()).toBe("CLAIM");
    expect(document.activeElement).toBe(sourceTrigger());
  });

  it("restores a factor source trigger without changing the factor selection", async () => {
    locale = language;
    current = {
      mode: "FACTOR",
      comparisonRunId: claim.comparisonRunId,
      candidateProjectKey: "candidate-focus",
      factorKey: "AREA_SIMILARITY",
    };
    await act(async () => render());
    const id = await drilldown();
    await press("Escape");
    await commitNavigation();
    expect(selectionMode()).toBe("FACTOR");
    expect((document.activeElement as HTMLElement).dataset.panelTrigger).toBe(id);
    expect(new URLSearchParams(window.location.search).get("evidenceFactor")).toBe(
      "AREA_SIMILARITY",
    );
  });

  it("does not steal focus when the same source content re-renders", async () => {
    locale = language;
    await act(async () => render());
    await drilldown();
    const control = controls()[0]!;
    control.focus();
    scrollIntoView.mockClear();
    await act(async () => render());
    expect(document.activeElement).toBe(control);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it.each(["", "auto"])(
    "returns through the actual review controller and restores original overflow %j",
    async (originalOverflow) => {
      document.body.style.overflow = originalOverflow;
      locale = language;
      reviewFlow = true;
      current = null;
      window.history.replaceState(
        null,
        "",
        `/${locale}/projects/PROJECT/compare?run=run-focus&economics=economics-focus&selected=A%2CB&proposal=proposal_focus&reviewTitle=CHECK&reviewRationale=REVIEW_NEXT&reviewAssignee=iris&reviewDue=2026-12-20`,
      );
      await act(async () => render());
      const reviewTrigger = host.querySelector<HTMLButtonElement>(
        '[data-evidence-trigger-id="review-evidence-0"]',
      )!;
      reviewTrigger.focus();
      await act(async () => reviewTrigger.click());
      await commitNavigation();
      expect(selectionMode()).toBe("CLAIM");
      expect(host.querySelectorAll('[aria-modal="true"]')).toHaveLength(1);
      expect(host.querySelector("#review-title")).toBeNull();
      const id = await drilldown();
      const sourceRoute = new URLSearchParams(window.location.search);
      expect(sourceRoute.get("proposal")).toBe("proposal_focus");
      expect(sourceRoute.get("reviewEvidence")).toBe("1");
      expect(sourceRoute.get("evidenceReturn")).toBe("review-evidence-0");
      await press("Escape");
      await commitNavigation();
      expect((document.activeElement as HTMLElement).dataset.panelTrigger).toBe(id);
      await press("Escape");
      await commitNavigation();
      expect(current).toBeNull();
      expect(host.querySelectorAll('[aria-modal="true"]')).toHaveLength(1);
      expect(document.activeElement).toBe(
        host.querySelector('[data-evidence-trigger-id="review-evidence-0"]'),
      );
      expect(host.querySelector<HTMLSelectElement>("#review-title")!.value).toBe("CHECK");
      expect(host.querySelector<HTMLSelectElement>("#review-rationale")!.value).toBe("REVIEW_NEXT");
      expect(host.querySelector<HTMLSelectElement>("#review-assignee")!.value).toBe("iris");
      expect(host.querySelector<HTMLInputElement>("#review-dueDate")!.value).toBe("2026-12-20");
      expect(new URLSearchParams(window.location.search).get("proposal")).toBe("proposal_focus");
      expect(new URLSearchParams(window.location.search).has("reviewEvidence")).toBe(false);
      await press("Escape");
      await commitNavigation();
      expect(host.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(host.querySelector("#internal-review-entry"));
      expect(document.body.style.overflow).toBe(originalOverflow);
    },
  );

  it("uses a safe heading for a direct unavailable source route, without retaining source content", async () => {
    locale = language;
    current = { ...claim, mode: "SOURCE", sourceKey: sourceKeys[0]! };
    await act(async () => render({ kind: "UNAVAILABLE", requestId: "safe-reference" }));
    expect(document.activeElement).toBe(heading());
    await press("Escape");
    await commitNavigation();
    expect(selectionMode()).toBe("CLAIM");
    expect(document.activeElement).toBe(sourceTrigger(0));
  });
});

it("keeps the boundary on its heading if there are no enabled controls", async () => {
  const onClose = vi.fn();
  await act(async () =>
    root.render(
      createElement(EvidencePanel, {
        outcome: { kind: "UNAVAILABLE", requestId: "safe" },
        selection: claim,
        locale: "en",
        onClose,
        onNavigate: vi.fn(),
      }),
    ),
  );
  controls().forEach((button) => {
    button.disabled = true;
  });
  for (const reverse of [false, true]) {
    heading().blur();
    expect((await press("Tab", reverse)).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(heading());
  }
  await press("Escape");
  expect(onClose).toHaveBeenCalledOnce();
});
