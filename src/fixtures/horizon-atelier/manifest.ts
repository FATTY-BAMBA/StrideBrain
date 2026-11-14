export const HORIZON_ATELIER_FIXTURE_VERSION = "HORIZON-FIXTURE-1.0";

export const horizonAtelierManifest = Object.freeze({
  fixtureVersion: HORIZON_ATELIER_FIXTURE_VERSION,
  organizationKey: "HORIZON_ATELIER",
  activeProjectKey: "PRJ-XINYI-026",
  activeQuoteVersion: 3,
  expectedCounts: Object.freeze({
    activeProjects: 5,
    completedProjects: 24,
    memberships: 4,
    minimumQuoteVersions: 40,
    minimumSuppliers: 18,
    maximumSuppliers: 24,
    minimumEvidenceReferences: 100,
    minimumCommercialAndActualLines: 300,
    maximumCommercialAndActualLines: 500,
  }),
  expectedComparableOrder: Object.freeze([
    "PRJ-NEIHU-021",
    "PRJ-ZHONGSHAN-018",
    "PRJ-NANJING-023",
    "PRJ-DAAN-016",
    "PRJ-SONGSHAN-020",
    "PRJ-BANQIAO-015",
  ]),
  heroEconomics: Object.freeze({
    currentQuoteBeforeTaxTwd: "16480000.00",
    currentForecastDirectCostTwd: "12650000.00",
    importedStoneForecastTwd: "2360000.00",
    importedStoneEligibleActualMedianTwd: "2000000.00",
    importedStoneVariancePercent: "18.0000",
    lightingQuotedTwd: "3100000.00",
    lightingEligibleQuotedMedianTwd: "2844000.00",
    lightingQuotedVariancePercent: "9.0014",
    lightingEligibleActualObservationCount: 2,
    millworkForecastTwd: "3060000.00",
    millworkEligibleActualMedianTwd: "3000000.00",
    millworkVariancePercent: "2.0000",
    signageQuotedTwd: "1140000.00",
    signageEligibleQuotedMedianTwd: "1200000.00",
    signageQuotedVariancePercent: "-5.0000",
  }),
  imperfectCases: Object.freeze({
    supersededQuoteProjectKey: "PRJ-XINYI-026",
    staleSupplierOfferKey: "SUP-OFFER-STONE-2025-041",
    openConflictKey: "final-cost:PRJ-HIST-018:IMPORTED_STONE",
    inaccessibleOrganizationKey: "NORTHERN_STUDIO",
    inaccessibleProjectKey: "PRJ-NORTH-001",
  }),
});

export type HorizonAtelierManifest = typeof horizonAtelierManifest;
