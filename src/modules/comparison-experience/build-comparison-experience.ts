import { formatQuoteRate } from "@/modules/quote-draft/presentation";
import type { FirmLists } from "@/modules/firm-lists/domain/contracts";
import {
  areaInFirmUnit,
  areaUnitLabel,
  type AreaDisplayUnit,
} from "@/modules/firm-lists/domain/area-unit";
import {
  claimFindingText,
  findClaim,
  recommendationText,
} from "@/modules/economics/presentation/claim-findings";
import { findingsCopy } from "@/modules/localization/economics-findings";
import { categoryLabel } from "@/modules/localization/jobs";
import { getFinancialCopy } from "@/modules/localization/financial-copy";
import { projectLocationLabel, projectSubtypeLabel } from "@/modules/localization/project-context";
import type { ObservationType } from "@/modules/projects/domain/project-workspace";
import type {
  ComparableProjectMatchDTO,
  DifferenceDTO,
  FactorSummaryDTO,
  Stage4ComparisonResult,
  UnknownFactorDTO,
} from "@/modules/comparisons/domain/contracts";
import type {
  HistoricalAggregateDTO,
  Stage5EconomicsResult,
  VarianceFindingDTO,
} from "@/modules/economics/domain/contracts";
import {
  COMPARISON_EXPERIENCE_VERSION,
  type ComparableProjectCardView,
  type ComparisonCellState,
  type ComparisonExperienceView,
  type ComparisonFactorView,
  type ComparisonNoticeTone,
  type ComparisonSynthesisItemView,
  type ComparisonTableCellView,
  type ComparisonTableColumnView,
  type ComparisonTableRowView,
  type ComparisonTableSectionView,
} from "@/modules/comparison-experience/contracts";
import { getComparisonCopy, type ComparisonCopy } from "@/modules/comparison-experience/copy";
import { sanitizeSelectedProjectKeys } from "@/modules/comparison-experience/route-state";
import type { Locale } from "@/modules/localization/config";

const ACTIVE_COLUMN_KEY = "__ACTIVE_PROJECT__";

function localeCode(locale: Locale): string {
  return locale === "zh-TW" ? "zh-TW" : "en-US";
}

function localizedName(
  locale: Locale,
  value: Readonly<{ nameEn: string; nameZhTw: string }>,
): string {
  return locale === "zh-TW" ? value.nameZhTw : value.nameEn;
}

function formatNumber(locale: Locale, value: string | number, digits = 0): string {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Intl.NumberFormat(localeCode(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(parsed);
}

function formatMoney(locale: Locale, value: string | undefined): string {
  if (value === undefined) return "—";
  return `NT$${formatNumber(locale, value, 0)}`;
}

function formatRate(
  value: string | undefined,
  copy: ComparisonCopy,
  unit: AreaDisplayUnit,
): string {
  if (value === undefined) return "—";
  return `${formatQuoteRate(value, "TWD", unit)} · ${unit === "m2" ? copy.normalizedUnit : copy.normalizedUnit.replace("m²", "坪")}`;
}

function formatPercent(locale: Locale, value: string | undefined): string {
  if (value === undefined) return "—";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Intl.NumberFormat(localeCode(locale), {
    signDisplay: "always",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
    .format(parsed)
    .concat("%");
}

function formatRatio(locale: Locale, value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Intl.NumberFormat(localeCode(locale), {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(parsed);
}

function formatPoints(locale: Locale, value: string): string {
  return formatNumber(locale, value, 1);
}

function formatArea(locale: Locale, value: string, unit: string, catalog: FirmLists): string {
  return unit.toLowerCase() === "m2"
    ? `${areaInFirmUnit(value, catalog.areaDisplayUnit)} ${areaUnitLabel(catalog.areaDisplayUnit)}`
    : `${formatNumber(locale, value, 2)} ${unit}`;
}

function formatDate(locale: Locale, value: string): string {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(localeCode(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function factorFromSummary(
  factor: FactorSummaryDTO,
  locale: Locale,
  copy: ComparisonCopy,
): ComparisonFactorView {
  return Object.freeze({
    factorKey: factor.factorKey,
    label: copy.factors[factor.factorKey],
    state: "KNOWN",
    valueLabel: `${formatRatio(locale, factor.normalizedValue)} · ${copy.factorState.contribution} ${formatPoints(locale, factor.contribution)}`,
    contributionLabel: formatPoints(locale, factor.contribution),
  });
}

function factorFromDifference(
  factor: DifferenceDTO,
  locale: Locale,
  copy: ComparisonCopy,
): ComparisonFactorView {
  return Object.freeze({
    factorKey: factor.factorKey,
    label: copy.factors[factor.factorKey],
    state: "KNOWN",
    valueLabel: `${formatRatio(locale, factor.normalizedValue)} · ${copy.factorState.lostContribution} ${formatPoints(locale, factor.lostContribution)}`,
    contributionLabel: `-${formatPoints(locale, factor.lostContribution)}`,
  });
}

function factorFromUnknown(
  factor: UnknownFactorDTO,
  locale: Locale,
  copy: ComparisonCopy,
): ComparisonFactorView {
  return Object.freeze({
    factorKey: factor.factorKey,
    label: copy.factors[factor.factorKey],
    state: "UNKNOWN",
    valueLabel: `${copy.factorState.unknown} · ${formatNumber(locale, factor.weight, 0)}`,
  });
}

function traceValue(
  aggregate: HistoricalAggregateDTO | undefined,
  projectKey: string,
): string | undefined {
  return aggregate?.calculationTrace?.inputs.find((input) => input.projectKey === projectKey)
    ?.normalizedValue;
}

function aggregateContains(
  aggregate: HistoricalAggregateDTO | undefined,
  projectKey: string,
): boolean {
  return aggregate?.observationProjectKeys?.includes(projectKey) === true;
}

function cell(
  state: ComparisonCellState,
  primary: string,
  tone: ComparisonNoticeTone = "NEUTRAL",
  options: Readonly<{
    secondary?: string | undefined;
    claimKey?: string | undefined;
  }> = {},
): ComparisonTableCellView {
  return Object.freeze({
    state,
    primary,
    tone,
    ...(options.secondary ? { secondary: options.secondary } : {}),
    ...(options.claimKey ? { claimKey: options.claimKey } : {}),
  });
}

function aggregateStateCell(
  aggregate: HistoricalAggregateDTO | undefined,
  projectKey: string,
  locale: Locale,
  copy: ComparisonCopy,
  unit: AreaDisplayUnit,
  claimKey?: string,
): ComparisonTableCellView {
  if (!aggregate) return cell("UNAVAILABLE", copy.states.unavailable);
  if (aggregate.state === "RESTRICTED") {
    return cell("RESTRICTED", copy.states.restricted);
  }
  if (aggregate.state === "CONFLICTED") {
    return cell("CONFLICTED", copy.states.conflicted, "CRITICAL");
  }
  if (aggregate.state === "INSUFFICIENT") {
    return cell("INSUFFICIENT", copy.states.insufficient, "CAUTION", {
      secondary:
        aggregate.eligibleObservationCount === undefined
          ? undefined
          : `${aggregate.eligibleObservationCount}/${aggregate.requiredObservationCount}`,
      claimKey,
    });
  }
  if (aggregate.state !== "SUFFICIENT") {
    return cell("UNAVAILABLE", copy.states.unavailable);
  }
  const value = traceValue(aggregate, projectKey);
  if (!value) return cell("UNAVAILABLE", copy.states.unavailable);
  return cell("VALUE", formatRate(value, copy, unit), "NEUTRAL", {
    secondary: copy.states.sufficient,
    claimKey,
  });
}

function varianceCell(
  finding: VarianceFindingDTO | undefined,
  locale: Locale,
  copy: ComparisonCopy,
  unit: AreaDisplayUnit,
  claimKey?: string,
): ComparisonTableCellView {
  if (!finding) return cell("UNAVAILABLE", copy.states.unavailable);
  if (finding.state === "RESTRICTED") return cell("RESTRICTED", copy.states.restricted);
  if (finding.state === "UNAVAILABLE") return cell("UNAVAILABLE", copy.states.unavailable);
  if (finding.state === "INSUFFICIENT") {
    return cell(
      "INSUFFICIENT",
      formatRate(finding.currentNormalizedAmount, copy, unit),
      "CAUTION",
      { secondary: copy.states.insufficient, claimKey },
    );
  }
  const tone: ComparisonNoticeTone =
    finding.direction === "ALIGNED"
      ? "POSITIVE"
      : finding.direction === "ABOVE"
        ? "CAUTION"
        : "NEUTRAL";
  return cell("VALUE", formatRate(finding.currentNormalizedAmount, copy, unit), tone, {
    secondary: `${formatPercent(locale, finding.variancePercent)} · ${formatMoney(locale, finding.currentAmount)}`,
    claimKey,
  });
}

function projectCellMap(
  stage4: Stage4ComparisonResult,
  selectedKeys: readonly string[],
  activeCell: ComparisonTableCellView,
  matchCell: (match: ComparableProjectMatchDTO) => ComparisonTableCellView,
): Readonly<Record<string, ComparisonTableCellView>> {
  const cells: Record<string, ComparisonTableCellView> = {
    [ACTIVE_COLUMN_KEY]: activeCell,
  };
  const matches = new Map(
    stage4.matches.map((match) => [match.project.projectKey, match] as const),
  );
  for (const key of selectedKeys) {
    const match = matches.get(key);
    if (match) cells[key] = matchCell(match);
  }
  return Object.freeze(cells);
}

function financialCell(
  value: ComparisonTableCellView,
  observationType: ObservationType | undefined,
  locale: Locale,
): ComparisonTableCellView {
  return observationType
    ? Object.freeze({
        ...value,
        observationType,
        observationLabel: getFinancialCopy(locale).observations[observationType],
      })
    : value;
}

function historyRow(
  key: string,
  label: string,
  stage4: Stage4ComparisonResult,
  selectedKeys: readonly string[],
  current: VarianceFindingDTO | undefined,
  aggregate: HistoricalAggregateDTO | undefined,
  locale: Locale,
  copy: ComparisonCopy,
  unit: AreaDisplayUnit,
  claimKey?: string,
): ComparisonTableRowView {
  return Object.freeze({
    key,
    label,
    cells: projectCellMap(
      stage4,
      selectedKeys,
      financialCell(
        varianceCell(current, locale, copy, unit, claimKey),
        current
          ? current.currentBasis === "FORECAST"
            ? "FORECAST_DIRECT_COST"
            : "QUOTED_PRICE"
          : undefined,
        locale,
      ),
      (match) =>
        financialCell(
          aggregateStateCell(aggregate, match.project.projectKey, locale, copy, unit, claimKey),
          aggregate?.observationType,
          locale,
        ),
    ),
  });
}

function unavailableEconomicsRow(
  key: string,
  label: string,
  stage4: Stage4ComparisonResult,
  selectedKeys: readonly string[],
  copy: ComparisonCopy,
): ComparisonTableRowView {
  return Object.freeze({
    key,
    label,
    cells: projectCellMap(stage4, selectedKeys, cell("UNAVAILABLE", copy.states.unavailable), () =>
      cell("UNAVAILABLE", copy.states.unavailable),
    ),
  });
}

function supplierCell(
  economics: Stage5EconomicsResult | undefined,
  projectKey: string,
  locale: Locale,
  copy: ComparisonCopy,
): ComparisonTableCellView {
  const offer = economics?.supplierOffers.find((candidate) => candidate.projectKey === projectKey);
  if (!offer) return cell("UNAVAILABLE", copy.states.unavailable);
  if (offer.freshness === "STALE") {
    return cell("STALE", copy.states.stale, "CAUTION", {
      secondary: offer.validUntil ? formatDate(locale, offer.validUntil) : undefined,
      claimKey: `STALE_SUPPLIER_OFFER_${offer.recordKey}`,
    });
  }
  if (offer.state === "EXCLUDED") return cell("UNAVAILABLE", copy.states.unavailable);
  return cell("VALUE", formatMoney(locale, offer.amount), "NEUTRAL", {
    secondary:
      offer.state === "CURRENT_CONTEXT"
        ? locale === "zh-TW"
          ? "目前資料"
          : "Current context"
        : locale === "zh-TW"
          ? "歷史資料"
          : "Historical context",
  });
}

function programmeCell(
  economics: Stage5EconomicsResult | undefined,
  active: boolean,
  locale: Locale,
  copy: ComparisonCopy,
): ComparisonTableCellView {
  const programme = economics?.programmeDifference;
  if (!programme || programme.state !== "KNOWN_DIFFERENCE") {
    return cell("UNAVAILABLE", copy.states.unavailable);
  }
  if (active) {
    return cell(
      "VALUE",
      `${formatNumber(locale, programme.activeProgrammeWeeks ?? "", 0)} ${copy.programmeUnit}`,
      "CAUTION",
      {
        secondary: copy.synthesis.programmeDifference,
        claimKey: findClaim(economics, "PROGRAMME_DIFFERENCE_UNQUANTIFIED")?.claimKey,
      },
    );
  }
  return cell(
    "VALUE",
    `${formatNumber(locale, programme.historicalMinimumWeeks ?? "", 0)}–${formatNumber(locale, programme.historicalMaximumWeeks ?? "", 0)} ${copy.programmeUnit}`,
    "NEUTRAL",
    { secondary: locale === "zh-TW" ? "已選歷史專案範圍" : "Selected historical range" },
  );
}

function economicsStateLabel(
  economics: Stage5EconomicsResult | undefined,
  copy: ComparisonCopy,
): string {
  if (!economics) return copy.states.structuralOnly;
  if (economics.accessScope === "STRUCTURAL_ONLY") return copy.states.structuralOnly;
  if (economics.accessScope === "QUOTE_ONLY") return copy.states.quotedOnly;
  if (economics.states.includes("PARTIAL_ECONOMICS")) return copy.states.partial;
  return copy.states.complete;
}

function comparableCard(
  match: ComparableProjectMatchDTO,
  economics: Stage5EconomicsResult | undefined,
  locale: Locale,
  copy: ComparisonCopy,
  catalog: FirmLists,
): ComparableProjectCardView {
  const staleOffers =
    economics?.supplierOffers.filter(
      (offer) => offer.projectKey === match.project.projectKey && offer.freshness === "STALE",
    ) ?? [];
  return Object.freeze({
    projectKey: match.project.projectKey,
    name: localizedName(locale, match.project),
    rank: match.rank,
    scoreLabel: `${match.displayScore}/100`,
    band: match.band,
    bandLabel: copy.bands[match.band],
    evidenceCoverageLabel: `${match.displayEvidenceCoverage}%`,
    locationLabel: projectLocationLabel(locale, match.project.location),
    areaLabel: formatArea(locale, match.project.areaValue, match.project.areaUnit, catalog),
    completionLabel: formatDate(locale, match.project.completedAt),
    strongestFactors: Object.freeze(
      match.strongestFactors.map((factor) => factorFromSummary(factor, locale, copy)),
    ),
    differences: Object.freeze(
      match.differences.map((factor) => factorFromDifference(factor, locale, copy)),
    ),
    unknowns: Object.freeze(
      match.unknowns.map((factor) => factorFromUnknown(factor, locale, copy)),
    ),
    quotedHistoryAvailable: aggregateContains(
      economics?.overall.quotedHistory,
      match.project.projectKey,
    ),
    actualHistoryAvailable: aggregateContains(
      economics?.overall.actualHistory,
      match.project.projectKey,
    ),
    warningLabels: Object.freeze(staleOffers.length > 0 ? [copy.notices.staleSupplier] : []),
  });
}

function synthesisItem(
  key: string,
  title: string,
  body: string,
  tone: ComparisonNoticeTone,
  claimKey?: string,
): ComparisonSynthesisItemView {
  return Object.freeze({
    key,
    title,
    body,
    tone,
    ...(claimKey ? { claimKey } : {}),
  });
}

function synthesis(
  economics: Stage5EconomicsResult | undefined,
  locale: Locale,
  copy: ComparisonCopy,
  catalog: FirmLists,
): ComparisonExperienceView["synthesis"] {
  const history: ComparisonSynthesisItemView[] = [];
  const differences: ComparisonSynthesisItemView[] = [];
  const gaps: ComparisonSynthesisItemView[] = [];

  for (const claim of economics?.accessScope === "STRUCTURAL_ONLY"
    ? []
    : (economics?.claims ?? [])) {
    const text = claimFindingText(claim, locale, catalog.workCategories);
    if (!text) continue;
    const destination =
      claim.kind === "CATEGORY_ACTUAL_INSUFFICIENT"
        ? gaps
        : claim.kind === "PROGRAMME_DIFFERENCE_UNQUANTIFIED"
          ? differences
          : history;
    destination.push(
      synthesisItem(
        claim.claimKey,
        destination === gaps
          ? copy.synthesis.gaps
          : destination === differences
            ? copy.synthesis.differences
            : copy.synthesis.history,
        text,
        "CAUTION",
        claim.claimKey,
      ),
    );
  }
  if (!economics || economics.accessScope === "STRUCTURAL_ONLY") {
    gaps.push(
      synthesisItem(
        "restricted-economics",
        copy.synthesis.gaps,
        copy.synthesis.noEconomics,
        "NEUTRAL",
      ),
    );
  }
  const recommendation = recommendationText(economics, locale, catalog.workCategories);
  return Object.freeze({
    history: Object.freeze(history),
    differences: Object.freeze(differences),
    gaps: Object.freeze(gaps),
    ...(recommendation
      ? {
          recommendation: synthesisItem(
            "recommendation",
            copy.synthesis.recommendation,
            recommendation,
            "POSITIVE",
          ),
        }
      : {}),
  });
}

function notices(
  stage4: Stage4ComparisonResult,
  locale: Locale,
  economics: Stage5EconomicsResult | undefined,
  copy: ComparisonCopy,
): readonly ComparisonSynthesisItemView[] {
  const result: ComparisonSynthesisItemView[] = [];
  if (stage4.activeContext.dataClassification === "DEMO_SYNTHETIC") {
    result.push(
      synthesisItem(
        "synthetic",
        copy.summary.demoData,
        copy.notices.synthetic.replace("{job}", localizedName(locale, stage4.activeContext)),
        "NEUTRAL",
      ),
    );
  }
  if (!economics || economics.accessScope === "STRUCTURAL_ONLY") {
    result.push(
      synthesisItem("restricted", copy.synthesis.gaps, copy.notices.restricted, "NEUTRAL"),
    );
  }
  if (economics?.states.includes("INSUFFICIENT_ACTUAL_EVIDENCE")) {
    result.push(
      synthesisItem(
        "insufficient",
        copy.synthesis.gaps,
        copy.notices.insufficientActual,
        "CAUTION",
      ),
    );
  }
  if (economics?.states.includes("CONFLICTED_EVIDENCE")) {
    result.push(synthesisItem("conflict", copy.synthesis.gaps, copy.notices.conflict, "CRITICAL"));
  }
  if (economics?.states.includes("STALE_SUPPLIER_EVIDENCE")) {
    result.push(synthesisItem("stale", copy.synthesis.gaps, copy.notices.staleSupplier, "CAUTION"));
  }
  return Object.freeze(result);
}

function contextSections(
  stage4: Stage4ComparisonResult,
  economics: Stage5EconomicsResult | undefined,
  selectedKeys: readonly string[],
  locale: Locale,
  copy: ComparisonCopy,
  catalog: FirmLists,
): readonly ComparisonTableSectionView[] {
  const contextRows: ComparisonTableRowView[] = [
    Object.freeze({
      key: "subtype",
      label: copy.table.subtype,
      cells: projectCellMap(
        stage4,
        selectedKeys,
        cell(
          "VALUE",
          projectSubtypeLabel(locale, stage4.activeContext.subtype, catalog.jobTypes) ??
            copy.states.unavailable,
        ),
        (match) =>
          cell(
            "VALUE",
            projectSubtypeLabel(locale, match.project.subtype, catalog.jobTypes) ??
              copy.states.unavailable,
          ),
      ),
    }),
    Object.freeze({
      key: "area",
      label: copy.table.area,
      cells: projectCellMap(
        stage4,
        selectedKeys,
        cell(
          "VALUE",
          formatArea(
            locale,
            stage4.activeContext.areaValue,
            stage4.activeContext.areaUnit,
            catalog,
          ),
        ),
        (match) =>
          cell(
            "VALUE",
            formatArea(locale, match.project.areaValue, match.project.areaUnit, catalog),
          ),
      ),
    }),
    Object.freeze({
      key: "location",
      label: copy.table.location,
      cells: projectCellMap(
        stage4,
        selectedKeys,
        cell("VALUE", projectLocationLabel(locale, stage4.activeContext.location)),
        (match) => cell("VALUE", projectLocationLabel(locale, match.project.location)),
      ),
    }),
    Object.freeze({
      key: "completion",
      label: copy.table.completion,
      cells: projectCellMap(
        stage4,
        selectedKeys,
        cell("NOT_APPLICABLE", locale === "zh-TW" ? "進行中" : "Active project"),
        (match) => cell("VALUE", formatDate(locale, match.project.completedAt)),
      ),
    }),
    Object.freeze({
      key: "programme",
      label: copy.table.programme,
      cells: projectCellMap(
        stage4,
        selectedKeys,
        programmeCell(economics, true, locale, copy),
        () => programmeCell(economics, false, locale, copy),
      ),
    }),
  ];

  const economicsRows: ComparisonTableRowView[] = economics
    ? [
        historyRow(
          "overall-quoted",
          copy.table.quotedRate,
          stage4,
          selectedKeys,
          economics.overall.quoteVariance,
          economics.overall.quotedHistory,
          locale,
          copy,
          catalog.areaDisplayUnit,
          findClaim(economics, "OVERALL_QUOTED_VARIANCE")?.claimKey,
        ),
        historyRow(
          "overall-actual",
          copy.table.actualRate,
          stage4,
          selectedKeys,
          economics.overall.forecastVariance,
          economics.overall.actualHistory,
          locale,
          copy,
          catalog.areaDisplayUnit,
          findClaim(economics, "OVERALL_FORECAST_ACTUAL_VARIANCE")?.claimKey,
        ),
      ]
    : [
        unavailableEconomicsRow(
          "overall-quoted",
          copy.table.quotedRate,
          stage4,
          selectedKeys,
          copy,
        ),
        unavailableEconomicsRow(
          "overall-actual",
          copy.table.actualRate,
          stage4,
          selectedKeys,
          copy,
        ),
      ];

  const categoryRows: ComparisonTableRowView[] = [];
  for (const category of economics?.categories ?? []) {
    for (const basis of ["QUOTE", "ACTUAL"] as const) {
      const claim =
        basis === "QUOTE"
          ? findClaim(economics, "CATEGORY_QUOTED_VARIANCE", category.categoryId)
          : (findClaim(economics, "CATEGORY_ACTUAL_INSUFFICIENT", category.categoryId) ??
            findClaim(economics, "CATEGORY_FORECAST_ACTUAL_VARIANCE", category.categoryId));
      categoryRows.push(
        historyRow(
          `${category.categoryId}-${basis}`,
          `${categoryLabel(locale, category.categoryId, catalog.workCategories)} · ${basis === "QUOTE" ? findingsCopy(locale).quotedRow : findingsCopy(locale).actualRow}`,
          stage4,
          selectedKeys,
          basis === "QUOTE" ? category.quoteVariance : category.forecastVariance,
          basis === "QUOTE" ? category.quotedHistory : category.actualHistory,
          locale,
          copy,
          catalog.areaDisplayUnit,
          claim?.claimKey,
        ),
      );
    }
  }

  const evidenceRows: ComparisonTableRowView[] = [
    Object.freeze({
      key: "supplier-context",
      label: copy.table.supplierContext,
      cells: projectCellMap(
        stage4,
        selectedKeys,
        financialCell(
          supplierCell(economics, stage4.activeContext.projectKey, locale, copy),
          "SUPPLIER_OFFER",
          locale,
        ),
        (match) =>
          financialCell(
            supplierCell(economics, match.project.projectKey, locale, copy),
            "SUPPLIER_OFFER",
            locale,
          ),
      ),
    }),
    Object.freeze({
      key: "evidence-state",
      label: copy.table.evidenceState,
      cells: projectCellMap(
        stage4,
        selectedKeys,
        cell(
          economics?.accessScope === "STRUCTURAL_ONLY" ? "RESTRICTED" : "VALUE",
          economicsStateLabel(economics, copy),
          economics?.states.includes("CONFLICTED_EVIDENCE") ? "CRITICAL" : "NEUTRAL",
        ),
        (match) => {
          const quoted = aggregateContains(
            economics?.overall.quotedHistory,
            match.project.projectKey,
          );
          const actual = aggregateContains(
            economics?.overall.actualHistory,
            match.project.projectKey,
          );
          return cell(
            quoted || actual ? "VALUE" : "UNAVAILABLE",
            actual
              ? copy.states.complete
              : quoted
                ? copy.states.quotedOnly
                : copy.states.unavailable,
          );
        },
      ),
    }),
  ];

  return Object.freeze([
    Object.freeze({
      key: "context",
      label: copy.table.projectContext,
      rows: Object.freeze(contextRows),
    }),
    Object.freeze({
      key: "economics",
      label: copy.table.economics,
      rows: Object.freeze(economicsRows),
    }),
    Object.freeze({
      key: "categories",
      label: copy.table.categories,
      rows: Object.freeze(categoryRows),
    }),
    Object.freeze({
      key: "evidence",
      label: copy.table.evidenceState,
      rows: Object.freeze(evidenceRows),
    }),
  ]);
}

export function buildComparisonExperience(
  input: Readonly<{
    catalog: FirmLists;
    stage4: Stage4ComparisonResult;
    economics?: Stage5EconomicsResult | undefined;
    locale: Locale;
    requestedSelectedProjectKeys?: readonly string[] | undefined;
  }>,
): ComparisonExperienceView {
  const { stage4, economics, locale, catalog } = input;
  if (economics && economics.run.comparisonRunId !== stage4.run.id) {
    throw new Error("COMPARISON_EXPERIENCE_RUN_MISMATCH");
  }

  const copy = getComparisonCopy(locale);
  const authorizedKeys = stage4.matches.map((match) => match.project.projectKey);
  const requested = economics?.selectedProjectKeys ?? input.requestedSelectedProjectKeys ?? [];
  const selectedProjectKeys = sanitizeSelectedProjectKeys(
    requested,
    authorizedKeys,
    stage4.defaultSelectedProjectKeys,
  );
  const matchByKey = new Map(stage4.matches.map((match) => [match.project.projectKey, match]));
  const columns: ComparisonTableColumnView[] = [
    Object.freeze({
      key: ACTIVE_COLUMN_KEY,
      label: localizedName(locale, stage4.activeContext),
      kind: "ACTIVE",
    }),
  ];
  for (const key of selectedProjectKeys) {
    const match = matchByKey.get(key);
    if (!match) continue;
    columns.push(
      Object.freeze({
        key,
        label: localizedName(locale, match.project),
        kind: "COMPARABLE",
      }),
    );
  }

  return Object.freeze({
    version: COMPARISON_EXPERIENCE_VERSION,
    catalog: input.catalog,
    locale,
    route: Object.freeze({
      projectKey: stage4.activeContext.projectKey,
      comparisonRunId: stage4.run.id,
      ...(economics ? { economicsRunId: economics.run.id } : {}),
      selectedProjectKeys,
    }),
    heading: Object.freeze({
      eyebrow: copy.eyebrow,
      title: `${copy.titlePrefix} ${localizedName(locale, stage4.activeContext)}`,
      description: copy.description,
    }),
    summary: Object.freeze({
      generatedAtLabel: formatDate(locale, economics?.run.generatedAt ?? stage4.run.generatedAt),
      policyLabel: copy.similarityMethod,
      authorizedMatchCountLabel: formatNumber(locale, stage4.summary.primaryMatchCount, 0),
      selectedCountLabel: `${selectedProjectKeys.length}/3`,
      economicsStateLabel: economicsStateLabel(economics, copy),
      ...(stage4.activeContext.dataClassification === "DEMO_SYNTHETIC"
        ? {
            syntheticDataLabel: copy.notices.synthetic.replace(
              "{job}",
              localizedName(locale, stage4.activeContext),
            ),
          }
        : {}),
    }),
    activeProject: Object.freeze({
      projectKey: stage4.activeContext.projectKey,
      name: localizedName(locale, stage4.activeContext),
      subtypeLabel:
        projectSubtypeLabel(locale, stage4.activeContext.subtype, catalog.jobTypes) ??
        copy.states.unavailable,
      areaLabel: formatArea(
        locale,
        stage4.activeContext.areaValue,
        stage4.activeContext.areaUnit,
        catalog,
      ),
      locationLabel: projectLocationLabel(locale, stage4.activeContext.location),
      ...(stage4.activeContext.activeQuoteVersionKey
        ? { quoteVersionLabel: stage4.activeContext.activeQuoteVersionKey }
        : {}),
    }),
    cards: Object.freeze(
      stage4.matches.map((match) =>
        comparableCard(
          match,
          stage4.activeContext.activeQuoteVersionKey ? economics : undefined,
          locale,
          copy,
          catalog,
        ),
      ),
    ),
    initialSelectedProjectKeys: selectedProjectKeys,
    maximumSelectedProjects: 3,
    table: Object.freeze({
      columns: Object.freeze(columns),
      sections: contextSections(
        stage4,
        stage4.activeContext.activeQuoteVersionKey ? economics : undefined,
        selectedProjectKeys,
        locale,
        copy,
        catalog,
      ),
    }),
    synthesis: stage4.activeContext.activeQuoteVersionKey
      ? synthesis(economics, locale, copy, catalog)
      : {
          history: [],
          differences: [],
          gaps: [
            synthesisItem("no-quote", copy.synthesis.gaps, findingsCopy(locale).noQuote, "NEUTRAL"),
          ],
        },
    notices: notices(stage4, locale, economics, copy),
  });
}
