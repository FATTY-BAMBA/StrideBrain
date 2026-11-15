import { describe, expect, it } from "vitest";

import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type {
  AuthorizedEconomicsBatch,
  EconomicsLineSnapshot,
  EconomicsProjectSnapshot,
  EvidenceReferenceSnapshot,
  FinancialObservationRecord,
  HistoricalEconomicsAssemblyInput,
} from "@/modules/economics/domain/contracts";
import { HistoricalEconomicsService } from "@/modules/economics/domain/historical-economics-service";

const SNAPSHOT_DATE = "2026-11-15";

function stage4Match(projectKey: string, rank: number, score: number) {
  return Object.freeze({
    project: Object.freeze({
      projectKey,
      nameEn: projectKey,
      nameZhTw: projectKey,
      subtype: "RETAIL_FLAGSHIP",
      location: Object.freeze({ city: "Taipei City" }),
      areaValue: rank === 1 ? "610.000" : rank === 2 ? "590.000" : "720.000",
      areaUnit: "m2",
      completedAt: "2026-01-01",
    }),
    rank,
    score: `${score}.0000`,
    displayScore: score,
    band: score >= 80 ? "STRONG" : "RELEVANT",
    evidenceCoverage: "100.0000",
    displayEvidenceCoverage: 100,
    tier: "PRIMARY",
    strongestFactors: Object.freeze([]),
    differences: Object.freeze([]),
    unknowns: Object.freeze([]),
    equivalentWithinTwoPoints: Object.freeze([]),
    policyVersion: "CPI-SIM-1.0",
  });
}

function stage4Result(): Stage4ComparisonResult {
  return Object.freeze({
    version: "comparable-project-stage4.v1",
    run: Object.freeze({
      id: "cmprun_stage4",
      generatedAt: "2026-11-14T12:00:00.000Z",
      snapshotDate: SNAPSHOT_DATE,
      status: "COMPLETE",
      eligibilityPolicyVersion: "CPI-ELIGIBILITY-1.0",
      policyVersion: "CPI-SIM-1.0",
      calculationVersion: "CPI-CALC-1.0",
      inputFingerprint: "stage4-input",
    }),
    activeContext: Object.freeze({
      projectKey: "PRJ-XINYI-026",
      nameEn: "Xinyi Flagship Renovation",
      nameZhTw: "信義旗艦店裝修",
      comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
      subtype: "RETAIL_FLAGSHIP",
      areaValue: "640.000",
      areaUnit: "m2",
      currency: "TWD",
      location: Object.freeze({ city: "Taipei City", district: "Xinyi District" }),
      activeQuoteVersionKey: "Q-XINYI-026-v3",
    }),
    summary: Object.freeze({
      authorizedCandidatesConsidered: 3,
      eligibleForScoring: 3,
      primaryMatchCount: 3,
      broaderMatchCount: 0,
      excludedByReason: Object.freeze({}),
      factorsUsed: Object.freeze([]),
      missingOptionalContext: Object.freeze([]),
    }),
    matches: Object.freeze([
      stage4Match("PRJ-NEIHU-021", 1, 88),
      stage4Match("PRJ-ZHONGSHAN-018", 2, 81),
      stage4Match("PRJ-NANJING-023", 3, 79),
    ]),
    broaderMatches: Object.freeze([]),
    defaultSelectedProjectKeys: Object.freeze([
      "PRJ-NEIHU-021",
      "PRJ-ZHONGSHAN-018",
      "PRJ-NANJING-023",
    ]),
  }) as Stage4ComparisonResult;
}
function project(
  internalId: string,
  businessKey: string,
  status: EconomicsProjectSnapshot["status"],
  areaValue: string,
  programmeWeeks: string,
): EconomicsProjectSnapshot {
  return Object.freeze({
    internalId,
    businessKey,
    status,
    areaValue,
    areaUnit: "m2",
    currency: "TWD",
    programmeWeeks,
    dataClassification: "DEMO_SYNTHETIC",
    evidenceReferenceIds: Object.freeze([`evid_programme_${internalId}`]),
  });
}

const projects = Object.freeze([
  project("prj_xinyi", "PRJ-XINYI-026", "ACTIVE", "640.000", "16.00"),
  project("prj_neihu", "PRJ-NEIHU-021", "COMPLETED", "610.000", "20.00"),
  project("prj_zhongshan", "PRJ-ZHONGSHAN-018", "COMPLETED", "590.000", "19.00"),
  project("prj_nanjing", "PRJ-NANJING-023", "COMPLETED", "720.000", "22.00"),
]);

function line(
  recordId: string,
  subjectType: EconomicsLineSnapshot["subjectType"],
  lineNumber: number,
  categoryId: string,
  amount: string,
  authorityState: EconomicsLineSnapshot["authorityState"],
): EconomicsLineSnapshot {
  return Object.freeze({
    id: `${recordId}_line_${lineNumber}`,
    subjectType,
    lineNumber,
    categoryId,
    amount,
    quantity: "1.000",
    unitRate: `${amount.replace(/\.\d+$/, "")}.000000`,
    unit: "lot",
    authorityState,
    evidenceReferenceIds: Object.freeze([`evid_${recordId}_line_${lineNumber}`]),
  });
}

function record(input: {
  id: string;
  projectId: string;
  projectKey: string;
  recordKey: string;
  subjectType: FinancialObservationRecord["subjectType"];
  observationType: FinancialObservationRecord["observationType"];
  authorityState: FinancialObservationRecord["authorityState"];
  totalAmount: string;
  effectiveAt: string;
  lines: readonly EconomicsLineSnapshot[];
  validUntil?: string;
}): FinancialObservationRecord {
  return Object.freeze({
    id: input.id,
    projectId: input.projectId,
    projectKey: input.projectKey,
    recordKey: input.recordKey,
    versionNumber: 1,
    subjectType: input.subjectType,
    observationType: input.observationType,
    authorityState: input.authorityState,
    currency: "TWD",
    totalAmount: input.totalAmount,
    effectiveAt: input.effectiveAt,
    ...(input.validUntil ? { validUntil: input.validUntil } : {}),
    conflictIds: Object.freeze([]),
    evidenceReferenceIds: Object.freeze(input.lines.flatMap((item) => item.evidenceReferenceIds)),
    dataClassification: "DEMO_SYNTHETIC",
    lines: Object.freeze([...input.lines]),
  });
}

function quoteRecord(
  id: string,
  projectId: string,
  projectKey: string,
  totalAmount: string,
  values: readonly [string, string][],
  authorityState: "HUMAN_REVIEWED" | "APPROVED_COMMERCIAL",
): FinancialObservationRecord {
  return record({
    id,
    projectId,
    projectKey,
    recordKey: id.toUpperCase(),
    subjectType: "QUOTE_VERSION",
    observationType: "QUOTED_PRICE",
    authorityState,
    totalAmount,
    effectiveAt: "2026-01-01",
    lines: values.map(([categoryId, amount], index) =>
      line(id, "QUOTE_ITEM", index + 1, categoryId, amount, authorityState),
    ),
  });
}

function forecastRecord(): FinancialObservationRecord {
  const id = "forecast_xinyi";
  const values: readonly [string, string][] = [
    ["DEMOLITION_CEILING", "3100000.00"],
    ["CUSTOM_MILLWORK", "3060000.00"],
    ["LIGHTING_ELECTRICAL", "2350000.00"],
    ["IMPORTED_STONE", "2360000.00"],
    ["SIGNAGE", "650000.00"],
    ["COORDINATION", "1130000.00"],
  ];
  return record({
    id,
    projectId: "prj_xinyi",
    projectKey: "PRJ-XINYI-026",
    recordKey: "FCV-XINYI-1",
    subjectType: "FORECAST_COST_VERSION",
    observationType: "FORECAST_DIRECT_COST",
    authorityState: "HUMAN_REVIEWED",
    totalAmount: "12650000.00",
    effectiveAt: "2026-11-14",
    lines: values.map(([categoryId, amount], index) =>
      line(id, "FORECAST_COST_LINE", index + 1, categoryId, amount, "HUMAN_REVIEWED"),
    ),
  });
}

function actualRecord(
  id: string,
  projectId: string,
  projectKey: string,
  totalAmount: string,
  values: readonly [string, string][],
): FinancialObservationRecord {
  return record({
    id,
    projectId,
    projectKey,
    recordKey: id.toUpperCase(),
    subjectType: "PROJECT_COST_VERSION",
    observationType: "RECONCILED_ACTUAL_COST",
    authorityState: "RECONCILED_ACTUAL",
    totalAmount,
    effectiveAt: "2026-03-01",
    lines: values.map(([categoryId, amount], index) =>
      line(id, "COST_LINE", index + 1, categoryId, amount, "RECONCILED_ACTUAL"),
    ),
  });
}

const records = Object.freeze([
  quoteRecord(
    "quote_xinyi",
    "prj_xinyi",
    "PRJ-XINYI-026",
    "16480000.00",
    [
      ["DEMOLITION_CEILING", "4000000.00"],
      ["CUSTOM_MILLWORK", "3800000.00"],
      ["LIGHTING_ELECTRICAL", "3100000.00"],
      ["IMPORTED_STONE", "3000000.00"],
      ["SIGNAGE", "1140000.00"],
      ["COORDINATION", "1440000.00"],
    ],
    "HUMAN_REVIEWED",
  ),
  quoteRecord(
    "quote_neihu",
    "prj_neihu",
    "PRJ-NEIHU-021",
    "15120000.00",
    [
      ["DEMOLITION_CEILING", "3700000.00"],
      ["CUSTOM_MILLWORK", "3600000.00"],
      ["LIGHTING_ELECTRICAL", "2700000.00"],
      ["IMPORTED_STONE", "2000000.00"],
      ["SIGNAGE", "1150000.00"],
      ["COORDINATION", "1970000.00"],
    ],
    "APPROVED_COMMERCIAL",
  ),
  quoteRecord(
    "quote_zhongshan",
    "prj_zhongshan",
    "PRJ-ZHONGSHAN-018",
    "13950000.00",
    [
      ["DEMOLITION_CEILING", "3400000.00"],
      ["CUSTOM_MILLWORK", "3200000.00"],
      ["LIGHTING_ELECTRICAL", "2844000.00"],
      ["IMPORTED_STONE", "1900000.00"],
      ["SIGNAGE", "1200000.00"],
      ["COORDINATION", "1406000.00"],
    ],
    "APPROVED_COMMERCIAL",
  ),
  quoteRecord(
    "quote_nanjing",
    "prj_nanjing",
    "PRJ-NANJING-023",
    "17300000.00",
    [
      ["DEMOLITION_CEILING", "4200000.00"],
      ["CUSTOM_MILLWORK", "4200000.00"],
      ["LIGHTING_ELECTRICAL", "3000000.00"],
      ["IMPORTED_STONE", "2400000.00"],
      ["SIGNAGE", "1250000.00"],
      ["COORDINATION", "2250000.00"],
    ],
    "APPROVED_COMMERCIAL",
  ),
  forecastRecord(),
  actualRecord("actual_neihu", "prj_neihu", "PRJ-NEIHU-021", "11580000.00", [
    ["DEMOLITION_CEILING", "2700000.00"],
    ["CUSTOM_MILLWORK", "3000000.00"],
    ["LIGHTING_ELECTRICAL", "2000000.00"],
    ["IMPORTED_STONE", "1900000.00"],
    ["SIGNAGE", "700000.00"],
    ["COORDINATION", "1280000.00"],
  ]),
  actualRecord("actual_zhongshan", "prj_zhongshan", "PRJ-ZHONGSHAN-018", "10840000.00", [
    ["DEMOLITION_CEILING", "2500000.00"],
    ["CUSTOM_MILLWORK", "2900000.00"],
    ["LIGHTING_ELECTRICAL", "1900000.00"],
    ["IMPORTED_STONE", "2000000.00"],
    ["SIGNAGE", "650000.00"],
    ["COORDINATION", "890000.00"],
  ]),
  actualRecord("actual_nanjing", "prj_nanjing", "PRJ-NANJING-023", "13420000.00", [
    ["DEMOLITION_CEILING", "3300000.00"],
    ["CUSTOM_MILLWORK", "3200000.00"],
    ["IMPORTED_STONE", "2100000.00"],
    ["SIGNAGE", "850000.00"],
    ["COORDINATION", "3970000.00"],
  ]),
  record({
    id: "offer_stale",
    projectId: "prj_neihu",
    projectKey: "PRJ-NEIHU-021",
    recordKey: "SUP-OFFER-STONE-2025-041",
    subjectType: "SUPPLIER_OFFER",
    observationType: "SUPPLIER_OFFER",
    authorityState: "APPROVED_COMMERCIAL",
    totalAmount: "1850000.00",
    effectiveAt: "2025-01-15",
    validUntil: "2025-02-15",
    lines: Object.freeze([
      line(
        "offer_stale",
        "SUPPLIER_OFFER_ITEM",
        1,
        "IMPORTED_STONE",
        "1850000.00",
        "APPROVED_COMMERCIAL",
      ),
    ]),
  }),
]);

function evidenceForRecords(
  sourceRecords: readonly FinancialObservationRecord[],
): readonly EvidenceReferenceSnapshot[] {
  const financialEvidence = sourceRecords.flatMap((sourceRecord) =>
    sourceRecord.lines.flatMap((sourceLine) =>
      sourceLine.evidenceReferenceIds.map((id) =>
        Object.freeze({
          id,
          subjectType: sourceLine.subjectType,
          subjectId: sourceLine.id,
          locator: Object.freeze({ kind: "structured-line", lineNumber: sourceLine.lineNumber }),
          claimKey: `${sourceRecord.observationType}:${sourceLine.categoryId}`,
          supportedValue: Object.freeze({ amount: sourceLine.amount, currency: "TWD" }),
          authorityState: sourceLine.authorityState,
          observationType: sourceRecord.observationType,
          dataClassification: "DEMO_SYNTHETIC" as const,
          effectiveAt: sourceRecord.effectiveAt,
          conflictIds: Object.freeze([]),
        }),
      ),
    ),
  );
  const programmeEvidence = projects.map((sourceProject) =>
    Object.freeze({
      id: sourceProject.evidenceReferenceIds[0]!,
      subjectType: "PROJECT" as const,
      subjectId: sourceProject.internalId,
      locator: Object.freeze({ kind: "structured-field", field: "programmeWeeks" }),
      claimKey: "project:programmeWeeks",
      supportedValue: Object.freeze({ value: sourceProject.programmeWeeks, unit: "weeks" }),
      authorityState: "HUMAN_REVIEWED" as const,
      dataClassification: "DEMO_SYNTHETIC" as const,
      effectiveAt: SNAPSHOT_DATE,
      conflictIds: Object.freeze([]),
    }),
  );
  return Object.freeze([...financialEvidence, ...programmeEvidence]);
}

function fullBatch(): AuthorizedEconomicsBatch {
  return Object.freeze({
    structuralResult: stage4Result(),
    comparisonRunId: "cmprun_stage4",
    activeProjectId: "prj_xinyi",
    activeProjectKey: "PRJ-XINYI-026",
    selectedProjectIds: Object.freeze(["prj_neihu", "prj_zhongshan", "prj_nanjing"]),
    selectedProjectKeys: Object.freeze(["PRJ-NEIHU-021", "PRJ-ZHONGSHAN-018", "PRJ-NANJING-023"]),
    accessScope: "FULL_ACTUAL",
    canReadEvidence: true,
    projects,
    records,
    evidence: evidenceForRecords(records),
    diagnostics: Object.freeze({
      databaseQueries: 3,
      projectRowsReturned: 4,
      financialRecordsReturned: records.length,
      evidenceRowsReturned: evidenceForRecords(records).length,
      maximumSelectedProjects: 3,
    }),
  });
}

function input(batch: AuthorizedEconomicsBatch = fullBatch()): HistoricalEconomicsAssemblyInput {
  return Object.freeze({
    stage4: stage4Result(),
    batch,
    enrichmentRunId: "econrun_stage5",
    generatedAt: "2026-11-15T00:00:00.000Z",
    snapshotDate: SNAPSHOT_DATE,
    inputFingerprint: "input-fingerprint",
    sourceFingerprint: "source-fingerprint",
    permissionFingerprint: "permission-fingerprint",
    structuralResultFingerprint: "stage4-result-fingerprint",
  });
}

describe("HistoricalEconomicsService", () => {
  const service = new HistoricalEconomicsService();

  it("derives the canonical normalized Horizon findings without changing Stage 4", () => {
    const assembly = service.assemble(input());
    const result = assembly.result;

    expect(result.structuralResultFingerprint).toBe("stage4-result-fingerprint");
    expect(result.selectedProjectKeys).toEqual(stage4Result().defaultSelectedProjectKeys);
    expect(result.current).toEqual({
      quoteBeforeTax: "16480000.00",
      forecastDirectCost: "12650000.00",
      currency: "TWD",
    });
    expect(result.overall.quoteVariance).toMatchObject({
      state: "VALUE",
      variancePercent: "7.1676",
      direction: "ABOVE",
      baselineEquivalentAmount: "15377777.78",
    });
    expect(result.overall.forecastVariance).toMatchObject({
      state: "VALUE",
      variancePercent: "6.0451",
      direction: "ABOVE",
      baselineEquivalentAmount: "11928888.89",
    });

    const stone = result.categories.find((category) => category.categoryId === "IMPORTED_STONE");
    const lighting = result.categories.find(
      (category) => category.categoryId === "LIGHTING_ELECTRICAL",
    );
    const millwork = result.categories.find(
      (category) => category.categoryId === "CUSTOM_MILLWORK",
    );

    expect(stone?.forecastVariance).toMatchObject({
      state: "VALUE",
      variancePercent: "18.3882",
      direction: "ABOVE",
    });
    expect(lighting?.quoteVariance).toMatchObject({
      state: "VALUE",
      variancePercent: "9.4329",
      direction: "ABOVE",
    });
    expect(lighting?.actualHistory).toMatchObject({
      state: "INSUFFICIENT",
      eligibleObservationCount: 2,
      requiredObservationCount: 3,
    });
    expect(millwork?.forecastVariance).toMatchObject({
      state: "VALUE",
      variancePercent: "-2.7263",
      direction: "ALIGNED",
    });
    expect(result.programmeDifference).toMatchObject({
      state: "KNOWN_DIFFERENCE",
      activeProgrammeWeeks: "16.00",
      historicalMinimumWeeks: "19.00",
      historicalMaximumWeeks: "22.00",
      quantifiedPremiumState: "UNQUANTIFIED",
    });
    expect(result.states).toEqual([
      "PARTIAL_ECONOMICS",
      "INSUFFICIENT_ACTUAL_EVIDENCE",
      "STALE_SUPPLIER_EVIDENCE",
    ]);
    expect(result.evidenceBundles).toHaveLength(result.claims.length);
    expect(assembly.decisions.some((decision) => decision.included)).toBe(true);
  });

  it("is deterministic for identical authorized inputs and snapshot", () => {
    expect(service.assemble(input())).toEqual(service.assemble(input()));
  });

  it("returns a non-leaking restricted economics view for structural-only access", () => {
    const full = fullBatch();
    const restrictedBatch: AuthorizedEconomicsBatch = Object.freeze({
      ...full,
      accessScope: "STRUCTURAL_ONLY",
      records: Object.freeze([]),
      evidence: Object.freeze(
        full.evidence.filter((reference) => reference.subjectType === "PROJECT"),
      ),
      diagnostics: Object.freeze({
        ...full.diagnostics,
        financialRecordsReturned: 0,
        evidenceRowsReturned: 4,
      }),
    });

    const result = service.assemble(input(restrictedBatch)).result;
    expect(result.overall.quotedHistory.state).toBe("RESTRICTED");
    expect(result.overall.actualHistory.state).toBe("RESTRICTED");
    expect(result.current).toEqual({ currency: "TWD" });
    expect(result.summary.actualEligibleProjectCount).toBeUndefined();
    expect(result.claims.every((claim) => claim.kind === "PROGRAMME_DIFFERENCE_UNQUANTIFIED")).toBe(
      true,
    );
    expect(JSON.stringify(result)).not.toContain("16480000");
    expect(JSON.stringify(result)).not.toContain("12650000");
  });

  it("fails closed when a material claim references unavailable evidence", () => {
    const full = fullBatch();
    const missingEvidenceBatch: AuthorizedEconomicsBatch = Object.freeze({
      ...full,
      evidence: Object.freeze(full.evidence.slice(1)),
    });

    expect(() => service.assemble(input(missingEvidenceBatch))).toThrow(
      /UNSUPPORTED_EVIDENCE_REFERENCE/,
    );
  });
});
