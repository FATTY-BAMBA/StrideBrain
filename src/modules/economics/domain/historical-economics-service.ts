import {
  absolute,
  compare,
  decimalFromAtoms,
  decimalFromString,
  decimalToString,
  divide,
  median,
  money,
  multiply,
  PERCENT_SCALE,
  quantity,
  variancePercent,
} from "@/modules/finance/fixed-decimal";

import {
  ECONOMICS_CALCULATION_VERSION,
  EVIDENCE_AUTHORITY_POLICY_VERSION,
  STAGE5_RESULT_VERSION,
  type AggregateState,
  type AuthorizedEconomicsBatch,
  type CalculationTraceDTO,
  type CategoryEconomicsDTO,
  type EconomicsLineSnapshot,
  type EconomicsProjectSnapshot,
  type FinancialObservationRecord,
  type HistoricalAggregateDTO,
  type HistoricalEconomicsAssembly,
  type HistoricalEconomicsAssemblyInput,
  type ObservationAuthorityDecision,
  type ObservationPurpose,
  type PersistableObservationDecision,
  type ProgrammeDifferenceDTO,
  type Stage5EconomicsResult,
  type Stage5EconomicsState,
  type StructuredEconomicsClaimDTO,
  type SupplierOfferEconomicsDTO,
  type VarianceFindingDTO,
} from "@/modules/economics/domain/contracts";
import { ComparisonEvidenceBundleService } from "@/modules/economics/domain/evidence-bundle-service";
import {
  ObservationAuthorityService,
  type AuthorityEvaluationContext,
} from "@/modules/economics/domain/observation-authority";

export const REQUIRED_HISTORY_COUNT = 3;
const RATE_SCALE = 6;
const ALIGNMENT_THRESHOLD = decimalFromString("3.0000", PERCENT_SCALE);

const ACCESS_RANK = Object.freeze({
  STRUCTURAL_ONLY: 0,
  QUOTE_ONLY: 1,
  QUOTE_AND_FORECAST: 2,
  FULL_ACTUAL: 3,
} as const);

export type QuotedHistoryInput = Pick<
  HistoricalEconomicsAssemblyInput,
  "stage4" | "batch" | "snapshotDate" | "generatedAt"
>;
export type CategoryQuotedHistory = Readonly<{
  categoryId: string;
  history: HistoricalAggregateDTO;
  conflictEvidenceIds: readonly string[];
}>;

type EvaluatedRecord = Readonly<{
  project: EconomicsProjectSnapshot;
  record: FinancialObservationRecord;
  purpose: ObservationPurpose;
  decision: ObservationAuthorityDecision;
}>;

type NormalizedObservation = Readonly<{
  observationId: string;
  projectKey: string;
  normalizedAmount: ReturnType<typeof decimalFromString>;
  evidenceReferenceIds: readonly string[];
  unit: string;
}>;

type CurrentLine = Readonly<{
  record: FinancialObservationRecord;
  line: EconomicsLineSnapshot;
  project: EconomicsProjectSnapshot;
}>;

function accessAtLeast(
  batch: AuthorizedEconomicsBatch,
  required: keyof typeof ACCESS_RANK,
): boolean {
  return ACCESS_RANK[batch.accessScope] >= ACCESS_RANK[required];
}

function projectMap(
  batch: AuthorizedEconomicsBatch,
): ReadonlyMap<string, EconomicsProjectSnapshot> {
  return new Map(batch.projects.map((project) => [project.internalId, project] as const));
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)]);
}

function optionalDateSortValue(record: FinancialObservationRecord): number {
  const value = record.effectiveAt ?? record.validUntil;
  const parsed = value ? Date.parse(`${value}T00:00:00.000Z`) : Number.NEGATIVE_INFINITY;
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function chooseSingleEligible(records: readonly EvaluatedRecord[]): readonly EvaluatedRecord[] {
  const eligible = records.filter((entry) => entry.decision.eligible);
  if (eligible.length <= 1) return eligible;

  return Object.freeze(
    [...eligible]
      .sort((left, right) => {
        const versionDifference =
          (right.record.versionNumber ?? 0) - (left.record.versionNumber ?? 0);
        if (versionDifference !== 0) return versionDifference;
        const dateDifference =
          optionalDateSortValue(right.record) - optionalDateSortValue(left.record);
        if (dateDifference !== 0) return dateDifference;
        return left.record.id.localeCompare(right.record.id);
      })
      .slice(0, 1),
  );
}

function normalizedRate(amount: string, project: EconomicsProjectSnapshot) {
  return divide(money(amount), quantity(project.areaValue), RATE_SCALE);
}

function equivalentForActive(rate: ReturnType<typeof decimalFromString>, activeAreaValue: string) {
  return multiply(rate, quantity(activeAreaValue), 2);
}

function normalizedUnit(project: EconomicsProjectSnapshot): string {
  return `${project.currency}_PER_${project.areaUnit.toUpperCase()}`;
}

function normalizedObservation(
  observationId: string,
  project: EconomicsProjectSnapshot,
  amount: string,
  evidenceReferenceIds: readonly string[],
): NormalizedObservation {
  return Object.freeze({
    observationId,
    projectKey: project.businessKey,
    normalizedAmount: normalizedRate(amount, project),
    evidenceReferenceIds: unique(evidenceReferenceIds),
    unit: normalizedUnit(project),
  });
}

function minMax(values: readonly ReturnType<typeof decimalFromString>[]): Readonly<{
  minimum: ReturnType<typeof decimalFromString>;
  maximum: ReturnType<typeof decimalFromString>;
}> | null {
  const first = values[0];
  if (!first) return null;
  let minimum = first;
  let maximum = first;
  for (const value of values.slice(1)) {
    if (compare(value, minimum) < 0) minimum = value;
    if (compare(value, maximum) > 0) maximum = value;
  }
  return Object.freeze({ minimum, maximum });
}

function aggregateTrace(
  operation: string,
  observations: readonly NormalizedObservation[],
  result: Readonly<Record<string, unknown>>,
  generatedAt: string,
): CalculationTraceDTO {
  return Object.freeze({
    calculationVersion: ECONOMICS_CALCULATION_VERSION,
    policyVersions: Object.freeze([EVIDENCE_AUTHORITY_POLICY_VERSION] as const),
    operation,
    inputs: Object.freeze(
      observations.map((observation) =>
        Object.freeze({
          observationId: observation.observationId,
          projectKey: observation.projectKey,
          normalizedValue: decimalToString(observation.normalizedAmount),
          unit: observation.unit,
          evidenceReferenceIds: Object.freeze([...observation.evidenceReferenceIds]),
        }),
      ),
    ),
    aggregation: "MEDIAN_MIN_MAX",
    result,
    rounding: "HALF_UP; normalized rate scale 6; equivalent amount scale 2",
    generatedAt,
  });
}

function restrictedAggregate(
  observationType: HistoricalAggregateDTO["observationType"],
): HistoricalAggregateDTO {
  return Object.freeze({
    state: "RESTRICTED",
    observationType,
    requiredObservationCount: REQUIRED_HISTORY_COUNT,
  });
}

function unavailableAggregate(
  observationType: HistoricalAggregateDTO["observationType"],
  state: Extract<AggregateState, "UNAVAILABLE" | "CONFLICTED"> = "UNAVAILABLE",
): HistoricalAggregateDTO {
  return Object.freeze({
    state,
    observationType,
    requiredObservationCount: REQUIRED_HISTORY_COUNT,
    eligibleObservationCount: 0,
  });
}

function aggregate(
  observationType: HistoricalAggregateDTO["observationType"],
  observations: readonly NormalizedObservation[],
  activeAreaValue: string,
  generatedAt: string,
  conflictPresent: boolean,
  inputCurrency: string,
  inputUnit: string,
): HistoricalAggregateDTO {
  const uniqueProjectObservations = new Map<string, NormalizedObservation>();
  for (const observation of observations) {
    if (!uniqueProjectObservations.has(observation.projectKey)) {
      uniqueProjectObservations.set(observation.projectKey, observation);
    }
  }
  const included = [...uniqueProjectObservations.values()];
  if (included.length < REQUIRED_HISTORY_COUNT) {
    return Object.freeze({
      state: conflictPresent ? "CONFLICTED" : "INSUFFICIENT",
      observationType,
      requiredObservationCount: REQUIRED_HISTORY_COUNT,
      eligibleObservationCount: included.length,
      ...(included.length > 0
        ? {
            currency: inputCurrency,
            normalizedUnit: inputUnit,
            observationProjectKeys: Object.freeze(included.map((item) => item.projectKey)),
            evidenceReferenceIds: unique(included.flatMap((item) => item.evidenceReferenceIds)),
          }
        : {}),
    });
  }

  const values = included.map((item) => item.normalizedAmount);
  const center = median(values, RATE_SCALE);
  const bounds = minMax(values);
  if (!center || !bounds) return unavailableAggregate(observationType);

  const equivalent = equivalentForActive(center, activeAreaValue);
  const result = Object.freeze({
    medianNormalizedAmount: decimalToString(center),
    minimumNormalizedAmount: decimalToString(bounds.minimum),
    maximumNormalizedAmount: decimalToString(bounds.maximum),
    equivalentAmountForActiveProject: decimalToString(equivalent),
  });

  return Object.freeze({
    state: "SUFFICIENT",
    observationType,
    requiredObservationCount: REQUIRED_HISTORY_COUNT,
    eligibleObservationCount: included.length,
    currency: inputCurrency,
    normalizedUnit: inputUnit,
    ...result,
    observationProjectKeys: Object.freeze(included.map((item) => item.projectKey)),
    evidenceReferenceIds: unique(included.flatMap((item) => item.evidenceReferenceIds)),
    calculationTrace: aggregateTrace(
      `HISTORICAL_${observationType}_NORMALIZED_MEDIAN`,
      included,
      result,
      generatedAt,
    ),
  });
}

function varianceDirection(
  value: ReturnType<typeof decimalFromString>,
): "ABOVE" | "BELOW" | "ALIGNED" {
  if (compare(absolute(value), ALIGNMENT_THRESHOLD) <= 0) return "ALIGNED";
  return compare(value, decimalFromAtoms(0n, PERCENT_SCALE)) > 0 ? "ABOVE" : "BELOW";
}

function restrictedVariance(
  currentBasis: VarianceFindingDTO["currentBasis"],
  historyBasis: VarianceFindingDTO["historyBasis"],
): VarianceFindingDTO {
  return Object.freeze({ state: "RESTRICTED", currentBasis, historyBasis });
}

function varianceFinding(
  currentBasis: VarianceFindingDTO["currentBasis"],
  historyBasis: VarianceFindingDTO["historyBasis"],
  current: NormalizedObservation | null,
  currentAmount: string | undefined,
  history: HistoricalAggregateDTO,
  generatedAt: string,
): VarianceFindingDTO {
  if (history.state === "RESTRICTED") return restrictedVariance(currentBasis, historyBasis);
  if (!current || currentAmount === undefined) {
    return Object.freeze({ state: "UNAVAILABLE", currentBasis, historyBasis });
  }
  if (
    history.state !== "SUFFICIENT" ||
    history.medianNormalizedAmount === undefined ||
    history.equivalentAmountForActiveProject === undefined
  ) {
    return Object.freeze({
      state: "INSUFFICIENT",
      currentBasis,
      historyBasis,
      currency: history.currency,
      currentAmount,
      currentNormalizedAmount: decimalToString(current.normalizedAmount),
      normalizedUnit: current.unit,
      evidenceReferenceIds: unique([
        ...current.evidenceReferenceIds,
        ...(history.evidenceReferenceIds ?? []),
      ]),
    });
  }

  const baseline = decimalFromString(history.medianNormalizedAmount, RATE_SCALE);
  const variance = variancePercent(current.normalizedAmount, baseline, PERCENT_SCALE);
  const result = Object.freeze({
    currentNormalizedAmount: decimalToString(current.normalizedAmount),
    baselineMedianNormalizedAmount: history.medianNormalizedAmount,
    baselineEquivalentAmount: history.equivalentAmountForActiveProject,
    variancePercent: decimalToString(variance),
  });
  const historicalInputs = history.calculationTrace?.inputs ?? [];
  const trace: CalculationTraceDTO = Object.freeze({
    calculationVersion: ECONOMICS_CALCULATION_VERSION,
    policyVersions: Object.freeze([EVIDENCE_AUTHORITY_POLICY_VERSION] as const),
    operation: `${currentBasis}_VERSUS_${historyBasis}_MEDIAN_VARIANCE`,
    inputs: Object.freeze([
      Object.freeze({
        observationId: current.observationId,
        projectKey: current.projectKey,
        normalizedValue: decimalToString(current.normalizedAmount),
        unit: current.unit,
        evidenceReferenceIds: Object.freeze([...current.evidenceReferenceIds]),
      }),
      ...historicalInputs,
    ]),
    aggregation: "(CURRENT_NORMALIZED - HISTORICAL_MEDIAN) / HISTORICAL_MEDIAN * 100",
    result,
    rounding: "HALF_UP; percent scale 4",
    generatedAt,
  });

  return Object.freeze({
    state: "VALUE",
    currentBasis,
    historyBasis,
    currency: history.currency,
    currentAmount,
    ...result,
    normalizedUnit: current.unit,
    direction: varianceDirection(variance),
    evidenceReferenceIds: unique([
      ...current.evidenceReferenceIds,
      ...(history.evidenceReferenceIds ?? []),
    ]),
    calculationTrace: trace,
  });
}

function evaluationContext(
  purpose: ObservationPurpose,
  input: QuotedHistoryInput,
): AuthorityEvaluationContext {
  return Object.freeze({
    purpose,
    snapshotDate: input.snapshotDate,
    activeCurrency: input.stage4.activeContext.currency,
    activeAreaUnit: input.stage4.activeContext.areaUnit,
  });
}

function recordPurpose(
  record: FinancialObservationRecord,
  batch: AuthorizedEconomicsBatch,
): ObservationPurpose | null {
  const active = record.projectId === batch.activeProjectId;
  if (record.observationType === "QUOTED_PRICE") {
    return active ? "CURRENT_QUOTE" : "QUOTED_HISTORY";
  }
  if (record.observationType === "FORECAST_DIRECT_COST") {
    return active ? "CURRENT_FORECAST" : null;
  }
  if (record.observationType === "RECONCILED_ACTUAL_COST") {
    return active ? null : "ACTUAL_HISTORY";
  }
  if (record.observationType === "SUPPLIER_OFFER") {
    return active ? "SUPPLIER_CURRENT" : "SUPPLIER_HISTORY";
  }
  return null;
}

function evaluateRecords(
  input: QuotedHistoryInput,
  authority: ObservationAuthorityService,
): readonly EvaluatedRecord[] {
  const projects = projectMap(input.batch);
  const evaluated: EvaluatedRecord[] = [];

  for (const record of input.batch.records) {
    const project = projects.get(record.projectId);
    const purpose = recordPurpose(record, input.batch);
    if (!project || !purpose) continue;
    evaluated.push(
      Object.freeze({
        project,
        record,
        purpose,
        decision: authority.evaluate(project, record, evaluationContext(purpose, input)),
      }),
    );
  }

  return Object.freeze(evaluated);
}

function singleByPurpose(
  evaluated: readonly EvaluatedRecord[],
  purpose: ObservationPurpose,
): EvaluatedRecord | null {
  return chooseSingleEligible(evaluated.filter((entry) => entry.purpose === purpose))[0] ?? null;
}

function historyByPurpose(
  evaluated: readonly EvaluatedRecord[],
  purpose: ObservationPurpose,
): readonly EvaluatedRecord[] {
  const byProject = new Map<string, EvaluatedRecord[]>();
  for (const entry of evaluated.filter((candidate) => candidate.purpose === purpose)) {
    const bucket = byProject.get(entry.project.internalId) ?? [];
    bucket.push(entry);
    byProject.set(entry.project.internalId, bucket);
  }
  return Object.freeze([...byProject.values()].flatMap(chooseSingleEligible));
}

function recordObservation(entry: EvaluatedRecord): NormalizedObservation {
  return normalizedObservation(
    entry.record.id,
    entry.project,
    entry.record.totalAmount,
    entry.record.evidenceReferenceIds,
  );
}

function lineObservation(
  entry: EvaluatedRecord,
  line: EconomicsLineSnapshot,
): NormalizedObservation {
  return normalizedObservation(line.id, entry.project, line.amount, line.evidenceReferenceIds);
}

function lineFor(entry: EvaluatedRecord | null, categoryId: string): CurrentLine | null {
  if (!entry) return null;
  const line = entry.record.lines.find((candidate) => candidate.categoryId === categoryId);
  return line ? Object.freeze({ record: entry.record, line, project: entry.project }) : null;
}

function currentLineObservation(current: CurrentLine | null): NormalizedObservation | null {
  return current
    ? normalizedObservation(
        current.line.id,
        current.project,
        current.line.amount,
        current.line.evidenceReferenceIds,
      )
    : null;
}

function categoryIds(
  currentQuote: EvaluatedRecord | null,
  currentForecast: EvaluatedRecord | null,
): readonly string[] {
  return Object.freeze(
    [
      ...new Set(
        [currentQuote, currentForecast]
          .filter((entry): entry is EvaluatedRecord => entry !== null)
          .flatMap((entry) => entry.record.lines.map((line) => line.categoryId)),
      ),
    ].sort(),
  );
}

function conflictPresentFor(
  evaluated: readonly EvaluatedRecord[],
  purpose: ObservationPurpose,
  categoryId?: string,
): boolean {
  return evaluated.some(
    (entry) =>
      entry.purpose === purpose &&
      entry.decision.reasonCodes.includes("CONFLICTED") &&
      (categoryId === undefined ||
        entry.record.lines.some((line) => line.categoryId === categoryId)),
  );
}

function quotedCategoryAggregate(
  categoryId: string,
  input: QuotedHistoryInput,
  evaluated: readonly EvaluatedRecord[],
  quotedHistory: readonly EvaluatedRecord[],
  activeProject: EconomicsProjectSnapshot,
): HistoricalAggregateDTO {
  return accessAtLeast(input.batch, "QUOTE_ONLY")
    ? aggregate(
        "QUOTED_PRICE",
        quotedHistory.flatMap((entry) =>
          entry.record.lines
            .filter((line) => line.categoryId === categoryId)
            .map((line) => lineObservation(entry, line)),
        ),
        input.stage4.activeContext.areaValue,
        input.generatedAt,
        conflictPresentFor(evaluated, "QUOTED_HISTORY", categoryId),
        input.stage4.activeContext.currency,
        normalizedUnit(activeProject),
      )
    : restrictedAggregate("QUOTED_PRICE");
}

function buildCategory(
  categoryId: string,
  input: HistoricalEconomicsAssemblyInput,
  evaluated: readonly EvaluatedRecord[],
  currentQuote: EvaluatedRecord | null,
  currentForecast: EvaluatedRecord | null,
  quotedHistory: readonly EvaluatedRecord[],
  actualHistory: readonly EvaluatedRecord[],
): CategoryEconomicsDTO {
  const currentQuoteLine = lineFor(currentQuote, categoryId);
  const currentForecastLine = lineFor(currentForecast, categoryId);
  const activeProject = input.batch.projects.find(
    (project) => project.internalId === input.batch.activeProjectId,
  );
  if (!activeProject) throw new Error("ACTIVE_PROJECT_ECONOMICS_MISSING");

  const quotedAggregate = quotedCategoryAggregate(
    categoryId,
    input,
    evaluated,
    quotedHistory,
    activeProject,
  );

  const actualAggregate = accessAtLeast(input.batch, "FULL_ACTUAL")
    ? aggregate(
        "RECONCILED_ACTUAL_COST",
        actualHistory.flatMap((entry) =>
          entry.record.lines
            .filter((line) => line.categoryId === categoryId)
            .map((line) => lineObservation(entry, line)),
        ),
        input.stage4.activeContext.areaValue,
        input.generatedAt,
        conflictPresentFor(evaluated, "ACTUAL_HISTORY", categoryId),
        input.stage4.activeContext.currency,
        normalizedUnit(activeProject),
      )
    : restrictedAggregate("RECONCILED_ACTUAL_COST");

  const quoteVariance = accessAtLeast(input.batch, "QUOTE_ONLY")
    ? varianceFinding(
        "QUOTE",
        "QUOTED_PRICE",
        currentLineObservation(currentQuoteLine),
        currentQuoteLine?.line.amount,
        quotedAggregate,
        input.generatedAt,
      )
    : restrictedVariance("QUOTE", "QUOTED_PRICE");

  const forecastVariance = accessAtLeast(input.batch, "QUOTE_AND_FORECAST")
    ? varianceFinding(
        "FORECAST",
        "RECONCILED_ACTUAL_COST",
        currentLineObservation(currentForecastLine),
        currentForecastLine?.line.amount,
        actualAggregate,
        input.generatedAt,
      )
    : restrictedVariance("FORECAST", "RECONCILED_ACTUAL_COST");

  const warningCodes: string[] = [];
  if (actualAggregate.state === "INSUFFICIENT")
    warningCodes.push("INSUFFICIENT_ACTUAL_COST_EVIDENCE");
  if (actualAggregate.state === "CONFLICTED") warningCodes.push("CONFLICTED_ACTUAL_COST_EVIDENCE");
  if (quotedAggregate.state === "INSUFFICIENT") warningCodes.push("INSUFFICIENT_QUOTED_HISTORY");

  return Object.freeze({
    categoryId,
    quotedHistory: quotedAggregate,
    actualHistory: actualAggregate,
    quoteVariance,
    forecastVariance,
    warningCodes: Object.freeze(warningCodes),
  });
}

function programmeDifference(input: HistoricalEconomicsAssemblyInput): ProgrammeDifferenceDTO {
  const active = input.batch.projects.find(
    (project) => project.internalId === input.batch.activeProjectId,
  );
  const historical = input.batch.projects.filter((project) =>
    input.batch.selectedProjectIds.includes(project.internalId),
  );
  const weeks = historical
    .map((project) => project.programmeWeeks)
    .filter((value): value is string => value !== undefined)
    .map((value) => decimalFromString(value, 2));
  const bounds = minMax(weeks);

  if (!active?.programmeWeeks || !bounds) {
    return Object.freeze({
      state: "UNAVAILABLE",
      quantifiedPremiumState: "UNQUANTIFIED",
      evidenceReferenceIds: Object.freeze([]),
    });
  }

  return Object.freeze({
    state: "KNOWN_DIFFERENCE",
    activeProgrammeWeeks: active.programmeWeeks,
    historicalMinimumWeeks: decimalToString(bounds.minimum),
    historicalMaximumWeeks: decimalToString(bounds.maximum),
    quantifiedPremiumState: "UNQUANTIFIED",
    evidenceReferenceIds: unique([
      ...active.evidenceReferenceIds,
      ...historical.flatMap((project) => project.evidenceReferenceIds),
    ]),
  });
}

function supplierOfferResults(
  evaluated: readonly EvaluatedRecord[],
): readonly SupplierOfferEconomicsDTO[] {
  return Object.freeze(
    evaluated
      .filter(
        (entry) => entry.purpose === "SUPPLIER_HISTORY" || entry.purpose === "SUPPLIER_CURRENT",
      )
      .map((entry) =>
        Object.freeze({
          recordKey: entry.record.recordKey,
          projectKey: entry.project.businessKey,
          authorityState: entry.record.authorityState,
          freshness: entry.decision.freshness,
          ...(entry.decision.eligible
            ? { amount: entry.record.totalAmount, currency: entry.record.currency }
            : {}),
          ...(entry.record.validUntil ? { validUntil: entry.record.validUntil } : {}),
          state: entry.decision.eligible
            ? entry.purpose === "SUPPLIER_CURRENT"
              ? "CURRENT_CONTEXT"
              : "HISTORICAL"
            : "EXCLUDED",
          reasonCodes: Object.freeze([...entry.decision.reasonCodes]),
          evidenceReferenceIds: Object.freeze([...entry.record.evidenceReferenceIds]),
        }),
      )
      .sort((left, right) => left.recordKey.localeCompare(right.recordKey)),
  );
}

function valueClaim(
  claimKey: string,
  kind: StructuredEconomicsClaimDTO["kind"],
  titleEn: string,
  titleZhTw: string,
  finding: VarianceFindingDTO,
  categoryId?: string,
): StructuredEconomicsClaimDTO | null {
  if (finding.state !== "VALUE" || !finding.calculationTrace) return null;
  return Object.freeze({
    claimKey,
    kind,
    ...(categoryId ? { categoryId } : {}),
    titleEn,
    titleZhTw,
    value: Object.freeze({
      currentAmount: finding.currentAmount,
      baselineEquivalentAmount: finding.baselineEquivalentAmount,
      variancePercent: finding.variancePercent,
      direction: finding.direction,
      currency: finding.currency,
    }),
    evidenceReferenceIds: Object.freeze([...(finding.evidenceReferenceIds ?? [])]),
    warningCodes: Object.freeze([]),
    calculationTrace: finding.calculationTrace,
  });
}

function claimsFor(
  overallQuote: VarianceFindingDTO,
  overallForecast: VarianceFindingDTO,
  categories: readonly CategoryEconomicsDTO[],
  programme: ProgrammeDifferenceDTO,
  supplierOffers: readonly SupplierOfferEconomicsDTO[],
): readonly StructuredEconomicsClaimDTO[] {
  const claims: StructuredEconomicsClaimDTO[] = [];

  const quoteClaim = valueClaim(
    "OVERALL_QUOTED_VARIANCE",
    "OVERALL_QUOTED_VARIANCE",
    "Current quote versus comparable quoted history",
    "目前報價與類似專案歷史報價比較",
    overallQuote,
  );
  if (quoteClaim) claims.push(quoteClaim);

  const forecastClaim = valueClaim(
    "OVERALL_FORECAST_ACTUAL_VARIANCE",
    "OVERALL_FORECAST_ACTUAL_VARIANCE",
    "Current forecast versus reconciled actual history",
    "目前預估成本與已核對實際成本比較",
    overallForecast,
  );
  if (forecastClaim) claims.push(forecastClaim);

  for (const category of categories) {
    const quoted = valueClaim(
      `${category.categoryId}_QUOTED_VARIANCE`,
      "CATEGORY_QUOTED_VARIANCE",
      `${category.categoryId} quote versus quoted history`,
      `${category.categoryId} 報價與歷史報價比較`,
      category.quoteVariance,
      category.categoryId,
    );
    if (quoted) claims.push(quoted);

    const actual = valueClaim(
      `${category.categoryId}_FORECAST_ACTUAL_VARIANCE`,
      "CATEGORY_FORECAST_ACTUAL_VARIANCE",
      `${category.categoryId} forecast versus reconciled actual history`,
      `${category.categoryId} 預估成本與已核對實際成本比較`,
      category.forecastVariance,
      category.categoryId,
    );
    if (actual) claims.push(actual);

    if (
      category.forecastVariance.state === "INSUFFICIENT" &&
      category.actualHistory.state === "INSUFFICIENT"
    ) {
      claims.push(
        Object.freeze({
          claimKey: `${category.categoryId}_ACTUAL_INSUFFICIENT`,
          kind: "CATEGORY_ACTUAL_INSUFFICIENT",
          categoryId: category.categoryId,
          titleEn: `${category.categoryId} actual-cost evidence is insufficient`,
          titleZhTw: `${category.categoryId} 實際成本資料不足`,
          value: Object.freeze({
            eligibleObservationCount: category.actualHistory.eligibleObservationCount,
            requiredObservationCount: category.actualHistory.requiredObservationCount,
          }),
          observationType: "RECONCILED_ACTUAL_COST",
          sufficiencyCode: "INSUFFICIENT_ACTUAL_COST_EVIDENCE",
          evidenceReferenceIds: Object.freeze([
            ...(category.forecastVariance.evidenceReferenceIds ?? []),
          ]),
          warningCodes: Object.freeze(["INSUFFICIENT_ACTUAL_COST_EVIDENCE"]),
        }),
      );
    }
  }

  if (programme.state === "KNOWN_DIFFERENCE") {
    claims.push(
      Object.freeze({
        claimKey: "PROGRAMME_DIFFERENCE_UNQUANTIFIED",
        kind: "PROGRAMME_DIFFERENCE_UNQUANTIFIED",
        titleEn: "Programme duration differs from the selected precedents",
        titleZhTw: "工期與所選歷史專案存在差異",
        value: Object.freeze({
          activeProgrammeWeeks: programme.activeProgrammeWeeks,
          historicalMinimumWeeks: programme.historicalMinimumWeeks,
          historicalMaximumWeeks: programme.historicalMaximumWeeks,
          quantifiedPremiumState: programme.quantifiedPremiumState,
        }),
        evidenceReferenceIds: Object.freeze([...programme.evidenceReferenceIds]),
        warningCodes: Object.freeze(["PROGRAMME_PREMIUM_UNQUANTIFIED"]),
      }),
    );
  }

  for (const offer of supplierOffers.filter((candidate) => candidate.freshness === "STALE")) {
    claims.push(
      Object.freeze({
        claimKey: `STALE_SUPPLIER_OFFER_${offer.recordKey}`,
        kind: "STALE_SUPPLIER_EVIDENCE",
        titleEn: "Supplier offer is stale historical evidence",
        titleZhTw: "供應商報價為已過期的歷史資料",
        value: Object.freeze({
          recordKey: offer.recordKey,
          projectKey: offer.projectKey,
          validUntil: offer.validUntil,
          freshness: offer.freshness,
        }),
        observationType: "SUPPLIER_OFFER",
        authorityState: offer.authorityState,
        evidenceReferenceIds: Object.freeze([...offer.evidenceReferenceIds]),
        warningCodes: Object.freeze(["SUPPLIER_OFFER_STALE"]),
      }),
    );
  }

  return Object.freeze(claims.sort((left, right) => left.claimKey.localeCompare(right.claimKey)));
}

function persistenceDecisions(
  evaluated: readonly EvaluatedRecord[],
): readonly PersistableObservationDecision[] {
  const decisions: PersistableObservationDecision[] = [];

  for (const entry of evaluated) {
    let normalizedAmount: string | undefined;
    if (entry.decision.eligible) {
      try {
        normalizedAmount = decimalToString(normalizedRate(entry.record.totalAmount, entry.project));
      } catch {
        normalizedAmount = undefined;
      }
    }

    decisions.push(
      Object.freeze({
        observationId: entry.record.id,
        projectId: entry.project.internalId,
        observationType: entry.record.observationType,
        authorityState: entry.record.authorityState,
        included: entry.decision.eligible,
        reasonCodes: Object.freeze([...entry.decision.reasonCodes]),
        ...(normalizedAmount
          ? { normalizedAmount, normalizedUnit: normalizedUnit(entry.project) }
          : {}),
        evidenceReferenceIds: Object.freeze([...entry.record.evidenceReferenceIds]),
      }),
    );

    for (const line of entry.record.lines) {
      let lineNormalized: string | undefined;
      if (entry.decision.eligible) {
        try {
          lineNormalized = decimalToString(normalizedRate(line.amount, entry.project));
        } catch {
          lineNormalized = undefined;
        }
      }
      decisions.push(
        Object.freeze({
          observationId: line.id,
          projectId: entry.project.internalId,
          categoryId: line.categoryId,
          observationType: entry.record.observationType,
          authorityState: line.authorityState,
          included: entry.decision.eligible,
          reasonCodes: Object.freeze([...entry.decision.reasonCodes]),
          ...(lineNormalized
            ? { normalizedAmount: lineNormalized, normalizedUnit: normalizedUnit(entry.project) }
            : {}),
          evidenceReferenceIds: Object.freeze([...line.evidenceReferenceIds]),
        }),
      );
    }
  }

  return Object.freeze(
    decisions.sort((left, right) => left.observationId.localeCompare(right.observationId)),
  );
}

function detailedStates(
  batch: AuthorizedEconomicsBatch,
  categories: readonly CategoryEconomicsDTO[],
  evaluated: readonly EvaluatedRecord[],
  supplierOffers: readonly SupplierOfferEconomicsDTO[],
): readonly Stage5EconomicsState[] {
  const states = new Set<Stage5EconomicsState>();
  if (batch.accessScope !== "FULL_ACTUAL") states.add("PARTIAL_ECONOMICS");
  if (
    accessAtLeast(batch, "FULL_ACTUAL") &&
    categories.some((category) => category.actualHistory.state === "INSUFFICIENT")
  ) {
    states.add("INSUFFICIENT_ACTUAL_EVIDENCE");
  }
  if (evaluated.some((entry) => entry.decision.reasonCodes.includes("CONFLICTED"))) {
    states.add("CONFLICTED_EVIDENCE");
  }
  if (supplierOffers.some((offer) => offer.freshness === "STALE")) {
    states.add("STALE_SUPPLIER_EVIDENCE");
  }
  if (states.size > 0) states.add("PARTIAL_ECONOMICS");
  else states.add("COMPLETE");

  const order: readonly Stage5EconomicsState[] = Object.freeze([
    "COMPLETE",
    "PARTIAL_ECONOMICS",
    "INSUFFICIENT_ACTUAL_EVIDENCE",
    "CONFLICTED_EVIDENCE",
    "STALE_SUPPLIER_EVIDENCE",
  ]);
  return Object.freeze(order.filter((state) => states.has(state)));
}

export class HistoricalEconomicsService {
  constructor(
    private readonly authority = new ObservationAuthorityService(),
    private readonly evidenceBundles = new ComparisonEvidenceBundleService(),
  ) {}

  /** Same quoted-history calculation for scope categories, even before a current quote exists. */
  quotedHistoryBaselines(
    input: QuotedHistoryInput,
    categoryIds: readonly string[],
  ): readonly CategoryQuotedHistory[] {
    if (input.batch.structuralResult.run.id !== input.stage4.run.id)
      throw new Error("STRUCTURAL_RUN_MISMATCH");
    const active = input.batch.projects.find(
      (project) => project.internalId === input.batch.activeProjectId,
    );
    if (!active) throw new Error("ACTIVE_PROJECT_ECONOMICS_MISSING");
    const evaluated = evaluateRecords(input, this.authority);
    const history = accessAtLeast(input.batch, "QUOTE_ONLY")
      ? historyByPurpose(evaluated, "QUOTED_HISTORY")
      : [];
    return [...new Set(categoryIds)].sort().map((categoryId) => {
      const subjects = new Set(
        evaluated
          .filter(
            (entry) =>
              entry.purpose === "QUOTED_HISTORY" &&
              entry.record.lines.some((line) => line.categoryId === categoryId),
          )
          .flatMap((entry) => [
            entry.record.id,
            ...entry.record.lines
              .filter((line) => line.categoryId === categoryId)
              .map((line) => line.id),
          ]),
      );
      return {
        categoryId,
        history: quotedCategoryAggregate(categoryId, input, evaluated, history, active),
        conflictEvidenceIds: accessAtLeast(input.batch, "QUOTE_ONLY")
          ? input.batch.evidence
              .filter(
                (reference) =>
                  subjects.has(reference.subjectId) && reference.conflictIds.length > 0,
              )
              .map((reference) => reference.id)
          : [],
      };
    });
  }

  assemble(input: HistoricalEconomicsAssemblyInput): HistoricalEconomicsAssembly {
    if (input.batch.structuralResult.run.id !== input.stage4.run.id) {
      throw new Error("STRUCTURAL_RUN_MISMATCH");
    }

    const activeProject = input.batch.projects.find(
      (project) => project.internalId === input.batch.activeProjectId,
    );
    if (!activeProject) throw new Error("ACTIVE_PROJECT_ECONOMICS_MISSING");

    const evaluated = evaluateRecords(input, this.authority);
    const currentQuote = accessAtLeast(input.batch, "QUOTE_ONLY")
      ? singleByPurpose(evaluated, "CURRENT_QUOTE")
      : null;
    const currentForecast = accessAtLeast(input.batch, "QUOTE_AND_FORECAST")
      ? singleByPurpose(evaluated, "CURRENT_FORECAST")
      : null;
    const quotedHistory = accessAtLeast(input.batch, "QUOTE_ONLY")
      ? historyByPurpose(evaluated, "QUOTED_HISTORY")
      : Object.freeze([]);
    const actualHistory = accessAtLeast(input.batch, "FULL_ACTUAL")
      ? historyByPurpose(evaluated, "ACTUAL_HISTORY")
      : Object.freeze([]);

    const overallQuotedHistory = accessAtLeast(input.batch, "QUOTE_ONLY")
      ? aggregate(
          "QUOTED_PRICE",
          quotedHistory.map(recordObservation),
          activeProject.areaValue,
          input.generatedAt,
          conflictPresentFor(evaluated, "QUOTED_HISTORY"),
          input.stage4.activeContext.currency,
          normalizedUnit(activeProject),
        )
      : restrictedAggregate("QUOTED_PRICE");
    const overallActualHistory = accessAtLeast(input.batch, "FULL_ACTUAL")
      ? aggregate(
          "RECONCILED_ACTUAL_COST",
          actualHistory.map(recordObservation),
          activeProject.areaValue,
          input.generatedAt,
          conflictPresentFor(evaluated, "ACTUAL_HISTORY"),
          input.stage4.activeContext.currency,
          normalizedUnit(activeProject),
        )
      : restrictedAggregate("RECONCILED_ACTUAL_COST");

    const currentQuoteObservation = currentQuote ? recordObservation(currentQuote) : null;
    const currentForecastObservation = currentForecast ? recordObservation(currentForecast) : null;
    const overallQuoteVariance = accessAtLeast(input.batch, "QUOTE_ONLY")
      ? varianceFinding(
          "QUOTE",
          "QUOTED_PRICE",
          currentQuoteObservation,
          currentQuote?.record.totalAmount,
          overallQuotedHistory,
          input.generatedAt,
        )
      : restrictedVariance("QUOTE", "QUOTED_PRICE");
    const overallForecastVariance = accessAtLeast(input.batch, "QUOTE_AND_FORECAST")
      ? varianceFinding(
          "FORECAST",
          "RECONCILED_ACTUAL_COST",
          currentForecastObservation,
          currentForecast?.record.totalAmount,
          overallActualHistory,
          input.generatedAt,
        )
      : restrictedVariance("FORECAST", "RECONCILED_ACTUAL_COST");

    const categories = Object.freeze(
      categoryIds(currentQuote, currentForecast).map((categoryId) =>
        buildCategory(
          categoryId,
          input,
          evaluated,
          currentQuote,
          currentForecast,
          quotedHistory,
          actualHistory,
        ),
      ),
    );
    const programme = programmeDifference(input);
    const supplierOffers = accessAtLeast(input.batch, "QUOTE_AND_FORECAST")
      ? supplierOfferResults(evaluated)
      : Object.freeze([]);
    const claims = claimsFor(
      overallQuoteVariance,
      overallForecastVariance,
      categories,
      programme,
      supplierOffers,
    );
    const evidenceBundles = this.evidenceBundles.build(claims, input.batch.evidence);
    const states = detailedStates(input.batch, categories, evaluated, supplierOffers);
    const partial = states.includes("PARTIAL_ECONOMICS");

    const result: Stage5EconomicsResult = Object.freeze({
      version: STAGE5_RESULT_VERSION,
      run: Object.freeze({
        id: input.enrichmentRunId,
        comparisonRunId: input.batch.comparisonRunId,
        generatedAt: input.generatedAt,
        snapshotDate: input.snapshotDate,
        status: partial ? "PARTIAL_ECONOMICS" : "COMPLETE",
        authorityPolicyVersion: EVIDENCE_AUTHORITY_POLICY_VERSION,
        calculationVersion: ECONOMICS_CALCULATION_VERSION,
        inputFingerprint: input.inputFingerprint,
        sourceFingerprint: input.sourceFingerprint,
        permissionFingerprint: input.permissionFingerprint,
      }),
      accessScope: input.batch.accessScope,
      structuralResultFingerprint: input.structuralResultFingerprint,
      selectedProjectKeys: Object.freeze([...input.batch.selectedProjectKeys]),
      states,
      summary: Object.freeze({
        quotedHistoryState: overallQuotedHistory.state,
        actualHistoryState: overallActualHistory.state,
        ...(accessAtLeast(input.batch, "FULL_ACTUAL")
          ? { actualEligibleProjectCount: overallActualHistory.eligibleObservationCount ?? 0 }
          : {}),
        ...(accessAtLeast(input.batch, "QUOTE_AND_FORECAST")
          ? {
              staleSupplierOfferCount: supplierOffers.filter((offer) => offer.freshness === "STALE")
                .length,
              conflictCount: evaluated.filter((entry) =>
                entry.decision.reasonCodes.includes("CONFLICTED"),
              ).length,
            }
          : {}),
      }),
      current: Object.freeze({
        ...(currentQuote ? { quoteBeforeTax: currentQuote.record.totalAmount } : {}),
        ...(currentForecast ? { forecastDirectCost: currentForecast.record.totalAmount } : {}),
        currency: input.stage4.activeContext.currency,
      }),
      overall: Object.freeze({
        quotedHistory: overallQuotedHistory,
        actualHistory: overallActualHistory,
        quoteVariance: overallQuoteVariance,
        forecastVariance: overallForecastVariance,
      }),
      categories,
      programmeDifference: programme,
      supplierOffers,
      claims,
      evidenceBundles,
    });

    return Object.freeze({ result, decisions: persistenceDecisions(evaluated) });
  }
}
