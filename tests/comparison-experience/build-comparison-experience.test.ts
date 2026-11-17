import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ComparisonCell } from "@/components/comparisons/comparison-experience-client";
import { getComparisonCopy } from "@/modules/comparison-experience/copy";
import { describe, expect, it } from "vitest";

import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import { buildComparisonExperience } from "@/modules/comparison-experience/build-comparison-experience";
import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";

function match(projectKey: string, rank: number, score: number, nameEn: string, nameZhTw: string) {
  return Object.freeze({
    project: Object.freeze({
      projectKey,
      nameEn,
      nameZhTw,
      subtype: "RETAIL_FLAGSHIP",
      location: Object.freeze({ city: "Taipei City", district: "Neihu District" }),
      areaValue: rank === 1 ? "610.000" : rank === 2 ? "590.000" : "720.000",
      areaUnit: "m2",
      completedAt: `202${6 - rank}-06-01`,
    }),
    rank,
    score: `${score}.0000`,
    displayScore: score,
    band: score >= 80 ? "STRONG" : "RELEVANT",
    evidenceCoverage: rank === 3 ? "91.0000" : "100.0000",
    displayEvidenceCoverage: rank === 3 ? 91 : 100,
    tier: "PRIMARY",
    strongestFactors: Object.freeze([
      Object.freeze({
        factorKey: "SCOPE_OVERLAP",
        normalizedValue: "1.0000",
        contribution: "25.0000",
        labelKey: "comparison.factor.scopeOverlap",
      }),
    ]),
    differences: Object.freeze([
      Object.freeze({
        factorKey: "COMPLETION_RECENCY",
        normalizedValue: "0.6000",
        lostContribution: "2.0000",
        labelKey: "comparison.factor.completionRecency",
      }),
    ]),
    unknowns: Object.freeze(
      rank === 3
        ? [
            Object.freeze({
              factorKey: "SUPPLIER_OVERLAP",
              weight: 5,
              labelKey: "comparison.factor.supplierOverlap",
            }),
          ]
        : [],
    ),
    equivalentWithinTwoPoints: Object.freeze([]),
    policyVersion: "CPI-SIM-1.0",
  });
}

function stage4(): Stage4ComparisonResult {
  return Object.freeze({
    version: "comparable-project-stage4.v1",
    run: Object.freeze({
      id: "cmprun_stage4",
      generatedAt: "2026-11-15T08:00:00.000Z",
      snapshotDate: "2026-11-15",
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
      factorsUsed: Object.freeze([
        "SUBTYPE",
        "SCOPE_OVERLAP",
        "AREA_SIMILARITY",
        "COMMERCIAL_CATEGORY_OVERLAP",
        "MATERIAL_OVERLAP",
        "SUPPLIER_OVERLAP",
        "COMPLETION_RECENCY",
        "LOCATION_PROXIMITY",
      ]),
      missingOptionalContext: Object.freeze([]),
    }),
    matches: Object.freeze([
      match("PRJ-NEIHU-021", 1, 88, "Neihu Tech Flagship", "內湖科技旗艦店"),
      match("PRJ-ZHONGSHAN-018", 2, 81, "Zhongshan Lifestyle Store", "中山生活概念店"),
      match("PRJ-NANJING-023", 3, 79, "Nanjing Experience Center", "南京品牌體驗中心"),
    ]),
    broaderMatches: Object.freeze([]),
    defaultSelectedProjectKeys: Object.freeze([
      "PRJ-NEIHU-021",
      "PRJ-ZHONGSHAN-018",
      "PRJ-NANJING-023",
    ]),
  }) as Stage4ComparisonResult;
}

function trace(
  operation: string,
  inputs: readonly Readonly<{
    observationId: string;
    projectKey: string;
    normalizedValue: string;
    unit: string;
    evidenceReferenceIds: readonly string[];
  }>[],
) {
  return Object.freeze({
    calculationVersion: "CPI-ECON-1.0" as const,
    policyVersions: Object.freeze(["EVIDENCE-AUTHORITY-1.0"] as const),
    operation,
    inputs: Object.freeze(inputs),
    aggregation: "MEDIAN_MIN_MAX",
    result: Object.freeze({}),
    rounding: "HALF_UP",
    generatedAt: "2026-11-15T08:05:00.000Z",
  });
}

const quoteInputs = Object.freeze([
  Object.freeze({
    observationId: "quote-neihu",
    projectKey: "PRJ-NEIHU-021",
    normalizedValue: "24786.885246",
    unit: "TWD_PER_M2",
    evidenceReferenceIds: Object.freeze(["e-q-n"]),
  }),
  Object.freeze({
    observationId: "quote-zhongshan",
    projectKey: "PRJ-ZHONGSHAN-018",
    normalizedValue: "23644.067797",
    unit: "TWD_PER_M2",
    evidenceReferenceIds: Object.freeze(["e-q-z"]),
  }),
  Object.freeze({
    observationId: "quote-nanjing",
    projectKey: "PRJ-NANJING-023",
    normalizedValue: "24027.777778",
    unit: "TWD_PER_M2",
    evidenceReferenceIds: Object.freeze(["e-q-j"]),
  }),
]);

const actualInputs = Object.freeze([
  Object.freeze({
    observationId: "actual-neihu",
    projectKey: "PRJ-NEIHU-021",
    normalizedValue: "18983.606557",
    unit: "TWD_PER_M2",
    evidenceReferenceIds: Object.freeze(["e-a-n"]),
  }),
  Object.freeze({
    observationId: "actual-zhongshan",
    projectKey: "PRJ-ZHONGSHAN-018",
    normalizedValue: "18372.881356",
    unit: "TWD_PER_M2",
    evidenceReferenceIds: Object.freeze(["e-a-z"]),
  }),
  Object.freeze({
    observationId: "actual-nanjing",
    projectKey: "PRJ-NANJING-023",
    normalizedValue: "18638.888889",
    unit: "TWD_PER_M2",
    evidenceReferenceIds: Object.freeze(["e-a-j"]),
  }),
]);

function sufficientAggregate(
  observationType: "QUOTED_PRICE" | "RECONCILED_ACTUAL_COST",
  inputs: readonly Readonly<{
    observationId: string;
    projectKey: string;
    normalizedValue: string;
    unit: string;
    evidenceReferenceIds: readonly string[];
  }>[],
) {
  return Object.freeze({
    state: "SUFFICIENT" as const,
    observationType,
    requiredObservationCount: 3,
    eligibleObservationCount: 3,
    currency: "TWD",
    normalizedUnit: "TWD_PER_M2",
    medianNormalizedAmount: inputs[2]!.normalizedValue,
    minimumNormalizedAmount: inputs[1]!.normalizedValue,
    maximumNormalizedAmount: inputs[0]!.normalizedValue,
    equivalentAmountForActiveProject:
      observationType === "QUOTED_PRICE" ? "15377777.78" : "11928888.89",
    observationProjectKeys: Object.freeze(inputs.map((input) => input.projectKey)),
    evidenceReferenceIds: Object.freeze(inputs.flatMap((input) => input.evidenceReferenceIds)),
    calculationTrace: trace(`${observationType}_MEDIAN`, inputs),
  });
}

function valueFinding(
  currentBasis: "QUOTE" | "FORECAST",
  historyBasis: "QUOTED_PRICE" | "RECONCILED_ACTUAL_COST",
  currentAmount: string,
  currentNormalizedAmount: string,
  variancePercent: string,
) {
  return Object.freeze({
    state: "VALUE" as const,
    currentBasis,
    historyBasis,
    currency: "TWD",
    currentAmount,
    currentNormalizedAmount,
    baselineMedianNormalizedAmount: "20000.000000",
    baselineEquivalentAmount: "12800000.00",
    normalizedUnit: "TWD_PER_M2",
    variancePercent,
    direction: "ABOVE" as const,
    evidenceReferenceIds: Object.freeze(["e-current", "e-history"]),
    calculationTrace: trace("VARIANCE", quoteInputs),
  });
}

function category(
  categoryId: string,
  quoteVariance: string,
  forecastVariance: string,
  actualState: "SUFFICIENT" | "INSUFFICIENT" = "SUFFICIENT",
) {
  const quotedHistory = sufficientAggregate("QUOTED_PRICE", quoteInputs);
  const actualHistory =
    actualState === "SUFFICIENT"
      ? sufficientAggregate("RECONCILED_ACTUAL_COST", actualInputs)
      : Object.freeze({
          state: "INSUFFICIENT" as const,
          observationType: "RECONCILED_ACTUAL_COST" as const,
          requiredObservationCount: 3,
          eligibleObservationCount: 2,
          currency: "TWD",
          normalizedUnit: "TWD_PER_M2",
          observationProjectKeys: Object.freeze(["PRJ-NEIHU-021", "PRJ-ZHONGSHAN-018"]),
          evidenceReferenceIds: Object.freeze(["e-a-n", "e-a-z"]),
        });
  return Object.freeze({
    categoryId,
    quotedHistory,
    actualHistory,
    quoteVariance: valueFinding(
      "QUOTE",
      "QUOTED_PRICE",
      "3000000.00",
      "4687.500000",
      quoteVariance,
    ),
    forecastVariance:
      actualState === "SUFFICIENT"
        ? valueFinding(
            "FORECAST",
            "RECONCILED_ACTUAL_COST",
            "2360000.00",
            "3687.500000",
            forecastVariance,
          )
        : Object.freeze({
            state: "INSUFFICIENT" as const,
            currentBasis: "FORECAST" as const,
            historyBasis: "RECONCILED_ACTUAL_COST" as const,
            currency: "TWD",
            currentAmount: "2350000.00",
            currentNormalizedAmount: "3671.875000",
            normalizedUnit: "TWD_PER_M2",
            evidenceReferenceIds: Object.freeze(["e-light-current", "e-a-n", "e-a-z"]),
          }),
    warningCodes: Object.freeze(
      actualState === "INSUFFICIENT" ? ["INSUFFICIENT_ACTUAL_COST_EVIDENCE"] : [],
    ),
  });
}

function economics(comparisonRunId = "cmprun_stage4"): Stage5EconomicsResult {
  return Object.freeze({
    version: "comparable-project-stage5.v1",
    run: Object.freeze({
      id: "econrun_stage5",
      comparisonRunId,
      generatedAt: "2026-11-15T08:05:00.000Z",
      snapshotDate: "2026-11-15",
      status: "PARTIAL_ECONOMICS",
      authorityPolicyVersion: "EVIDENCE-AUTHORITY-1.0",
      calculationVersion: "CPI-ECON-1.0",
      inputFingerprint: "econ-input",
      sourceFingerprint: "econ-source",
      permissionFingerprint: "econ-permission",
    }),
    accessScope: "FULL_ACTUAL",
    structuralResultFingerprint: "stage4-fingerprint",
    selectedProjectKeys: Object.freeze(["PRJ-NEIHU-021", "PRJ-ZHONGSHAN-018", "PRJ-NANJING-023"]),
    states: Object.freeze(["INSUFFICIENT_ACTUAL_EVIDENCE", "STALE_SUPPLIER_EVIDENCE"]),
    summary: Object.freeze({
      quotedHistoryState: "SUFFICIENT",
      actualHistoryState: "SUFFICIENT",
      actualEligibleProjectCount: 3,
      staleSupplierOfferCount: 1,
      conflictCount: 0,
    }),
    current: Object.freeze({
      quoteBeforeTax: "16480000.00",
      forecastDirectCost: "12650000.00",
      currency: "TWD",
    }),
    overall: Object.freeze({
      quotedHistory: sufficientAggregate("QUOTED_PRICE", quoteInputs),
      actualHistory: sufficientAggregate("RECONCILED_ACTUAL_COST", actualInputs),
      quoteVariance: valueFinding("QUOTE", "QUOTED_PRICE", "16480000.00", "25750.000000", "7.1676"),
      forecastVariance: valueFinding(
        "FORECAST",
        "RECONCILED_ACTUAL_COST",
        "12650000.00",
        "19765.625000",
        "6.0451",
      ),
    }),
    categories: Object.freeze([
      category("IMPORTED_STONE", "42.9687", "18.3882"),
      category("LIGHTING_ELECTRICAL", "9.4329", "0.0000", "INSUFFICIENT"),
      category("CUSTOM_MILLWORK", "1.7857", "-2.7263"),
    ]),
    programmeDifference: Object.freeze({
      state: "KNOWN_DIFFERENCE",
      activeProgrammeWeeks: "16.00",
      historicalMinimumWeeks: "19.00",
      historicalMaximumWeeks: "22.00",
      quantifiedPremiumState: "UNQUANTIFIED",
      evidenceReferenceIds: Object.freeze(["e-programme"]),
    }),
    supplierOffers: Object.freeze([
      Object.freeze({
        recordKey: "SUP-OFFER-STONE-2025-041",
        projectKey: "PRJ-NEIHU-021",
        authorityState: "APPROVED_COMMERCIAL",
        freshness: "STALE",
        validUntil: "2025-02-15",
        state: "EXCLUDED",
        reasonCodes: Object.freeze(["STALE"]),
        evidenceReferenceIds: Object.freeze(["e-offer"]),
      }),
    ]),
    claims: Object.freeze([]),
    evidenceBundles: Object.freeze([]),
  }) as Stage5EconomicsResult;
}

function row(view: ReturnType<typeof buildComparisonExperience>, key: string) {
  return view.table.sections
    .flatMap((section) => section.rows)
    .find((candidate) => candidate.key === key);
}

describe("Stage 6 comparison experience composer", () => {
  it("preserves canonical ranking and the immutable selected precedents", () => {
    const view = buildComparisonExperience({
      stage4: stage4(),
      economics: economics(),
      locale: "en",
      requestedSelectedProjectKeys: ["PRJ-NANJING-023"],
    });

    expect(view.cards.map((card) => [card.projectKey, card.scoreLabel])).toEqual([
      ["PRJ-NEIHU-021", "88/100"],
      ["PRJ-ZHONGSHAN-018", "81/100"],
      ["PRJ-NANJING-023", "79/100"],
    ]);
    expect(view.initialSelectedProjectKeys).toEqual([
      "PRJ-NEIHU-021",
      "PRJ-ZHONGSHAN-018",
      "PRJ-NANJING-023",
    ]);
  });

  it("renders stored quote, actual, and category findings without recalculation", () => {
    const view = buildComparisonExperience({
      stage4: stage4(),
      economics: economics(),
      locale: "en",
    });

    expect(row(view, "overall-quoted")?.cells.__ACTIVE_PROJECT__?.secondary).toContain("+7.2%");
    expect(row(view, "overall-actual")?.cells["PRJ-NEIHU-021"]?.primary).toContain("NT$18,984");
    expect(row(view, "IMPORTED_STONE-ACTUAL")?.cells.__ACTIVE_PROJECT__?.secondary).toContain(
      "+18.4%",
    );
    expect(row(view, "LIGHTING_ELECTRICAL-ACTUAL")?.cells.__ACTIVE_PROJECT__?.state).toBe(
      "INSUFFICIENT",
    );
    expect(view.synthesis.history.some((item) => item.body.includes("+18.4%"))).toBe(true);
  });

  it("keeps unknown factors distinct from mismatches", () => {
    const view = buildComparisonExperience({
      stage4: stage4(),
      economics: economics(),
      locale: "en",
    });
    const nanjing = view.cards.find((card) => card.projectKey === "PRJ-NANJING-023");

    expect(nanjing?.unknowns).toHaveLength(1);
    expect(nanjing?.unknowns[0]?.state).toBe("UNKNOWN");
    expect(nanjing?.unknowns[0]?.valueLabel).toContain("not treated as a mismatch");
  });

  it("provides Taiwan Traditional Chinese semantics without provider or plumbing copy", () => {
    const view = buildComparisonExperience({
      stage4: stage4(),
      economics: economics(),
      locale: "zh-TW",
    });

    expect(view.heading.title).toContain("信義旗艦店裝修");
    expect(view.cards[0]?.bandLabel).toBe("高度相似");
    expect(view.cards[0]?.locationLabel).toBe("臺北市內湖區");
    expect(view.activeProject.subtypeLabel).toBe("零售旗艦店");
    expect(view.activeProject.locationLabel).toBe("臺北市信義區");
    expect(view.summary.policyLabel).toBe("專案相似度");
    expect(row(view, "subtype")?.cells.__ACTIVE_PROJECT__?.primary).toBe("零售旗艦店");
    expect(row(view, "programme")?.cells.__ACTIVE_PROJECT__?.primary).toBe("16 週");
    expect(view.table.sections.map((section) => section.label)).toContain("分類比較");
    expect(JSON.stringify(view)).not.toMatch(/OpenRouter|Prisma|provider/i);
  });

  it("fails closed when Stage 4 and Stage 5 runs do not belong together", () => {
    expect(() =>
      buildComparisonExperience({
        stage4: stage4(),
        economics: economics("cmprun_other"),
        locale: "en",
      }),
    ).toThrow("COMPARISON_EXPERIENCE_RUN_MISMATCH");
  });
});

describe("QA-18 financial basis at the point of comparison", () => {
  it.each(["en", "zh-TW"] as const)(
    "keeps forecast, actual, quote and offer distinct in visible and accessible %s cells",
    (locale) => {
      const view = buildComparisonExperience({ stage4: stage4(), economics: economics(), locale });
      const labels =
        locale === "en"
          ? ["Forecast direct cost", "Reconciled actual cost", "Quoted price", "Supplier offer"]
          : ["預估直接成本", "已核對實際成本", "報價", "供應商報價"];
      for (const rowKey of [
        "overall-actual",
        "IMPORTED_STONE-ACTUAL",
        "LIGHTING_ELECTRICAL-ACTUAL",
        "CUSTOM_MILLWORK-ACTUAL",
      ]) {
        const cells = row(view, rowKey)!.cells;
        expect(cells.__ACTIVE_PROJECT__).toMatchObject({
          observationType: "FORECAST_DIRECT_COST",
          observationLabel: labels[0],
        });
        expect(cells["PRJ-NEIHU-021"]).toMatchObject({
          observationType: "RECONCILED_ACTUAL_COST",
          observationLabel: labels[1],
        });
        for (const key of ["__ACTIVE_PROJECT__", "PRJ-NEIHU-021"]) {
          const value = cells[key]!;
          const html = renderToStaticMarkup(
            createElement(ComparisonCell, {
              cell: value,
              copy: getComparisonCopy(locale),
              triggerId: "basis-test",
              onOpenClaim: () => {},
            }),
          );
          expect(html).toContain(value.observationLabel!);
          expect(html).toContain(
            `aria-label="${getComparisonCopy(locale).table.evidenceState}: ${value.observationLabel}`,
          );
          expect(html).not.toContain(key === "__ACTIVE_PROJECT__" ? labels[1]! : labels[0]!);
        }
      }
      expect(row(view, "overall-actual")?.cells.__ACTIVE_PROJECT__?.secondary).toContain(
        "NT$12,650,000",
      );
      expect(row(view, "IMPORTED_STONE-ACTUAL")?.cells.__ACTIVE_PROJECT__?.secondary).toContain(
        "NT$2,360,000",
      );
      expect(row(view, "overall-quoted")?.cells.__ACTIVE_PROJECT__).toMatchObject({
        observationType: "QUOTED_PRICE",
        observationLabel: labels[2],
      });
      expect(row(view, "supplier-context")?.cells["PRJ-NEIHU-021"]).toMatchObject({
        observationType: "SUPPLIER_OFFER",
        observationLabel: labels[3],
      });
    },
  );
});
