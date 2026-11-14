import {
  SIMILARITY_POLICY_VERSION,
  type ActiveProjectComparisonContext,
  type CandidateEligibilityDecision,
  type CandidateSimilarityCalculation,
  type ComparisonProjectProfile,
  type DifferenceDTO,
  type FactorCalculation,
  type FactorSummaryDTO,
  type MatchBand,
  type SimilarityFactorKey,
  type UnknownFactorDTO,
} from "@/modules/comparisons/domain/contracts";

const NORMALIZED_SCALE = 1_000_000;
const SCORE_SCALE = 10_000;
const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375;

export const FACTOR_WEIGHTS = Object.freeze({
  SUBTYPE: 15,
  SCOPE_OVERLAP: 25,
  AREA_SIMILARITY: 20,
  COMMERCIAL_CATEGORY_OVERLAP: 15,
  MATERIAL_OVERLAP: 10,
  SUPPLIER_OVERLAP: 5,
  COMPLETION_RECENCY: 5,
  LOCATION_PROXIMITY: 5,
} as const satisfies Readonly<Record<SimilarityFactorKey, number>>);

export const FACTOR_ORDER = Object.freeze([
  "SUBTYPE",
  "SCOPE_OVERLAP",
  "AREA_SIMILARITY",
  "COMMERCIAL_CATEGORY_OVERLAP",
  "MATERIAL_OVERLAP",
  "SUPPLIER_OVERLAP",
  "COMPLETION_RECENCY",
  "LOCATION_PROXIMITY",
] as const satisfies readonly SimilarityFactorKey[]);

const FACTOR_LABEL_KEYS: Readonly<Record<SimilarityFactorKey, string>> = Object.freeze({
  SUBTYPE: "comparison.factor.subtype",
  SCOPE_OVERLAP: "comparison.factor.scopeOverlap",
  AREA_SIMILARITY: "comparison.factor.areaSimilarity",
  COMMERCIAL_CATEGORY_OVERLAP: "comparison.factor.commercialCategoryOverlap",
  MATERIAL_OVERLAP: "comparison.factor.materialOverlap",
  SUPPLIER_OVERLAP: "comparison.factor.supplierOverlap",
  COMPLETION_RECENCY: "comparison.factor.completionRecency",
  LOCATION_PROXIMITY: "comparison.factor.locationProximity",
});

const ADJACENT_SUBTYPES: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> =
  Object.freeze({
    COMMERCIAL_INTERIOR_FIT_OUT: Object.freeze({
      RETAIL_FLAGSHIP: Object.freeze([
        "RETAIL_RENOVATION",
        "RETAIL_CONCEPT_STORE",
        "RETAIL_SHOWROOM",
      ]),
      RETAIL_RENOVATION: Object.freeze(["RETAIL_FLAGSHIP", "RETAIL_CONCEPT_STORE"]),
      RETAIL_CONCEPT_STORE: Object.freeze(["RETAIL_FLAGSHIP", "RETAIL_RENOVATION"]),
      RETAIL_SHOWROOM: Object.freeze(["RETAIL_FLAGSHIP"]),
    }),
  });

const ADJACENT_CITIES = new Set(["new taipei city|taipei city", "taipei city|new taipei city"]);

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function micros(value: number): number {
  return Math.round(clamp(value) * NORMALIZED_SCALE);
}

function decimal(value: number, scale: number, places: number): string {
  return (value / scale).toFixed(places);
}

function contribution(normalizedMicros: number, weight: number): number {
  return Math.round((normalizedMicros / NORMALIZED_SCALE) * weight * SCORE_SCALE);
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function factorEvidence(
  active: ActiveProjectComparisonContext,
  candidate: ComparisonProjectProfile,
  factorKey: SimilarityFactorKey,
): readonly string[] {
  return unique([
    ...(active.factorEvidence[factorKey] ?? []),
    ...(candidate.factorEvidence[factorKey] ?? []),
  ]);
}

function knownFactor(
  active: ActiveProjectComparisonContext,
  candidate: ComparisonProjectProfile,
  factorKey: SimilarityFactorKey,
  normalized: number,
  explanationCode: string,
): FactorCalculation {
  const normalizedMicros = micros(normalized);
  const weight = FACTOR_WEIGHTS[factorKey];
  const contributionTenThousandths = contribution(normalizedMicros, weight);
  return Object.freeze({
    factorKey,
    state: "KNOWN",
    weight,
    normalizedMicros,
    normalizedValue: decimal(normalizedMicros, NORMALIZED_SCALE, 6),
    contributionTenThousandths,
    contribution: decimal(contributionTenThousandths, SCORE_SCALE, 4),
    explanationCode,
    evidenceReferenceIds: factorEvidence(active, candidate, factorKey),
  });
}

function unknownFactor(
  active: ActiveProjectComparisonContext,
  candidate: ComparisonProjectProfile,
  factorKey: SimilarityFactorKey,
  explanationCode: string,
): FactorCalculation {
  return Object.freeze({
    factorKey,
    state: "UNKNOWN",
    weight: FACTOR_WEIGHTS[factorKey],
    explanationCode,
    evidenceReferenceIds: factorEvidence(active, candidate, factorKey),
  });
}

function canonicalSet(values: readonly string[]): ReadonlySet<string> {
  return new Set(values.map((value) => value.trim()).filter((value) => value.length > 0));
}

export function jaccardSimilarity(
  activeValues: readonly string[],
  candidateValues: readonly string[],
): number | null {
  const active = canonicalSet(activeValues);
  const candidate = canonicalSet(candidateValues);
  if (active.size === 0 || candidate.size === 0) return null;
  let intersection = 0;
  for (const value of active) if (candidate.has(value)) intersection += 1;
  const union = new Set([...active, ...candidate]).size;
  return union === 0 ? null : intersection / union;
}

export function subtypeSimilarity(
  comparisonClass: string,
  activeSubtype: string,
  candidateSubtype: string,
): number {
  if (activeSubtype === candidateSubtype) return 1;
  const adjacent = ADJACENT_SUBTYPES[comparisonClass]?.[activeSubtype] ?? [];
  return adjacent.includes(candidateSubtype) ? 0.6 : 0;
}

export function areaSimilarity(activeArea: string, candidateArea: string): number {
  const active = Number(activeArea);
  const candidate = Number(candidateArea);
  if (!Number.isFinite(active) || !Number.isFinite(candidate) || active <= 0 || candidate <= 0) {
    return 0;
  }
  return clamp(1 - Math.abs(Math.log(candidate / active)) / Math.log(2));
}

function utcDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function completionRecency(snapshotDate: string, completedAt: string): number {
  const snapshot = utcDate(snapshotDate);
  const completed = utcDate(completedAt);
  if (!snapshot || !completed || completed.getTime() > snapshot.getTime()) return 0;
  const months = (snapshot.getTime() - completed.getTime()) / MS_PER_DAY / DAYS_PER_MONTH;
  return clamp(1 - months / 60);
}

function normalizedLocation(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function locationSimilarity(
  active: Readonly<{ city: string; district?: string | undefined }>,
  candidate: Readonly<{ city: string; district?: string | undefined }>,
): number {
  const activeCity = normalizedLocation(active.city);
  const candidateCity = normalizedLocation(candidate.city);
  const activeDistrict = normalizedLocation(active.district);
  const candidateDistrict = normalizedLocation(candidate.district);

  if (activeCity === candidateCity && activeDistrict && activeDistrict === candidateDistrict) return 1;
  if (activeCity === candidateCity) return 0.6;
  if (ADJACENT_CITIES.has(`${activeCity}|${candidateCity}`)) return 0.3;
  return 0;
}

function setFactor(
  active: ActiveProjectComparisonContext,
  candidate: ComparisonProjectProfile,
  factorKey: SimilarityFactorKey,
  activeValues: readonly string[],
  candidateValues: readonly string[],
): FactorCalculation {
  const value = jaccardSimilarity(activeValues, candidateValues);
  if (value === null) {
    return unknownFactor(active, candidate, factorKey, `${factorKey.toLowerCase()}.unknown`);
  }
  return knownFactor(active, candidate, factorKey, value, `${factorKey.toLowerCase()}.jaccard`);
}

export function calculateFactors(
  active: ActiveProjectComparisonContext,
  candidate: ComparisonProjectProfile,
): readonly FactorCalculation[] {
  return Object.freeze([
    knownFactor(
      active,
      candidate,
      "SUBTYPE",
      subtypeSimilarity(active.comparisonClass, active.subtype, candidate.subtype),
      "subtype.compatibility",
    ),
    setFactor(
      active,
      candidate,
      "SCOPE_OVERLAP",
      active.scopeCategoryIds,
      candidate.scopeCategoryIds,
    ),
    knownFactor(
      active,
      candidate,
      "AREA_SIMILARITY",
      areaSimilarity(active.areaValue, candidate.areaValue),
      "area.log-ratio",
    ),
    setFactor(
      active,
      candidate,
      "COMMERCIAL_CATEGORY_OVERLAP",
      active.commercialCategoryIds,
      candidate.commercialCategoryIds,
    ),
    setFactor(
      active,
      candidate,
      "MATERIAL_OVERLAP",
      active.materialIds,
      candidate.materialIds,
    ),
    setFactor(
      active,
      candidate,
      "SUPPLIER_OVERLAP",
      active.supplierIds,
      candidate.supplierIds,
    ),
    knownFactor(
      active,
      candidate,
      "COMPLETION_RECENCY",
      completionRecency(active.snapshotDate, candidate.completedAt!),
      "completion.recency-60-months",
    ),
    knownFactor(
      active,
      candidate,
      "LOCATION_PROXIMITY",
      locationSimilarity(active.location, candidate.location),
      "location.configured-proximity",
    ),
  ]);
}

function bandFor(displayScore: number): MatchBand {
  if (displayScore >= 80) return "STRONG";
  if (displayScore >= 65) return "RELEVANT";
  if (displayScore >= 50) return "PARTIAL";
  return "BROADER";
}

function positiveFactorSummary(factor: FactorCalculation): FactorSummaryDTO | null {
  if (
    factor.state !== "KNOWN" ||
    factor.normalizedMicros === undefined ||
    factor.contributionTenThousandths === undefined ||
    factor.normalizedMicros <= 0
  ) {
    return null;
  }
  return Object.freeze({
    factorKey: factor.factorKey,
    normalizedValue: factor.normalizedValue!,
    contribution: factor.contribution!,
    labelKey: FACTOR_LABEL_KEYS[factor.factorKey],
  });
}

function differenceSummary(factor: FactorCalculation): DifferenceDTO | null {
  if (
    factor.state !== "KNOWN" ||
    factor.normalizedMicros === undefined ||
    factor.contributionTenThousandths === undefined ||
    factor.normalizedMicros >= 750_000
  ) {
    return null;
  }
  const lostContribution = factor.weight * SCORE_SCALE - factor.contributionTenThousandths;
  return Object.freeze({
    factorKey: factor.factorKey,
    normalizedValue: factor.normalizedValue!,
    lostContribution: decimal(lostContribution, SCORE_SCALE, 4),
    labelKey: FACTOR_LABEL_KEYS[factor.factorKey],
  });
}

function unknownSummary(factor: FactorCalculation): UnknownFactorDTO | null {
  if (factor.state !== "UNKNOWN") return null;
  return Object.freeze({
    factorKey: factor.factorKey,
    weight: factor.weight,
    labelKey: FACTOR_LABEL_KEYS[factor.factorKey],
  });
}

export function calculateCandidateSimilarity(
  active: ActiveProjectComparisonContext,
  candidate: ComparisonProjectProfile,
  eligibility: CandidateEligibilityDecision,
): CandidateSimilarityCalculation {
  if (!eligibility.eligible) {
    return Object.freeze({
      candidate,
      eligibility,
      factors: Object.freeze([]),
      scoreTenThousandths: 0,
      score: "0.0000",
      displayScore: 0,
      band: "BROADER",
      evidenceCoverageTenThousandths: 0,
      evidenceCoverage: "0.0000",
      displayEvidenceCoverage: 0,
      tier: "BROADER",
      strongestFactors: Object.freeze([]),
      differences: Object.freeze([]),
      unknowns: Object.freeze([]),
      equivalentWithinTwoPoints: Object.freeze([]),
    });
  }

  const factors = calculateFactors(active, candidate);
  const scoreTenThousandths = factors.reduce(
    (total, factor) => total + (factor.contributionTenThousandths ?? 0),
    0,
  );
  const knownWeight = factors.reduce(
    (total, factor) => total + (factor.state === "KNOWN" ? factor.weight : 0),
    0,
  );
  const evidenceCoverageTenThousandths = knownWeight * SCORE_SCALE;
  const displayScore = Math.round(scoreTenThousandths / SCORE_SCALE);
  const displayEvidenceCoverage = Math.round(evidenceCoverageTenThousandths / SCORE_SCALE);

  const strongestFactors = factors
    .map(positiveFactorSummary)
    .filter((value): value is FactorSummaryDTO => value !== null)
    .sort(
      (left, right) =>
        Number(right.contribution) - Number(left.contribution) ||
        FACTOR_ORDER.indexOf(left.factorKey) - FACTOR_ORDER.indexOf(right.factorKey),
    )
    .slice(0, 3);

  const differences = factors
    .map(differenceSummary)
    .filter((value): value is DifferenceDTO => value !== null)
    .sort(
      (left, right) =>
        Number(right.lostContribution) - Number(left.lostContribution) ||
        FACTOR_ORDER.indexOf(left.factorKey) - FACTOR_ORDER.indexOf(right.factorKey),
    )
    .slice(0, 2);

  const unknowns = factors
    .map(unknownSummary)
    .filter((value): value is UnknownFactorDTO => value !== null);

  return Object.freeze({
    candidate,
    eligibility,
    factors,
    scoreTenThousandths,
    score: decimal(scoreTenThousandths, SCORE_SCALE, 4),
    displayScore,
    band: bandFor(displayScore),
    evidenceCoverageTenThousandths,
    evidenceCoverage: decimal(evidenceCoverageTenThousandths, SCORE_SCALE, 4),
    displayEvidenceCoverage,
    tier: displayScore >= 50 && displayEvidenceCoverage >= 75 ? "PRIMARY" : "BROADER",
    strongestFactors: Object.freeze(strongestFactors),
    differences: Object.freeze(differences),
    unknowns: Object.freeze(unknowns),
    equivalentWithinTwoPoints: Object.freeze([]),
  });
}

function completionTime(profile: ComparisonProjectProfile): number {
  return profile.completedAt ? (utcDate(profile.completedAt)?.getTime() ?? 0) : 0;
}

function compareCandidates(
  left: CandidateSimilarityCalculation,
  right: CandidateSimilarityCalculation,
): number {
  if (left.displayScore !== right.displayScore) return right.displayScore - left.displayScore;
  if (left.scoreTenThousandths !== right.scoreTenThousandths) {
    return right.scoreTenThousandths - left.scoreTenThousandths;
  }
  if (left.displayEvidenceCoverage !== right.displayEvidenceCoverage) {
    return right.displayEvidenceCoverage - left.displayEvidenceCoverage;
  }
  const completionDifference = completionTime(right.candidate) - completionTime(left.candidate);
  if (completionDifference !== 0) return completionDifference;
  return left.candidate.businessKey.localeCompare(right.candidate.businessKey);
}

export function rankCandidateCalculations(
  calculations: readonly CandidateSimilarityCalculation[],
): readonly CandidateSimilarityCalculation[] {
  const ranked = calculations.slice().sort(compareCandidates);
  return Object.freeze(
    ranked.map((calculation) =>
      Object.freeze({
        ...calculation,
        equivalentWithinTwoPoints: Object.freeze(
          ranked
            .filter(
              (other) =>
                other.candidate.businessKey !== calculation.candidate.businessKey &&
                Math.abs(other.displayScore - calculation.displayScore) <= 2,
            )
            .map((other) => other.candidate.businessKey),
        ),
      }),
    ),
  );
}

export function similarityPolicyDescriptor() {
  return Object.freeze({
    version: SIMILARITY_POLICY_VERSION,
    weights: FACTOR_WEIGHTS,
    factorOrder: FACTOR_ORDER,
    primaryMinimumScore: 50,
    primaryMinimumCoverage: 75,
    primaryMaximum: 6,
  });
}
