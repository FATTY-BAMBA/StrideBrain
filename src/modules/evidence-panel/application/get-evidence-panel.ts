import type { FirmLists } from "@/modules/firm-lists/domain/contracts";
import { areaUnitLabel } from "@/modules/firm-lists/domain/area-unit";
import { formatQuoteRate, formatAreaRateNumber } from "@/modules/quote-draft/presentation";
import type {
  ComparisonFreshness,
  ComparisonFreshnessReader,
} from "@/modules/comparisons/domain/freshness";
import {
  evidenceValueLabel,
  evidenceRecordTypeLabel,
  evidenceTitle,
  evidencePolicyDescription,
} from "@/modules/evidence-panel/presentation";
import { sha256 } from "@/modules/comparisons/application/fingerprints";
import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type {
  AuthorizedEvidenceBundleDTO,
  CalculationTraceDTO,
  Stage5EconomicsResult,
  StructuredEconomicsClaimDTO,
} from "@/modules/economics/domain/contracts";
import type {
  EvidenceFactorTraceView,
  EvidenceFinancialTraceView,
  EvidencePanelCondition,
  EvidencePanelOutcome,
  EvidencePanelSelection,
  EvidencePanelSourceView,
  EvidencePanelView,
} from "@/modules/evidence-panel/contracts";
import { EVIDENCE_PANEL_VERSION } from "@/modules/evidence-panel/contracts";
import { getEvidencePanelCopy, type EvidencePanelCopy } from "@/modules/evidence-panel/copy";
import type { Locale } from "@/modules/localization/config";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";
import type { EconomicsEnrichmentRunRepositoryPort } from "@/repositories/ports/economics-enrichment-run-repository";
import type {
  EvidenceConflictRecord,
  EvidenceFactorRecord,
  EvidencePanelRepositoryPort,
  EvidenceSourceRecord,
} from "@/repositories/ports/evidence-panel-repository";

function localeCode(locale: Locale): string {
  return locale === "zh-TW" ? "zh-TW" : "en-US";
}

function formatDate(locale: Locale, value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(localeCode(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatNumber(locale: Locale, value: unknown, digits = 2): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value ?? "—");
  return new Intl.NumberFormat(localeCode(locale), {
    maximumFractionDigits: digits,
  }).format(parsed);
}

const normalizedRateFields = new Set([
  "currentNormalizedAmount",
  "baselineMedianNormalizedAmount",
  "medianNormalizedAmount",
  "minimumNormalizedAmount",
  "maximumNormalizedAmount",
]);

function formatValue(
  locale: Locale,
  key: string,
  value: unknown,
  catalog: FirmLists,
  record: Readonly<Record<string, unknown>> = {},
): string {
  if (value === null || value === undefined) return "—";
  const normalizedUnit = record.unit === "TWD_PER_M2";
  const lineRate =
    ["unitPrice", "unitRate"].includes(key) && ["m2", "m²"].includes(String(record.unit));
  if (
    (normalizedRateFields.has(key) ||
      (normalizedUnit && ["amount", "normalizedValue", "unitRate"].includes(key)) ||
      lineRate) &&
    !(key === "unitRate" && catalog.areaDisplayUnit === "m2")
  ) {
    // Retain the m² presentation; convert only the displayed projection, never the evidence DTO.
    if (key === "normalizedValue") {
      if (catalog.areaDisplayUnit === "ping")
        return `${formatAreaRateNumber(String(value), catalog.areaDisplayUnit)} /坪`;
    } else {
      return (
        formatQuoteRate(String(value), "TWD", catalog.areaDisplayUnit) +
        (catalog.areaDisplayUnit === "ping" ? `/${areaUnitLabel(catalog.areaDisplayUnit)}` : "")
      );
    }
  }
  if (key === "field") {
    const label = getEvidencePanelCopy(locale).fieldLabels[String(value)];
    if (label) return label;
  }
  if (key === "kind") return evidenceRecordTypeLabel(locale, String(value));
  if (key === "descriptionEn" || key === "descriptionZhTw") return String(value);
  if (typeof value === "boolean")
    return value ? (locale === "zh-TW" ? "是" : "Yes") : locale === "zh-TW" ? "否" : "No";
  if (Array.isArray(value))
    return value.map((entry) => evidenceValueLabel(locale, String(entry), catalog)).join(", ");
  if (typeof value === "object") return locale === "zh-TW" ? "結構化紀錄" : "Structured record";
  if (key.toLowerCase().includes("percent")) {
    const number = Number(value);
    return Number.isFinite(number)
      ? `${new Intl.NumberFormat(localeCode(locale), { signDisplay: "always", maximumFractionDigits: 1 }).format(number)}%`
      : String(value);
  }
  if (
    key.toLowerCase().includes("amount") ||
    key.toLowerCase().includes("cost") ||
    key.toLowerCase().includes("price")
  ) {
    return Number.isFinite(Number(value)) ? `NT$${formatNumber(locale, value, 0)}` : String(value);
  }
  return evidenceValueLabel(locale, String(value), catalog);
}

function fieldsFromObject(
  locale: Locale,
  value: Readonly<Record<string, unknown>>,
  copy: EvidencePanelCopy,
  catalog: FirmLists,
): readonly Readonly<{ label: string; value: string }>[] {
  return Object.freeze(
    Object.entries(value)
      .filter(([key]) => copy.fieldLabels[key] !== undefined)
      .map(([key, field]) =>
        Object.freeze({
          label: copy.fieldLabels[key]!,
          value: formatValue(locale, key, field, catalog, value),
        }),
      ),
  );
}

function locatorLabel(
  locator: Readonly<Record<string, unknown>>,
  locale: Locale,
  copy: EvidencePanelCopy,
  catalog: FirmLists,
): string {
  const fields = fieldsFromObject(locale, locator, copy, catalog);
  return fields.length
    ? fields.map((field) => `${field.label}: ${field.value}`).join(" · ")
    : copy.structuredRecord;
}

export function evidenceSourceKey(comparisonRunId: string, referenceId: string): string {
  return sha256({ comparisonRunId, referenceId }).slice(0, 24);
}

function sourceConditions(
  source: EvidenceSourceRecord,
  activeProjectKey: string,
): readonly EvidencePanelCondition[] {
  const states = new Set<EvidencePanelCondition>();
  states.add(source.projectKey === activeProjectKey ? "CURRENT" : "HISTORICAL");
  if (source.staleAt) states.add("STALE");
  if (source.supersededByLabel || source.authorityState === "SUPERSEDED") states.add("SUPERSEDED");
  if (source.conflictKeys.length > 0 || source.authorityState === "CONFLICTED") {
    states.add("CONFLICTED");
  }
  return Object.freeze([...states]);
}

function sourceSelection(base: EvidencePanelSelection, sourceKey: string): EvidencePanelSelection {
  if (base.mode === "CLAIM") {
    return Object.freeze({
      mode: "SOURCE",
      comparisonRunId: base.comparisonRunId,
      enrichmentRunId: base.enrichmentRunId,
      sourceKey,
      claimKey: base.claimKey,
    });
  }
  if (base.mode === "FACTOR") {
    return Object.freeze({
      mode: "SOURCE",
      comparisonRunId: base.comparisonRunId,
      sourceKey,
      candidateProjectKey: base.candidateProjectKey,
      factorKey: base.factorKey,
    });
  }
  if (base.mode === "SOURCE") return base;
  return Object.freeze({
    mode: "SOURCE",
    comparisonRunId: base.comparisonRunId,
    ...(base.enrichmentRunId ? { enrichmentRunId: base.enrichmentRunId } : {}),
    sourceKey,
    ...(base.claimKey ? { claimKey: base.claimKey } : {}),
    ...(base.candidateProjectKey ? { candidateProjectKey: base.candidateProjectKey } : {}),
    ...(base.factorKey ? { factorKey: base.factorKey } : {}),
  });
}

export function sourceView(
  source: EvidenceSourceRecord,
  base: EvidencePanelSelection,
  stage4: Stage4ComparisonResult,
  locale: Locale,
  copy: EvidencePanelCopy,
  catalog: FirmLists,
): EvidencePanelSourceView {
  const sourceKey = evidenceSourceKey(stage4.run.id, source.referenceId);
  const conditions = sourceConditions(source, stage4.activeContext.projectKey);
  const preview =
    source.previewState === "STRUCTURED"
      ? Object.freeze({
          state: "STRUCTURED" as const,
          fields: Object.freeze(
            source.previewFields
              .filter(
                (field) =>
                  copy.fieldLabels[field.key] !== undefined &&
                  field.key !== (locale === "zh-TW" ? "descriptionEn" : "descriptionZhTw"),
              )
              .map((field) =>
                Object.freeze({
                  label: copy.fieldLabels[field.key]!,
                  value: formatValue(
                    locale,
                    field.key,
                    field.value,
                    catalog,
                    Object.fromEntries(
                      source.previewFields.map((entry) => [entry.key, entry.value]),
                    ),
                  ),
                }),
              ),
          ),
        })
      : Object.freeze({
          state: source.previewState,
          message:
            source.previewState === "UNSUPPORTED"
              ? copy.previewUnsupported
              : copy.previewUnavailable,
        });
  return Object.freeze({
    sourceKey,
    title: evidenceTitle(locale, locale === "zh-TW" ? source.titleZhTw : source.titleEn, catalog),
    objectTypeLabel: copy.subjectLabels[source.subjectType] ?? copy.structuredRecord,
    ...(source.versionLabel ? { versionLabel: source.versionLabel } : {}),
    projectLabel: locale === "zh-TW" ? source.projectNameZhTw : source.projectNameEn,
    ...(source.effectiveAt ? { effectiveDateLabel: formatDate(locale, source.effectiveAt) } : {}),
    locatorLabel: locatorLabel(source.locator, locale, copy, catalog),
    authorityState: source.authorityState,
    authorityLabel: copy.authorityLabels[source.authorityState],
    ...(source.observationType
      ? {
          observationType: source.observationType,
          observationTypeLabel: copy.observationLabels[source.observationType],
        }
      : {}),
    dataClassificationLabel: copy.classificationLabels[source.dataClassification],
    ...(source.supportedValue
      ? {
          supportedValueLabel: fieldsFromObject(locale, source.supportedValue, copy, catalog)
            .map((field) => `${field.label}: ${field.value}`)
            .join(" · "),
        }
      : {}),
    conditions,
    conditionLabels: Object.freeze(conditions.map((condition) => copy.conditionLabels[condition])),
    conflictKeys: source.conflictKeys,
    preview,
    sourceSelection: sourceSelection(base, sourceKey),
  });
}

function financialTrace(
  trace: CalculationTraceDTO,
  stage4: Stage4ComparisonResult,
  sources: readonly EvidenceSourceRecord[],
  locale: Locale,
  copy: EvidencePanelCopy,
  catalog: FirmLists,
): EvidenceFinancialTraceView {
  return Object.freeze({
    kind: "FINANCIAL",
    operation: trace.operation,
    operationLabel: evidenceValueLabel(locale, trace.operation, catalog),
    aggregationLabel: evidenceValueLabel(locale, trace.aggregation, catalog),
    roundingLabel: evidenceValueLabel(locale, trace.rounding, catalog),
    policyDescription: evidencePolicyDescription(locale, "FINANCIAL"),
    calculationVersion: trace.calculationVersion,
    aggregation: trace.aggregation,
    rounding: trace.rounding,
    generatedAtLabel: formatDate(locale, trace.generatedAt),
    inputs: Object.freeze(
      trace.inputs.map((input) =>
        Object.freeze({
          projectKey: input.projectKey,
          ...(() => {
            const types = [
              ...new Set(
                sources
                  .filter((source) => input.evidenceReferenceIds.includes(source.referenceId))
                  .flatMap((source) => (source.observationType ? [source.observationType] : [])),
              ),
            ];
            const observationType = types.length === 1 ? types[0] : undefined;
            return observationType
              ? { observationType, observationLabel: copy.observationLabels[observationType] }
              : {};
          })(),
          projectLabel: (() => {
            const project =
              input.projectKey === stage4.activeContext.projectKey
                ? stage4.activeContext
                : stage4.matches.find((match) => match.project.projectKey === input.projectKey)
                    ?.project;
            return project
              ? locale === "zh-TW"
                ? project.nameZhTw
                : project.nameEn
              : copy.project;
          })(),
          sourceCountLabel: copy.sourceCount.replace(
            "{count}",
            String(input.evidenceReferenceIds.length),
          ),
          normalizedValueLabel: `${input.unit === "TWD_PER_M2" ? formatAreaRateNumber(input.normalizedValue, catalog.areaDisplayUnit) : formatNumber(locale, input.normalizedValue, 2)} ${evidenceValueLabel(locale, input.unit, catalog)}`,
          sourceCount: input.evidenceReferenceIds.length,
        }),
      ),
    ),
    resultFields: fieldsFromObject(locale, trace.result, copy, catalog),
  });
}

function factorTrace(
  factor: EvidenceFactorRecord,
  locale: Locale,
  copy: EvidencePanelCopy,
  catalog: FirmLists,
): EvidenceFactorTraceView {
  return Object.freeze({
    kind: "FACTOR",
    policyVersion: "CPI-SIM-1.0",
    policyDescription: evidencePolicyDescription(locale, "FACTOR"),
    factorKey: factor.factorKey,
    factorLabel: copy.factorLabels[factor.factorKey],
    state: factor.state,
    stateLabel: copy.factorStateLabels[factor.state],
    ...(factor.normalizedValue
      ? { normalizedValueLabel: formatNumber(locale, factor.normalizedValue, 4) }
      : {}),
    weightLabel: formatNumber(locale, factor.weight, 1),
    ...(factor.contribution
      ? { contributionLabel: formatNumber(locale, factor.contribution, 1) }
      : {}),
    totalScoreLabel: `${formatNumber(locale, factor.totalScore, 1)}/100`,
    evidenceCoverageLabel: `${formatNumber(locale, factor.evidenceCoverage, 1)}%`,
    explanationLabel:
      Object.keys(factor.explanation).length > 0
        ? fieldsFromObject(locale, factor.explanation, copy, catalog)
            .map((field) => `${field.label}: ${field.value}`)
            .join(" · ")
        : copy.factorStateLabels[factor.state],
  });
}

function claimValueLabel(
  claim: StructuredEconomicsClaimDTO,
  locale: Locale,
  copy: EvidencePanelCopy,
  catalog: FirmLists,
): string | undefined {
  const fields = fieldsFromObject(locale, claim.value, copy, catalog);
  return fields.length > 0
    ? fields.map((field) => `${field.label}: ${field.value}`).join(" · ")
    : undefined;
}

function context(
  stage4: Stage4ComparisonResult,
  economics: Stage5EconomicsResult | null,
  locale: Locale,
  freshness: ComparisonFreshness,
): EvidencePanelView["context"] {
  return Object.freeze({
    projectKey: stage4.activeContext.projectKey,
    projectName: locale === "zh-TW" ? stage4.activeContext.nameZhTw : stage4.activeContext.nameEn,
    comparisonRunId: stage4.run.id,
    ...(economics ? { enrichmentRunId: economics.run.id } : {}),
    snapshotLabel: formatDate(locale, economics?.run.generatedAt ?? stage4.run.generatedAt),
    stale: freshness.state === "STALE",
    freshness,
  });
}

function headingFor(
  mode: EvidencePanelSelection["mode"],
  selectedTitle: string,
  copy: EvidencePanelCopy,
): EvidencePanelView["heading"] {
  const description =
    mode === "CLAIM"
      ? copy.claimModeDescription
      : mode === "FACTOR"
        ? copy.factorModeDescription
        : mode === "SOURCE"
          ? copy.sourceModeDescription
          : copy.conflictModeDescription;
  return Object.freeze({ eyebrow: copy.eyebrow, title: selectedTitle || copy.title, description });
}

function findClaim(
  economics: Stage5EconomicsResult,
  claimKey: string,
): Readonly<{ claim: StructuredEconomicsClaimDTO; bundle: AuthorizedEvidenceBundleDTO }> | null {
  const claim = economics.claims.find((candidate) => candidate.claimKey === claimKey);
  const bundle = economics.evidenceBundles.find((candidate) => candidate.claimKey === claimKey);
  return claim && bundle ? { claim, bundle } : null;
}

function sourceReferenceByKey(
  comparisonRunId: string,
  referenceIds: readonly string[],
  requestedSourceKey: string,
): string | undefined {
  return referenceIds.find(
    (referenceId) => evidenceSourceKey(comparisonRunId, referenceId) === requestedSourceKey,
  );
}

function backSelectionForSource(
  selection: Extract<EvidencePanelSelection, { mode: "SOURCE" }>,
): EvidencePanelSelection {
  if (selection.claimKey && selection.enrichmentRunId) {
    return Object.freeze({
      mode: "CLAIM",
      comparisonRunId: selection.comparisonRunId,
      enrichmentRunId: selection.enrichmentRunId,
      claimKey: selection.claimKey,
    });
  }
  return Object.freeze({
    mode: "FACTOR",
    comparisonRunId: selection.comparisonRunId,
    candidateProjectKey: selection.candidateProjectKey ?? "",
    factorKey: selection.factorKey ?? "SUBTYPE",
  });
}

function conflictImpact(conflict: EvidenceConflictRecord, locale: Locale): string {
  if (conflict.status === "RESOLVED") {
    return locale === "zh-TW"
      ? "此不一致已解決，保留供稽核。"
      : "This conflict is resolved and retained for audit.";
  }
  if (conflict.status === "DISMISSED") {
    return locale === "zh-TW"
      ? "此不一致已標記為不影響計算。"
      : "This conflict was dismissed and does not affect the calculation.";
  }
  return locale === "zh-TW"
    ? "系統未自行選擇任何一筆；受影響資料不會進入權威計算。"
    : "StrideBrain did not silently select either record; affected evidence is excluded from authoritative calculations.";
}

export class GetEvidencePanel {
  constructor(
    private readonly comparisons: ComparisonRunRepositoryPort,
    private readonly economics: EconomicsEnrichmentRunRepositoryPort,
    private readonly evidence: EvidencePanelRepositoryPort,
    private readonly freshness: ComparisonFreshnessReader,
  ) {}

  async execute(
    runtime: RuntimeContext,
    selection: EvidencePanelSelection,
    locale: Locale,
    checkedFreshness?: ComparisonFreshness,
  ): Promise<EvidencePanelOutcome> {
    const catalog = runtime.firmLists;
    if (!catalog) return { kind: "UNAVAILABLE", requestId: runtime.requestId };
    try {
      const stage4 = await this.comparisons.getAuthorizedResult(runtime, selection.comparisonRunId);
      if (!stage4) return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
      const enrichmentId = "enrichmentRunId" in selection ? selection.enrichmentRunId : undefined;
      const freshness =
        checkedFreshness?.comparisonRunId === stage4.run.id &&
        (!enrichmentId || checkedFreshness.enrichmentRunId === enrichmentId)
          ? checkedFreshness
          : await this.freshness.check(
              runtime,
              stage4,
              enrichmentId ? await this.economics.getAuthorizedResult(runtime, enrichmentId) : null,
            );
      const copy = getEvidencePanelCopy(locale);

      if (selection.mode === "CLAIM") {
        const stage5 = await this.economics.getAuthorizedResult(runtime, selection.enrichmentRunId);
        if (!stage5 || stage5.run.comparisonRunId !== stage4.run.id) {
          return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        }
        const found = findClaim(stage5, selection.claimKey);
        if (!found) return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        const resolved = await this.evidence.getAuthorizedSources(
          runtime,
          stage4.run.id,
          found.bundle.sources.map((source) => source.referenceId),
        );
        if (resolved.kind === "ACCESS_CHANGED") {
          return Object.freeze({ kind: "ACCESS_CHANGED", requestId: runtime.requestId });
        }
        if (resolved.kind !== "COMPLETE") {
          return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        }
        const sources = Object.freeze(
          resolved.sources.map((source) =>
            sourceView(source, selection, stage4, locale, copy, catalog),
          ),
        );
        const warningLabels = Object.freeze(
          found.claim.warningCodes.map(
            (warning) => copy.warningLabels[warning] ?? copy.unknownDetail,
          ),
        );
        const view: EvidencePanelView = Object.freeze({
          catalog,
          version: EVIDENCE_PANEL_VERSION,
          locale,
          mode: "CLAIM",
          context: context(stage4, stage5, locale, freshness),
          heading: headingFor(
            "CLAIM",
            evidenceTitle(
              locale,
              locale === "zh-TW" ? found.claim.titleZhTw : found.claim.titleEn,
              catalog,
            ),
            copy,
          ),
          claim: Object.freeze({
            claimKey: found.claim.claimKey,
            kindLabel: copy.claimKindLabels[found.claim.kind],
            ...(claimValueLabel(found.claim, locale, copy, catalog)
              ? { valueLabel: claimValueLabel(found.claim, locale, copy, catalog) }
              : {}),
            ...(() => {
              const observationType =
                found.claim.observationType ??
                (found.claim.kind.includes("FORECAST_ACTUAL")
                  ? "FORECAST_DIRECT_COST"
                  : found.claim.kind.includes("QUOTED")
                    ? "QUOTED_PRICE"
                    : undefined);
              return observationType
                ? { observationTypeLabel: copy.observationLabels[observationType] }
                : {};
            })(),
            ...(found.claim.authorityState
              ? { authorityLabel: copy.authorityLabels[found.claim.authorityState] }
              : {}),
            ...(found.claim.sufficiencyCode
              ? {
                  sufficiencyLabel:
                    copy.sufficiencyLabels[found.claim.sufficiencyCode] ?? copy.unknownDetail,
                }
              : {}),
            warningLabels,
          }),
          sources,
          ...(found.bundle.calculationTrace
            ? {
                trace: financialTrace(
                  found.bundle.calculationTrace,
                  stage4,
                  resolved.sources,
                  locale,
                  copy,
                  catalog,
                ),
              }
            : {}),
          notices: Object.freeze(
            found.claim.sufficiencyCode
              ? [
                  Object.freeze({
                    tone: "CAUTION" as const,
                    text: copy.sufficiencyLabels[found.claim.sufficiencyCode] ?? copy.unknownDetail,
                  }),
                ]
              : [],
          ),
        });
        return Object.freeze({ kind: "READY", view });
      }

      if (selection.mode === "FACTOR") {
        const match = stage4.matches.find(
          (candidate) => candidate.project.projectKey === selection.candidateProjectKey,
        );
        if (!match) return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        const factor = await this.evidence.getAuthorizedFactor(
          runtime,
          stage4.run.id,
          selection.candidateProjectKey,
          selection.factorKey,
        );
        if (!factor) return Object.freeze({ kind: "RESTRICTED", requestId: runtime.requestId });
        const resolved = await this.evidence.getAuthorizedSources(
          runtime,
          stage4.run.id,
          factor.evidenceReferenceIds,
        );
        if (resolved.kind === "ACCESS_CHANGED") {
          return Object.freeze({ kind: "ACCESS_CHANGED", requestId: runtime.requestId });
        }
        if (resolved.kind !== "COMPLETE") {
          return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        }
        const sources = Object.freeze(
          resolved.sources.map((source) =>
            sourceView(source, selection, stage4, locale, copy, catalog),
          ),
        );
        const candidateName =
          locale === "zh-TW" ? factor.candidateProjectNameZhTw : factor.candidateProjectNameEn;
        const view: EvidencePanelView = Object.freeze({
          catalog,
          version: EVIDENCE_PANEL_VERSION,
          locale,
          mode: "FACTOR",
          context: context(stage4, null, locale, freshness),
          heading: headingFor(
            "FACTOR",
            `${copy.factorLabels[factor.factorKey]} · ${candidateName}`,
            copy,
          ),
          factor: Object.freeze({
            candidateProjectKey: factor.candidateProjectKey,
            candidateProjectName: candidateName,
          }),
          sources,
          trace: factorTrace(factor, locale, copy, catalog),
          notices: Object.freeze(
            factor.state === "UNKNOWN"
              ? [Object.freeze({ tone: "CAUTION" as const, text: copy.factorStateLabels.UNKNOWN })]
              : [],
          ),
        });
        return Object.freeze({ kind: "READY", view });
      }

      if (selection.mode === "SOURCE") {
        let stage5: Stage5EconomicsResult | null = null;
        let sourceReferenceId: string | undefined;
        let backSelection: EvidencePanelSelection;
        let selectedTitle = copy.title;
        if (selection.claimKey && selection.enrichmentRunId) {
          stage5 = await this.economics.getAuthorizedResult(runtime, selection.enrichmentRunId);
          if (!stage5 || stage5.run.comparisonRunId !== stage4.run.id) {
            return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
          }
          const found = findClaim(stage5, selection.claimKey);
          if (!found) return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
          sourceReferenceId = sourceReferenceByKey(
            stage4.run.id,
            found.bundle.sources.map((source) => source.referenceId),
            selection.sourceKey,
          );
          selectedTitle = evidenceTitle(
            locale,
            locale === "zh-TW" ? found.claim.titleZhTw : found.claim.titleEn,
            catalog,
          );
          backSelection = backSelectionForSource(selection);
        } else if (selection.candidateProjectKey && selection.factorKey) {
          const factor = await this.evidence.getAuthorizedFactor(
            runtime,
            stage4.run.id,
            selection.candidateProjectKey,
            selection.factorKey,
          );
          if (!factor) return Object.freeze({ kind: "RESTRICTED", requestId: runtime.requestId });
          sourceReferenceId = sourceReferenceByKey(
            stage4.run.id,
            factor.evidenceReferenceIds,
            selection.sourceKey,
          );
          selectedTitle = `${copy.factorLabels[factor.factorKey]} · ${locale === "zh-TW" ? factor.candidateProjectNameZhTw : factor.candidateProjectNameEn}`;
          backSelection = backSelectionForSource(selection);
        } else {
          return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        }
        if (!sourceReferenceId) {
          return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        }
        const resolved = await this.evidence.getAuthorizedSources(runtime, stage4.run.id, [
          sourceReferenceId,
        ]);
        if (resolved.kind === "ACCESS_CHANGED") {
          return Object.freeze({ kind: "ACCESS_CHANGED", requestId: runtime.requestId });
        }
        if (resolved.kind !== "COMPLETE" || resolved.sources.length !== 1) {
          return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        }
        const selectedSource = resolved.sources[0];
        if (!selectedSource)
          return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        const source = sourceView(selectedSource, selection, stage4, locale, copy, catalog);
        const relatedClaims = stage5
          ? Object.freeze(
              stage5.claims
                .filter((claim) =>
                  stage5.evidenceBundles
                    .find((bundle) => bundle.claimKey === claim.claimKey)
                    ?.sources.some((candidate) => candidate.referenceId === sourceReferenceId),
                )
                .map((claim) =>
                  Object.freeze({
                    claimKey: claim.claimKey,
                    title: evidenceTitle(
                      locale,
                      locale === "zh-TW" ? claim.titleZhTw : claim.titleEn,
                      catalog,
                    ),
                    kindLabel: copy.claimKindLabels[claim.kind],
                  }),
                ),
            )
          : Object.freeze([]);
        const view: EvidencePanelView = Object.freeze({
          catalog,
          version: EVIDENCE_PANEL_VERSION,
          locale,
          mode: "SOURCE",
          context: context(stage4, stage5, locale, freshness),
          heading: headingFor("SOURCE", source.title || selectedTitle, copy),
          selectedSourceKey: selection.sourceKey,
          ...(relatedClaims.length > 0 ? { relatedClaims } : {}),
          sources: Object.freeze([source]),
          notices: Object.freeze([]),
          backSelection,
        });
        return Object.freeze({ kind: "READY", view });
      }

      if (!selection.sourceKey) {
        return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
      }
      let boundReferenceId: string | undefined;
      if (selection.claimKey && selection.enrichmentRunId) {
        const stage5 = await this.economics.getAuthorizedResult(runtime, selection.enrichmentRunId);
        if (!stage5 || stage5.run.comparisonRunId !== stage4.run.id) {
          return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        }
        const found = findClaim(stage5, selection.claimKey);
        if (!found) return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
        boundReferenceId = sourceReferenceByKey(
          stage4.run.id,
          found.bundle.sources.map((source) => source.referenceId),
          selection.sourceKey,
        );
      } else if (selection.candidateProjectKey && selection.factorKey) {
        const factor = await this.evidence.getAuthorizedFactor(
          runtime,
          stage4.run.id,
          selection.candidateProjectKey,
          selection.factorKey,
        );
        if (!factor) return Object.freeze({ kind: "RESTRICTED", requestId: runtime.requestId });
        boundReferenceId = sourceReferenceByKey(
          stage4.run.id,
          factor.evidenceReferenceIds,
          selection.sourceKey,
        );
      }
      if (!boundReferenceId) {
        return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
      }
      const boundSource = await this.evidence.getAuthorizedSources(runtime, stage4.run.id, [
        boundReferenceId,
      ]);
      if (boundSource.kind === "ACCESS_CHANGED") {
        return Object.freeze({ kind: "ACCESS_CHANGED", requestId: runtime.requestId });
      }
      if (
        boundSource.kind !== "COMPLETE" ||
        boundSource.sources.length !== 1 ||
        !boundSource.sources[0]?.conflictKeys.includes(selection.conflictKey)
      ) {
        return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
      }
      const conflict = await this.evidence.getAuthorizedConflict(
        runtime,
        stage4.run.id,
        selection.conflictKey,
      );
      if (!conflict) return Object.freeze({ kind: "UNAVAILABLE", requestId: runtime.requestId });
      const sourceViews = Object.freeze(
        conflict.sources.map((source) =>
          sourceView(source, selection, stage4, locale, copy, catalog),
        ),
      );
      const backSelection: EvidencePanelSelection | undefined =
        selection.claimKey && selection.enrichmentRunId
          ? Object.freeze({
              mode: "CLAIM" as const,
              comparisonRunId: selection.comparisonRunId,
              enrichmentRunId: selection.enrichmentRunId,
              claimKey: selection.claimKey,
            })
          : selection.candidateProjectKey && selection.factorKey
            ? Object.freeze({
                mode: "FACTOR" as const,
                comparisonRunId: selection.comparisonRunId,
                candidateProjectKey: selection.candidateProjectKey,
                factorKey: selection.factorKey,
              })
            : undefined;
      const view: EvidencePanelView = Object.freeze({
        catalog,
        version: EVIDENCE_PANEL_VERSION,
        locale,
        mode: "CONFLICT",
        context: context(stage4, null, locale, freshness),
        heading: headingFor("CONFLICT", copy.conflicts, copy),
        sources: sourceViews,
        conflict: Object.freeze({
          conflictKey: conflict.conflictKey,
          statusLabel: copy.conflictStatusLabels[conflict.status],
          impactLabel: conflictImpact(conflict, locale),
          records: sourceViews,
        }),
        notices: Object.freeze([
          Object.freeze({ tone: "CRITICAL" as const, text: conflictImpact(conflict, locale) }),
        ]),
        ...(backSelection ? { backSelection } : {}),
      });
      return Object.freeze({ kind: "READY", view });
    } catch {
      return Object.freeze({ kind: "FAILED", requestId: runtime.requestId });
    }
  }
}
