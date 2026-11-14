import { describe, expect, it } from "vitest";

import {
  type ActiveProjectComparisonContext,
  type ComparisonProjectProfile,
} from "@/modules/comparisons/domain/contracts";
import { evaluateCandidateEligibility } from "@/modules/comparisons/domain/eligibility-policy";
import {
  areaSimilarity,
  calculateCandidateSimilarity,
  calculateFactors,
  completionRecency,
  jaccardSimilarity,
  locationSimilarity,
  rankCandidateCalculations,
  subtypeSimilarity,
} from "@/modules/comparisons/domain/similarity-policy";

const SNAPSHOT_DATE = "2026-11-14";
const ALL_SCOPES = [
  "SELECTIVE_DEMOLITION",
  "PARTITIONS_CEILINGS",
  "CUSTOM_MILLWORK",
  "LIGHTING_ELECTRICAL",
  "IMPORTED_STONE",
  "SIGNAGE",
  "COORDINATION",
] as const;
const SIX_COMMERCIAL = [
  "DEMOLITION_CEILING",
  "CUSTOM_MILLWORK",
  "LIGHTING_ELECTRICAL",
  "IMPORTED_STONE",
  "SIGNAGE",
  "COORDINATION",
] as const;

function factorEvidence(projectKey: string) {
  return {
    SUBTYPE: [`EVID-${projectKey}-PROJECT`],
    SCOPE_OVERLAP: [`EVID-${projectKey}-PROJECT`],
    AREA_SIMILARITY: [`EVID-${projectKey}-PROJECT`],
    COMMERCIAL_CATEGORY_OVERLAP: [`EVID-${projectKey}-QUOTE`],
    MATERIAL_OVERLAP: [`EVID-${projectKey}-QUOTE`],
    SUPPLIER_OVERLAP: [`EVID-${projectKey}-QUOTE`],
    COMPLETION_RECENCY: [`EVID-${projectKey}-PROJECT`],
    LOCATION_PROXIMITY: [`EVID-${projectKey}-PROJECT`],
  } as const;
}

const active: ActiveProjectComparisonContext = {
  internalId: "prj_xinyi_026",
  organizationId: "org_horizon",
  businessKey: "PRJ-XINYI-026",
  nameEn: "Xinyi Flagship Renovation",
  nameZhTw: "信義旗艦店裝修",
  comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
  subtype: "RETAIL_FLAGSHIP",
  status: "ACTIVE",
  location: { city: "Taipei City", district: "Xinyi District" },
  areaValue: "640.000",
  areaUnit: "m2",
  currency: "TWD",
  metadataAuthority: "HUMAN_REVIEWED",
  dataClassification: "DEMO_SYNTHETIC",
  scopeCategoryIds: ALL_SCOPES,
  commercialCategoryIds: SIX_COMMERCIAL,
  materialIds: ["MAT-IMPORTED-STONE", "MAT-PREMIUM-LIGHTING", "MAT-CUSTOM-MILLWORK"],
  supplierIds: ["SUP-01", "SUP-03", "SUP-05"],
  factorEvidence: factorEvidence("XINYI"),
  recordVersion: "2026-11-14T00:00:00.000Z",
  snapshotDate: SNAPSHOT_DATE,
  activeQuoteVersionId: "qv_xinyi_026_v3",
  sourceFingerprint: "source-xinyi",
  permissionFingerprint: "permission-mei",
};

function candidate(
  input: Readonly<{
    internalId: string;
    businessKey: string;
    nameEn: string;
    nameZhTw: string;
    subtype: string;
    areaValue: string;
    completedAt: string;
    city: string;
    district: string;
    scopes: readonly string[];
    materials: readonly string[];
    suppliers: readonly string[];
  }>,
): ComparisonProjectProfile {
  return {
    internalId: input.internalId,
    organizationId: "org_horizon",
    businessKey: input.businessKey,
    nameEn: input.nameEn,
    nameZhTw: input.nameZhTw,
    comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
    subtype: input.subtype,
    status: "COMPLETED",
    location: { city: input.city, district: input.district },
    areaValue: input.areaValue,
    areaUnit: "m2",
    currency: "TWD",
    completedAt: input.completedAt,
    metadataAuthority: "HUMAN_REVIEWED",
    dataClassification: "DEMO_SYNTHETIC",
    scopeCategoryIds: input.scopes,
    commercialCategoryIds: SIX_COMMERCIAL,
    materialIds: input.materials,
    supplierIds: input.suppliers,
    factorEvidence: factorEvidence(input.businessKey),
    recordVersion: `${input.completedAt}T00:00:00.000Z`,
  };
}

const canonicalCandidates = [
  candidate({
    internalId: "prj_neihu_021",
    businessKey: "PRJ-NEIHU-021",
    nameEn: "Neihu Tech Flagship",
    nameZhTw: "內湖科技旗艦店",
    subtype: "RETAIL_FLAGSHIP",
    areaValue: "610.000",
    completedAt: "2025-06-30",
    city: "Taipei City",
    district: "Neihu District",
    scopes: ALL_SCOPES,
    materials: ["MAT-IMPORTED-STONE", "MAT-DOMESTIC-LIGHTING", "MAT-CUSTOM-MILLWORK"],
    suppliers: ["SUP-01", "SUP-04", "SUP-05"],
  }),
  candidate({
    internalId: "prj_zhongshan_018",
    businessKey: "PRJ-ZHONGSHAN-018",
    nameEn: "Zhongshan Lifestyle Store",
    nameZhTw: "中山生活概念店",
    subtype: "RETAIL_FLAGSHIP",
    areaValue: "590.000",
    completedAt: "2024-11-15",
    city: "Taipei City",
    district: "Zhongshan District",
    scopes: ALL_SCOPES.filter((scope) => scope !== "SELECTIVE_DEMOLITION"),
    materials: ["MAT-IMPORTED-STONE", "MAT-PREMIUM-LIGHTING", "MAT-SIGNAGE"],
    suppliers: ["SUP-02", "SUP-03"],
  }),
  candidate({
    internalId: "prj_nanjing_023",
    businessKey: "PRJ-NANJING-023",
    nameEn: "Nanjing Brand Experience Center",
    nameZhTw: "南京品牌體驗中心",
    subtype: "RETAIL_FLAGSHIP",
    areaValue: "720.000",
    completedAt: "2026-02-10",
    city: "Taipei City",
    district: "Songshan District",
    scopes: ALL_SCOPES.filter((scope) => scope !== "SELECTIVE_DEMOLITION"),
    materials: ["MAT-IMPORTED-STONE", "MAT-SIGNAGE"],
    suppliers: ["SUP-01"],
  }),
  candidate({
    internalId: "prj_daan_016",
    businessKey: "PRJ-DAAN-016",
    nameEn: "Daan Premium Showroom",
    nameZhTw: "大安精品展示中心",
    subtype: "RETAIL_FLAGSHIP",
    areaValue: "520.000",
    completedAt: "2024-04-20",
    city: "Taipei City",
    district: "Daan District",
    scopes: ALL_SCOPES.filter(
      (scope) => scope !== "SELECTIVE_DEMOLITION" && scope !== "SIGNAGE",
    ),
    materials: ["MAT-CUSTOM-MILLWORK"],
    suppliers: ["SUP-06"],
  }),
  candidate({
    internalId: "prj_songshan_020",
    businessKey: "PRJ-SONGSHAN-020",
    nameEn: "Songshan Retail Renewal",
    nameZhTw: "松山門市改裝",
    subtype: "RETAIL_RENOVATION",
    areaValue: "680.000",
    completedAt: "2025-02-28",
    city: "Taipei City",
    district: "Songshan District",
    scopes: ALL_SCOPES.filter(
      (scope) => scope !== "SELECTIVE_DEMOLITION" && scope !== "SIGNAGE",
    ),
    materials: ["MAT-DOMESTIC-STONE", "MAT-CUSTOM-MILLWORK"],
    suppliers: ["SUP-02"],
  }),
  candidate({
    internalId: "prj_banqiao_015",
    businessKey: "PRJ-BANQIAO-015",
    nameEn: "Banqiao Concept Store",
    nameZhTw: "板橋概念店",
    subtype: "RETAIL_CONCEPT_STORE",
    areaValue: "760.000",
    completedAt: "2023-09-30",
    city: "New Taipei City",
    district: "Banqiao District",
    scopes: ALL_SCOPES.filter(
      (scope) => scope !== "SELECTIVE_DEMOLITION" && scope !== "SIGNAGE",
    ),
    materials: ["MAT-DOMESTIC-LIGHTING", "MAT-CUSTOM-MILLWORK"],
    suppliers: ["SUP-04"],
  }),
] as const;

describe("CPI-SIM-1.0 factor functions", () => {
  it("uses Jaccard overlap and returns unknown for empty optional sets", () => {
    expect(jaccardSimilarity(["A", "B"], ["B", "C"])).toBeCloseTo(1 / 3, 8);
    expect(jaccardSimilarity(["A"], ["B"])).toBe(0);
    expect(jaccardSimilarity([], ["B"])).toBeNull();
    expect(jaccardSimilarity([], [])).toBeNull();
  });

  it("uses exact, adjacent, and incompatible subtype states", () => {
    expect(
      subtypeSimilarity("COMMERCIAL_INTERIOR_FIT_OUT", "RETAIL_FLAGSHIP", "RETAIL_FLAGSHIP"),
    ).toBe(1);
    expect(
      subtypeSimilarity("COMMERCIAL_INTERIOR_FIT_OUT", "RETAIL_FLAGSHIP", "RETAIL_RENOVATION"),
    ).toBe(0.6);
    expect(
      subtypeSimilarity("COMMERCIAL_INTERIOR_FIT_OUT", "RETAIL_FLAGSHIP", "CORPORATE_OFFICE"),
    ).toBe(0);
  });

  it("uses the accepted logarithmic area function", () => {
    expect(areaSimilarity("640", "640")).toBe(1);
    expect(areaSimilarity("640", "320")).toBeCloseTo(0, 8);
    expect(areaSimilarity("640", "1280")).toBeCloseTo(0, 8);
    expect(areaSimilarity("640", "610")).toBeCloseTo(0.930737, 6);
  });

  it("decays completion recency to zero after sixty months", () => {
    expect(completionRecency("2026-11-14", "2026-11-14")).toBe(1);
    expect(completionRecency("2026-11-14", "2021-11-14")).toBeCloseTo(0, 2);
    expect(completionRecency("2026-11-14", "2027-01-01")).toBe(0);
  });

  it("uses district, city, adjacent metro, and distant location bands", () => {
    expect(
      locationSimilarity(
        { city: "Taipei City", district: "Xinyi District" },
        { city: "Taipei City", district: "Xinyi District" },
      ),
    ).toBe(1);
    expect(
      locationSimilarity(
        { city: "Taipei City", district: "Xinyi District" },
        { city: "Taipei City", district: "Neihu District" },
      ),
    ).toBe(0.6);
    expect(
      locationSimilarity(
        { city: "Taipei City", district: "Xinyi District" },
        { city: "New Taipei City", district: "Banqiao District" },
      ),
    ).toBe(0.3);
    expect(
      locationSimilarity(
        { city: "Taipei City", district: "Xinyi District" },
        { city: "Kaohsiung City", district: "Gushan District" },
      ),
    ).toBe(0);
  });
});

describe("CPI-SIM-1.0 canonical ranking", () => {
  it("produces the accepted Horizon Atelier top-six order and displayed scores", () => {
    const calculations = canonicalCandidates.map((project) =>
      calculateCandidateSimilarity(active, project, evaluateCandidateEligibility(active, project)),
    );
    const ranked = rankCandidateCalculations(calculations);

    expect(ranked.map((item) => [item.candidate.businessKey, item.displayScore])).toEqual([
      ["PRJ-NEIHU-021", 88],
      ["PRJ-ZHONGSHAN-018", 81],
      ["PRJ-NANJING-023", 79],
      ["PRJ-DAAN-016", 71],
      ["PRJ-SONGSHAN-020", 69],
      ["PRJ-BANQIAO-015", 63],
    ]);
    expect(ranked.map((item) => item.band)).toEqual([
      "STRONG",
      "STRONG",
      "RELEVANT",
      "RELEVANT",
      "RELEVANT",
      "PARTIAL",
    ]);
    expect(ranked.every((item) => item.tier === "PRIMARY")).toBe(true);
    expect(ranked.every((item) => item.displayEvidenceCoverage === 100)).toBe(true);
  });

  it("reconciles every candidate score exactly to stored factor contributions", () => {
    for (const project of canonicalCandidates) {
      const calculation = calculateCandidateSimilarity(
        active,
        project,
        evaluateCandidateEligibility(active, project),
      );
      const contributionTotal = calculation.factors.reduce(
        (total, factor) => total + (factor.contributionTenThousandths ?? 0),
        0,
      );
      expect(contributionTotal).toBe(calculation.scoreTenThousandths);
      expect(Number(calculation.score)).toBeCloseTo(contributionTotal / 10_000, 4);
    }
  });

  it("marks absent optional material and supplier data unknown without false mismatch", () => {
    const incomplete = candidate({
      internalId: "prj_optional_unknown",
      businessKey: "PRJ-OPTIONAL-UNKNOWN",
      nameEn: "Optional data unknown",
      nameZhTw: "選用資料未知",
      subtype: "RETAIL_FLAGSHIP",
      areaValue: "640.000",
      completedAt: "2026-01-01",
      city: "Taipei City",
      district: "Xinyi District",
      scopes: ALL_SCOPES,
      materials: [],
      suppliers: [],
    });

    const result = calculateCandidateSimilarity(
      active,
      incomplete,
      evaluateCandidateEligibility(active, incomplete),
    );
    const material = result.factors.find((factor) => factor.factorKey === "MATERIAL_OVERLAP");
    const supplier = result.factors.find((factor) => factor.factorKey === "SUPPLIER_OVERLAP");

    expect(material?.state).toBe("UNKNOWN");
    expect(material?.contribution).toBeUndefined();
    expect(supplier?.state).toBe("UNKNOWN");
    expect(result.displayEvidenceCoverage).toBe(85);
    expect(result.tier).toBe("PRIMARY");
    expect(result.unknowns.map((item) => item.factorKey)).toEqual([
      "MATERIAL_OVERLAP",
      "SUPPLIER_OVERLAP",
    ]);
    expect(result.differences.map((item) => item.factorKey)).not.toContain("MATERIAL_OVERLAP");
  });

  it("records within-two-point equivalence without overriding score-descending order", () => {
    const ranked = rankCandidateCalculations(
      canonicalCandidates.slice(1, 3).map((project) =>
        calculateCandidateSimilarity(active, project, evaluateCandidateEligibility(active, project)),
      ),
    );

    expect(ranked.map((item) => item.candidate.businessKey)).toEqual([
      "PRJ-ZHONGSHAN-018",
      "PRJ-NANJING-023",
    ]);
    expect(ranked[0]?.equivalentWithinTwoPoints).toContain("PRJ-NANJING-023");
    expect(ranked[1]?.equivalentWithinTwoPoints).toContain("PRJ-ZHONGSHAN-018");
  });
});

describe("eligibility boundaries", () => {
  it("rejects missing mandatory candidate context before scoring", () => {
    const missingScope = { ...canonicalCandidates[0], scopeCategoryIds: [] };
    const decision = evaluateCandidateEligibility(active, missingScope);
    expect(decision.eligible).toBe(false);
    expect(decision.reasonCodes).toContain("MANDATORY_CONTEXT_MISSING");
  });

  it("rejects wrong-organization and wrong-class candidates", () => {
    const decision = evaluateCandidateEligibility(active, {
      ...canonicalCandidates[0],
      organizationId: "org_northern",
      comparisonClass: "COMMERCIAL_OFFICE_FIT_OUT",
    });
    expect(decision.eligible).toBe(false);
    expect(decision.reasonCodes).toEqual(
      expect.arrayContaining(["ORGANIZATION_MISMATCH", "COMPARISON_CLASS_MISMATCH"]),
    );
  });

  it("rejects future completion dates and insufficient metadata authority", () => {
    const decision = evaluateCandidateEligibility(active, {
      ...canonicalCandidates[0],
      completedAt: "2027-01-01",
      metadataAuthority: "OBSERVED",
    });
    expect(decision.eligible).toBe(false);
    expect(decision.reasonCodes).toEqual(
      expect.arrayContaining(["COMPLETION_DATE_INVALID", "METADATA_AUTHORITY_INSUFFICIENT"]),
    );
  });

  it("persists all eight configured factor rows for an eligible candidate", () => {
    const factors = calculateFactors(active, canonicalCandidates[0]);
    expect(factors).toHaveLength(8);
    expect(new Set(factors.map((factor) => factor.factorKey)).size).toBe(8);
  });
});
