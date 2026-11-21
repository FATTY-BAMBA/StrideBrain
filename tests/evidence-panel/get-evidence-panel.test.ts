import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EvidencePanel } from "@/components/evidence/evidence-panel";
import { describe, expect, it, vi } from "vitest";

import {
  GetEvidencePanel,
  evidenceSourceKey,
} from "@/modules/evidence-panel/application/get-evidence-panel";
import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";
import type { EvidencePanelSelection } from "@/modules/evidence-panel/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";
import type { EconomicsEnrichmentRunRepositoryPort } from "@/repositories/ports/economics-enrichment-run-repository";
import type {
  EvidenceFactorRecord,
  EvidencePanelRepositoryPort,
  EvidenceSourceRecord,
} from "@/repositories/ports/evidence-panel-repository";

const context: RuntimeContext = {
  requestId: "REQ-EVIDENCE-001",
  userId: "person-mei",
  membershipId: "membership-mei",
  organizationId: "org-horizon",
  role: "PROJECT_MANAGER_ESTIMATOR",
  capabilities: new Set([
    "project:read",
    "project:compare",
    "quote:read",
    "commercial:forecast-read",
    "commercial:actual-read",
    "evidence:read",
  ]),
  assignedProjectIds: new Set(["prj-xinyi", "prj-neihu"]),
  projectAssignments: new Map([
    ["prj-xinyi", { projectId: "prj-xinyi", canReadActuals: true, canCreateAction: false }],
    ["prj-neihu", { projectId: "prj-neihu", canReadActuals: true, canCreateAction: false }],
  ]),
  locale: "en",
  dataMode: "DEMO_SYNTHETIC",
};

const stage4: Stage4ComparisonResult = {
  version: "comparable-project-stage4.v1",
  run: {
    id: "cmprun-1",
    generatedAt: "2026-11-15T08:00:00.000Z",
    snapshotDate: "2026-11-15",
    status: "COMPLETE",
    eligibilityPolicyVersion: "CPI-ELIGIBILITY-1.0",
    policyVersion: "CPI-SIM-1.0",
    calculationVersion: "CPI-CALC-1.0",
    inputFingerprint: "input",
  },
  activeContext: {
    projectKey: "PRJ-XINYI-026",
    nameEn: "Xinyi Flagship Renovation",
    nameZhTw: "信義旗艦店裝修",
    comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
    subtype: "RETAIL_FLAGSHIP",
    areaValue: "640.000",
    areaUnit: "m2",
    currency: "TWD",
    location: { city: "Taipei City", district: "Xinyi District" },
    activeQuoteVersionKey: "Q-XINYI-026-v3",
  },
  summary: {
    authorizedCandidatesConsidered: 1,
    eligibleForScoring: 1,
    primaryMatchCount: 1,
    broaderMatchCount: 0,
    excludedByReason: {},
    factorsUsed: [
      "SUBTYPE",
      "SCOPE_OVERLAP",
      "AREA_SIMILARITY",
      "COMMERCIAL_CATEGORY_OVERLAP",
      "MATERIAL_OVERLAP",
      "SUPPLIER_OVERLAP",
      "COMPLETION_RECENCY",
      "LOCATION_PROXIMITY",
    ],
    missingOptionalContext: [],
  },
  matches: [
    {
      project: {
        projectKey: "PRJ-NEIHU-021",
        nameEn: "Neihu Tech Flagship",
        nameZhTw: "內湖科技旗艦店",
        subtype: "RETAIL_FLAGSHIP",
        location: { city: "Taipei City", district: "Neihu District" },
        areaValue: "610.000",
        areaUnit: "m2",
        completedAt: "2025-06-01",
      },
      rank: 1,
      score: "88.0000",
      displayScore: 88,
      band: "STRONG",
      evidenceCoverage: "100.0000",
      displayEvidenceCoverage: 100,
      tier: "PRIMARY",
      strongestFactors: [],
      differences: [],
      unknowns: [],
      equivalentWithinTwoPoints: [],
      policyVersion: "CPI-SIM-1.0",
    },
  ],
  broaderMatches: [],
  defaultSelectedProjectKeys: ["PRJ-NEIHU-021"],
};

const calculationTrace = {
  calculationVersion: "CPI-ECON-1.0" as const,
  policyVersions: ["EVIDENCE-AUTHORITY-1.0"] as const,
  operation: "CATEGORY_VARIANCE",
  inputs: [
    {
      observationId: "pcv-neihu",
      projectKey: "PRJ-NEIHU-021",
      normalizedValue: "3114.754098",
      unit: "TWD_PER_M2",
      evidenceReferenceIds: ["evid-stone-neihu"],
    },
  ],
  aggregation: "MEDIAN_MIN_MAX",
  result: { variancePercent: "18.3882" },
  rounding: "HALF_UP",
  generatedAt: "2026-11-15T08:05:00.000Z",
};

const stage5 = {
  version: "comparable-project-stage5.v1",
  run: {
    id: "econrun-1",
    comparisonRunId: "cmprun-1",
    generatedAt: "2026-11-15T08:05:00.000Z",
    snapshotDate: "2026-11-15",
    status: "PARTIAL_ECONOMICS",
    authorityPolicyVersion: "EVIDENCE-AUTHORITY-1.0",
    calculationVersion: "CPI-ECON-1.0",
    inputFingerprint: "input",
    sourceFingerprint: "source",
    permissionFingerprint: "permission",
  },
  accessScope: "FULL_ACTUAL",
  structuralResultFingerprint: "structural",
  selectedProjectKeys: ["PRJ-NEIHU-021"],
  states: ["PARTIAL_ECONOMICS"],
  summary: {
    quotedHistoryState: "SUFFICIENT",
    actualHistoryState: "SUFFICIENT",
    actualEligibleProjectCount: 3,
    staleSupplierOfferCount: 0,
    conflictCount: 0,
  },
  current: { quoteBeforeTax: "16480000.00", forecastDirectCost: "12650000.00", currency: "TWD" },
  overall: {
    quotedHistory: {
      state: "UNAVAILABLE",
      observationType: "QUOTED_PRICE",
      requiredObservationCount: 3,
    },
    actualHistory: {
      state: "UNAVAILABLE",
      observationType: "RECONCILED_ACTUAL_COST",
      requiredObservationCount: 3,
    },
    quoteVariance: { state: "UNAVAILABLE", currentBasis: "QUOTE", historyBasis: "QUOTED_PRICE" },
    forecastVariance: {
      state: "UNAVAILABLE",
      currentBasis: "FORECAST",
      historyBasis: "RECONCILED_ACTUAL_COST",
    },
  },
  categories: [],
  programmeDifference: {
    state: "UNAVAILABLE",
    quantifiedPremiumState: "UNQUANTIFIED",
    evidenceReferenceIds: [],
  },
  supplierOffers: [],
  claims: [
    {
      claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      kind: "CATEGORY_FORECAST_ACTUAL_VARIANCE",
      titleEn: "Imported stone forecast versus actual history",
      titleZhTw: "進口石材預估與實際成本比較",
      value: {
        currentAmount: "2360000.00",
        baselineEquivalentAmount: "1993442.62",
        variancePercent: "18.3882",
      },
      evidenceReferenceIds: ["evid-stone-neihu"],
      warningCodes: [],
      calculationTrace,
    },
  ],
  evidenceBundles: [
    {
      claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      sources: [
        {
          referenceId: "evid-stone-neihu",
          subjectType: "COST_LINE",
          subjectId: "cost-line-neihu-stone",
          locator: { lineNumber: 1, categoryId: "IMPORTED_STONE" },
          claimKey: "actual-cost:IMPORTED_STONE",
          authorityState: "RECONCILED_ACTUAL",
          observationType: "RECONCILED_ACTUAL_COST",
          dataClassification: "DEMO_SYNTHETIC",
          conflictIds: [],
        },
      ],
      calculationTrace,
      warningCodes: [],
    },
  ],
} satisfies Stage5EconomicsResult;

const source: EvidenceSourceRecord = {
  referenceId: "evid-stone-neihu",
  subjectType: "COST_LINE",
  subjectId: "cost-line-neihu-stone",
  claimKey: "actual-cost:IMPORTED_STONE",
  locator: { lineNumber: 1, categoryId: "IMPORTED_STONE" },
  supportedValue: { amount: "1900000.00" },
  authorityState: "RECONCILED_ACTUAL",
  observationType: "RECONCILED_ACTUAL_COST",
  dataClassification: "DEMO_SYNTHETIC",
  effectiveAt: "2025-07-01T00:00:00.000Z",
  projectId: "prj-neihu",
  projectKey: "PRJ-NEIHU-021",
  projectNameEn: "Neihu Tech Flagship",
  projectNameZhTw: "內湖科技旗艦店",
  titleEn: "Imported stone final cost",
  titleZhTw: "進口石材最終成本",
  versionLabel: "v1",
  previewFields: [
    { key: "category", value: "IMPORTED_STONE" },
    { key: "amount", value: "1900000.00" },
  ],
  previewState: "STRUCTURED",
  conflictKeys: [],
};

const factor: EvidenceFactorRecord = {
  comparisonRunId: "cmprun-1",
  candidateProjectId: "prj-neihu",
  candidateProjectKey: "PRJ-NEIHU-021",
  candidateProjectNameEn: "Neihu Tech Flagship",
  candidateProjectNameZhTw: "內湖科技旗艦店",
  factorKey: "AREA_SIMILARITY",
  state: "KNOWN",
  weight: "20.0000",
  normalizedValue: "0.9314",
  contribution: "18.6280",
  explanation: { activeArea: "640", candidateArea: "610" },
  evidenceReferenceIds: ["evid-stone-neihu"],
  totalScore: "88.0000",
  evidenceCoverage: "100.0000",
};

function service(overrides: Partial<EvidencePanelRepositoryPort> = {}) {
  const comparisons: ComparisonRunRepositoryPort = {
    persistComplete: vi.fn(),
    getAuthorizedResult: vi.fn().mockResolvedValue(stage4),
  };
  const economics: EconomicsEnrichmentRunRepositoryPort = {
    persistComplete: vi.fn(),
    getAuthorizedResult: vi.fn().mockResolvedValue(stage5),
  };
  const evidence: EvidencePanelRepositoryPort = {
    getAuthorizedSources: vi.fn().mockResolvedValue({ kind: "COMPLETE", sources: [source] }),
    getAuthorizedFactor: vi.fn().mockResolvedValue(factor),
    getAuthorizedConflict: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
  return new GetEvidencePanel(comparisons, economics, evidence, {
    check: async () => ({
      comparisonRunId: stage4.run.id,
      enrichmentRunId: stage5.run.id,
      state: "CURRENT",
      changedSources: [],
    }),
  });
}

describe("GetEvidencePanel", () => {
  it("builds a claim-first panel with exact sources and calculation trace", async () => {
    const outcome = await service().execute(
      context,
      {
        mode: "CLAIM",
        comparisonRunId: "cmprun-1",
        enrichmentRunId: "econrun-1",
        claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      },
      "en",
    );

    expect(outcome.kind).toBe("READY");
    if (outcome.kind !== "READY") throw new Error("READY_REQUIRED");
    expect(outcome.view.mode).toBe("CLAIM");
    expect(outcome.view.sources).toHaveLength(1);
    expect(outcome.view.sources[0]?.sourceKey).toBe(
      evidenceSourceKey("cmprun-1", "evid-stone-neihu"),
    );
    expect(outcome.view.sources[0]?.sourceKey).not.toContain("evid-stone-neihu");
    expect(outcome.view.trace?.kind).toBe("FINANCIAL");
    expect(outcome.view.claim?.valueLabel).toContain("+18.4%");
  });

  it("builds an explainable factor panel without model prose", async () => {
    const outcome = await service().execute(
      context,
      {
        mode: "FACTOR",
        comparisonRunId: "cmprun-1",
        candidateProjectKey: "PRJ-NEIHU-021",
        factorKey: "AREA_SIMILARITY",
      },
      "zh-TW",
    );

    expect(outcome.kind).toBe("READY");
    if (outcome.kind !== "READY") throw new Error("READY_REQUIRED");
    expect(outcome.view.trace).toMatchObject({
      kind: "FACTOR",
      policyVersion: "CPI-SIM-1.0",
      contributionLabel: "18.6",
    });
    expect(outcome.view.heading.title).toContain("面積相似度");
  });

  it("fails closed when current source access changed", async () => {
    const outcome = await service({
      getAuthorizedSources: vi.fn().mockResolvedValue({ kind: "ACCESS_CHANGED" }),
    }).execute(
      context,
      {
        mode: "CLAIM",
        comparisonRunId: "cmprun-1",
        enrichmentRunId: "econrun-1",
        claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      },
      "en",
    );

    expect(outcome).toEqual({ kind: "ACCESS_CHANGED", requestId: "REQ-EVIDENCE-001" });
  });

  it("opens a source only through an opaque source key bound to the run", async () => {
    const sourceKey = evidenceSourceKey("cmprun-1", "evid-stone-neihu");
    const outcome = await service().execute(
      context,
      {
        mode: "SOURCE",
        comparisonRunId: "cmprun-1",
        enrichmentRunId: "econrun-1",
        sourceKey,
        claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      },
      "en",
    );
    expect(outcome.kind).toBe("READY");
    if (outcome.kind !== "READY") throw new Error("READY_REQUIRED");
    expect(outcome.view.mode).toBe("SOURCE");
    expect(outcome.view.sources).toHaveLength(1);
    expect(outcome.view.relatedClaims).toEqual([
      {
        claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
        title: "Imported stone forecast versus actual history",
        kindLabel: "Category forecast versus actual history",
      },
    ]);
    expect(outcome.view.backSelection?.mode).toBe("CLAIM");
  });

  it("rejects a source key that is not part of the selected immutable evidence bundle", async () => {
    const outcome = await service().execute(
      context,
      {
        mode: "SOURCE",
        comparisonRunId: "cmprun-1",
        enrichmentRunId: "econrun-1",
        sourceKey: "aaaaaaaaaaaaaaaaaaaaaaaa",
        claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      },
      "en",
    );
    expect(outcome).toEqual({ kind: "UNAVAILABLE", requestId: "REQ-EVIDENCE-001" });
  });
  it("binds a conflict to a source already present in the authorized immutable bundle", async () => {
    const conflictedSource = { ...source, conflictKeys: ["CONFLICT-STONE-1"] };
    const getAuthorizedConflict = vi.fn().mockResolvedValue({
      conflictKey: "CONFLICT-STONE-1",
      status: "OPEN",
      sources: [conflictedSource],
    });
    const outcome = await service({
      getAuthorizedSources: vi.fn().mockResolvedValue({
        kind: "COMPLETE",
        sources: [conflictedSource],
      }),
      getAuthorizedConflict,
    }).execute(
      context,
      {
        mode: "CONFLICT",
        comparisonRunId: "cmprun-1",
        enrichmentRunId: "econrun-1",
        conflictKey: "CONFLICT-STONE-1",
        sourceKey: evidenceSourceKey("cmprun-1", "evid-stone-neihu"),
        claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      },
      "en",
    );

    expect(outcome.kind).toBe("READY");
    if (outcome.kind !== "READY") throw new Error("READY_REQUIRED");
    expect(outcome.view.conflict?.conflictKey).toBe("CONFLICT-STONE-1");
    expect(getAuthorizedConflict).toHaveBeenCalledOnce();
  });

  it("rejects conflict enumeration outside the selected source bundle", async () => {
    const getAuthorizedConflict = vi.fn();
    const outcome = await service({ getAuthorizedConflict }).execute(
      context,
      {
        mode: "CONFLICT",
        comparisonRunId: "cmprun-1",
        enrichmentRunId: "econrun-1",
        conflictKey: "UNRELATED-CONFLICT",
        sourceKey: evidenceSourceKey("cmprun-1", "evid-stone-neihu"),
        claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      },
      "en",
    );

    expect(outcome).toEqual({ kind: "UNAVAILABLE", requestId: "REQ-EVIDENCE-001" });
    expect(getAuthorizedConflict).not.toHaveBeenCalled();
  });
});

describe("QA-16/18 rendered evidence localization and financial authority", () => {
  const selection = {
    mode: "CLAIM" as const,
    comparisonRunId: "cmprun-1",
    enrichmentRunId: "econrun-1",
    claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
  };
  it.each(["en", "zh-TW"] as const)(
    "F-03 localizes programmeWeeks in claim, source and factor rendering in %s without changing provenance",
    async (locale) => {
      const original = {
        ...source,
        locator: { kind: "project", field: "programmeWeeks" },
        previewFields: [{ key: "programmeWeeks", value: "19.00" }],
      };
      const snapshot = JSON.stringify(original);
      const selections: EvidencePanelSelection[] = [
        selection,
        {
          ...selection,
          mode: "SOURCE",
          sourceKey: evidenceSourceKey("cmprun-1", original.referenceId),
        },
        {
          mode: "FACTOR",
          comparisonRunId: "cmprun-1",
          candidateProjectKey: "PRJ-NEIHU-021",
          factorKey: "AREA_SIMILARITY",
        },
      ];
      for (const selected of selections) {
        const outcome = await service({
          getAuthorizedSources: vi
            .fn()
            .mockResolvedValue({ kind: "COMPLETE", sources: [original] }),
        }).execute(context, selected, locale);
        if (outcome.kind !== "READY") throw Error("READY_REQUIRED");
        const label = locale === "zh-TW" ? "工期（週）" : "Programme in weeks";
        expect(outcome.view.sources[0]?.locatorLabel).toContain(label);
        expect(outcome.view.sources[0]?.preview).toMatchObject({
          fields: [{ label, value: "19.00" }],
        });
        const markup = renderToStaticMarkup(
          createElement(EvidencePanel, {
            outcome,
            locale,
            onClose: () => {},
            onNavigate: () => {},
          }),
        );
        // Covers visible source cards/exact locators and all accessible attributes.
        expect(markup).toContain(label);
        expect(markup).not.toContain("programmeWeeks");
        expect(JSON.stringify(original)).toBe(snapshot);
        expect(original.locator.field).toBe("programmeWeeks");
      }
    },
  );
  it.each(["en", "zh-TW"] as const)(
    "renders every source observation type accurately in %s without changing stored authority",
    async (locale) => {
      const pairs = [
        ["QUOTED_PRICE", "APPROVED_COMMERCIAL", "Quoted price", "報價"],
        ["SUPPLIER_OFFER", "APPROVED_COMMERCIAL", "Supplier offer", "供應商報價"],
        ["FORECAST_DIRECT_COST", "HUMAN_REVIEWED", "Forecast direct cost", "預估直接成本"],
        ["RECONCILED_ACTUAL_COST", "RECONCILED_ACTUAL", "Reconciled actual cost", "已核對實際成本"],
      ] as const;
      for (const [observationType, authorityState, en, zh] of pairs) {
        const original = { ...source, observationType, authorityState };
        const snapshot = JSON.stringify(original);
        const outcome = await service({
          getAuthorizedSources: vi
            .fn()
            .mockResolvedValue({ kind: "COMPLETE", sources: [original] }),
        }).execute(context, selection, locale);
        if (outcome.kind !== "READY") throw Error("READY_REQUIRED");
        expect(outcome.view.sources[0]).toMatchObject({
          observationType,
          authorityState,
          observationTypeLabel: locale === "en" ? en : zh,
        });
        const html = renderToStaticMarkup(
          createElement(EvidencePanel, {
            outcome,
            locale,
            onClose: () => {},
            onNavigate: () => {},
          }),
        );
        const text = html.replace(/<[^>]*>/g, " ");
        expect(text).toContain(locale === "en" ? en : zh);
        expect(text).not.toMatch(
          /IMPORTED_STONE|HALF_UP|TWD_PER_M2|source\(s\)|CPI-SIM|CPI-ECON|Currentnormalizedamount|Descriptionen|Unitprice|Code:|State:/,
        );
        expect(JSON.stringify(original)).toBe(snapshot);
      }
    },
  );
  it("selects the Chinese source description, retains exact line/version locator and translates the factor method", async () => {
    const localizedSource = {
      ...source,
      locator: {
        kind: "forecast-cost-line",
        lineNumber: 4,
        categoryId: "IMPORTED_STONE",
        version: "v3",
      },
      previewFields: [
        { key: "descriptionEn", value: "Imported stone and hard finishes" },
        { key: "descriptionZhTw", value: "進口石材與硬質面材" },
        { key: "unitPrice", value: "2360000.00" },
        { key: "unit", value: "lot" },
        { key: "status", value: "APPROVED" },
      ],
    };
    const outcome = await service({
      getAuthorizedSources: vi
        .fn()
        .mockResolvedValue({ kind: "COMPLETE", sources: [localizedSource] }),
      getAuthorizedFactor: vi.fn().mockResolvedValue({
        ...factor,
        explanation: { code: "scope_overlap.jaccard", state: "KNOWN" },
      }),
    }).execute(
      context,
      {
        mode: "FACTOR",
        comparisonRunId: "cmprun-1",
        candidateProjectKey: "PRJ-NEIHU-021",
        factorKey: "SCOPE_OVERLAP",
      },
      "zh-TW",
    );
    if (outcome.kind !== "READY") throw Error("READY_REQUIRED");
    expect(outcome.view.sources[0]?.locatorLabel).toBe(
      "紀錄類型: 預估成本項目 · 項目編號: 4 · 分類: 進口石材 · 版本: v3",
    );
    const text = renderToStaticMarkup(
      createElement(EvidencePanel, {
        outcome,
        locale: "zh-TW",
        onClose: () => {},
        onNavigate: () => {},
      }),
    ).replace(/<[^>]*>/g, " ");
    expect(text).toContain("進口石材與硬質面材");
    expect(text).toContain("NT$2,360,000");
    expect(text).toContain("共同工作範圍分類數占全部不重複分類數的比例");
    expect(text).not.toMatch(/Imported stone|scope_overlap|KNOWN|Code|State|CPI-/);
  });
});

it("preserves exact source business identifiers and uppercase prose while translating known enum headings", async () => {
  const preserved = {
    ...source,
    titleEn: "Xinyi · Q-XINYI-026-v3 · LED / HVAC",
    titleZhTw: "信義 · Q-XINYI-026-v3 · LED / HVAC",
    previewFields: [
      { key: "descriptionEn", value: "LED" },
      { key: "descriptionZhTw", value: "HVAC" },
    ],
  };
  for (const locale of ["en", "zh-TW"] as const) {
    const outcome = await service({
      getAuthorizedSources: vi.fn().mockResolvedValue({ kind: "COMPLETE", sources: [preserved] }),
    }).execute(
      context,
      {
        mode: "CLAIM",
        comparisonRunId: "cmprun-1",
        enrichmentRunId: "econrun-1",
        claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      },
      locale,
    );
    if (outcome.kind !== "READY") throw Error("READY_REQUIRED");
    expect(outcome.view.sources[0]?.title).toContain("Q-XINYI-026-v3 · LED / HVAC");
    expect(outcome.view.sources[0]?.preview).toEqual({
      state: "STRUCTURED",
      fields: [
        {
          label: locale === "en" ? "Description" : "內容說明",
          value: locale === "en" ? "LED" : "HVAC",
        },
      ],
    });
  }
});
