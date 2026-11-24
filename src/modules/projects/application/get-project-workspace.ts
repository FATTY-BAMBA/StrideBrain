import { areaInFirmUnit, areaUnitLabel } from "@/modules/firm-lists/domain/area-unit";
import { categoryLabel } from "@/modules/localization/jobs";
import { projectSubtypeLabel } from "@/modules/localization/project-context";
import {
  AuthorizationService,
  type AuthorizationDecision,
} from "@/modules/authorization/authorization-service";
import {
  determineProjectWorkspaceState,
  type CommercialObservationDTO,
  type EvidenceHealthDTO,
  type LocalizedNameDTO,
  type ObservationType,
  type ProjectWorkspaceDTO,
  type ProjectWorkspaceOutcome,
  type ProjectWorkspacePermissionDTO,
  type ProjectWorkspaceWarningCode,
  type SupplierOfferSummaryDTO,
} from "@/modules/projects/domain/project-workspace";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectRepositoryPort } from "@/repositories/ports/project-repository";
import type {
  CurrentActualRecord,
  CurrentForecastRecord,
  CurrentQuoteRecord,
  ProjectEvidenceConflictRecord,
  ProjectActionRecord,
  ProjectEvidenceRecord,
  ProjectSupplierOfferRecord,
  ProjectWorkspaceRepositoryPort,
} from "@/repositories/ports/project-workspace-repository";

const DAY_MS = 86_400_000;
const STALE_SUPPLIER_OFFER_DAYS = 90;

function isoDate(value: Date | null | undefined): string | undefined {
  return value?.toISOString().slice(0, 10);
}

function localized(context: RuntimeContext, en: string, zhTw: string): LocalizedNameDTO {
  return Object.freeze({
    en,
    zhTw,
    display: context.locale === "zh-TW" ? zhTw : en,
  });
}

function restrictedObservation(
  observationType: ObservationType,
  warningCode: ProjectWorkspaceWarningCode,
): CommercialObservationDTO {
  return Object.freeze({
    state: "RESTRICTED",
    observationType,
    warningCodes: Object.freeze([warningCode]),
  });
}

function unavailableObservation(
  observationType: ObservationType,
  warningCode: ProjectWorkspaceWarningCode,
): CommercialObservationDTO {
  return Object.freeze({
    state: "UNAVAILABLE",
    observationType,
    warningCodes: Object.freeze([warningCode]),
  });
}

function conflictedObservation(
  recordKey: string,
  versionNumber: number,
  observationType: ObservationType,
): CommercialObservationDTO {
  return Object.freeze({
    state: "CONFLICTED",
    recordKey,
    versionNumber,
    observationType,
    authorityState: "CONFLICTED",
    warningCodes: Object.freeze(["EVIDENCE_CONFLICT"] as const),
  });
}

function quoteObservation(record: CurrentQuoteRecord, now: Date): CommercialObservationDTO {
  const recordKey = `${record.quoteBusinessKey}-v${record.versionNumber}`;
  if (record.authorityState === "CONFLICTED") {
    return conflictedObservation(recordKey, record.versionNumber, record.observationType);
  }
  const stale = record.validUntil !== null && record.validUntil.getTime() < now.getTime();
  return Object.freeze({
    state: "VALUE",
    recordKey,
    versionNumber: record.versionNumber,
    observationType: record.observationType,
    authorityState: record.authorityState,
    money: Object.freeze({ amount: record.amountBeforeTax, currency: record.currency }),
    effectiveAt: isoDate(record.approvedAt),
    validUntil: isoDate(record.validUntil),
    freshness: stale ? "STALE" : "CURRENT",
    warningCodes: Object.freeze<ProjectWorkspaceWarningCode[]>(stale ? ["EVIDENCE_STALE"] : []),
  });
}

function forecastObservation(record: CurrentForecastRecord): CommercialObservationDTO {
  const recordKey = `FORECAST-v${record.versionNumber}`;
  if (record.authorityState === "CONFLICTED") {
    return conflictedObservation(recordKey, record.versionNumber, record.observationType);
  }
  return Object.freeze({
    state: "VALUE",
    recordKey,
    versionNumber: record.versionNumber,
    observationType: record.observationType,
    authorityState: record.authorityState,
    money: Object.freeze({ amount: record.totalDirectCost, currency: record.currency }),
    effectiveAt: isoDate(record.effectiveAt),
    freshness: "CURRENT",
    warningCodes: Object.freeze([]),
  });
}

function actualObservation(record: CurrentActualRecord): CommercialObservationDTO {
  const recordKey = `ACTUAL-v${record.versionNumber}`;
  if (record.authorityState === "CONFLICTED") {
    return conflictedObservation(recordKey, record.versionNumber, record.observationType);
  }
  return Object.freeze({
    state: "VALUE",
    recordKey,
    versionNumber: record.versionNumber,
    observationType: record.observationType,
    authorityState: record.authorityState,
    money: Object.freeze({ amount: record.totalDirectCost, currency: record.currency }),
    effectiveAt: isoDate(record.reconciledAt),
    freshness: "HISTORICAL",
    warningCodes: Object.freeze([]),
  });
}

function supplierOfferFreshness(
  offer: ProjectSupplierOfferRecord,
  now: Date,
): "CURRENT" | "HISTORICAL" | "STALE" {
  if (offer.validUntil && offer.validUntil.getTime() < now.getTime()) return "STALE";
  if (
    !offer.validUntil &&
    now.getTime() - offer.offeredAt.getTime() > STALE_SUPPLIER_OFFER_DAYS * DAY_MS
  ) {
    return "STALE";
  }
  return offer.offeredAt.getTime() <= now.getTime() ? "CURRENT" : "HISTORICAL";
}

function supplierOfferDTO(
  context: RuntimeContext,
  offer: ProjectSupplierOfferRecord,
  now: Date,
): SupplierOfferSummaryDTO {
  return Object.freeze({
    recordKey: offer.businessKey,
    supplier: localized(context, offer.supplier.nameEn, offer.supplier.nameZhTw),
    authorityState: offer.authorityState,
    offeredAt: isoDate(offer.offeredAt)!,
    validUntil: isoDate(offer.validUntil),
    freshness: supplierOfferFreshness(offer, now),
    money: Object.freeze({ amount: offer.amountBeforeTax, currency: offer.currency }),
  });
}

function conflictEvidenceIds(
  conflicts: readonly ProjectEvidenceConflictRecord[],
): ReadonlySet<string> {
  return new Set(
    conflicts.flatMap((conflict) => [conflict.primaryEvidenceId, conflict.conflictingEvidenceId]),
  );
}

function evidenceCondition(
  evidence: ProjectEvidenceRecord,
  conflicts: ReadonlySet<string>,
  now: Date,
): "CURRENT" | "STALE" | "CONFLICTED" {
  if (conflicts.has(evidence.evidenceReferenceId)) return "CONFLICTED";
  if (evidence.staleAt && evidence.staleAt.getTime() <= now.getTime()) return "STALE";
  return "CURRENT";
}

function evidenceHealth(
  canReadEvidence: boolean,
  evidence: readonly ProjectEvidenceRecord[],
  conflicts: readonly ProjectEvidenceConflictRecord[],
  now: Date,
): EvidenceHealthDTO {
  if (!canReadEvidence) {
    return Object.freeze({
      state: "RESTRICTED",
      labelKey: "project.evidence.restricted",
    });
  }
  const staleCount = evidence.filter(
    (item) => item.staleAt && item.staleAt.getTime() <= now.getTime(),
  ).length;
  const documentKeys = new Set(
    evidence.map((item) => item.document?.businessKey).filter((value): value is string => !!value),
  );
  if (conflicts.length > 0) {
    return Object.freeze({
      state: "CONFLICTED",
      accessibleReferenceCount: evidence.length,
      accessibleDocumentCount: documentKeys.size,
      staleCount,
      openConflictCount: conflicts.length,
      labelKey: "project.evidence.conflicted",
    });
  }
  if (evidence.length === 0) {
    return Object.freeze({
      state: "INSUFFICIENT",
      accessibleReferenceCount: 0,
      accessibleDocumentCount: 0,
      staleCount: 0,
      openConflictCount: 0,
      labelKey: "project.evidence.insufficient",
    });
  }
  if (staleCount > 0) {
    return Object.freeze({
      state: "PARTIAL",
      accessibleReferenceCount: evidence.length,
      accessibleDocumentCount: documentKeys.size,
      staleCount,
      openConflictCount: 0,
      labelKey: "project.evidence.partial",
    });
  }
  return Object.freeze({
    state: "GOOD",
    accessibleReferenceCount: evidence.length,
    accessibleDocumentCount: documentKeys.size,
    staleCount: 0,
    openConflictCount: 0,
    labelKey: "project.evidence.good",
  });
}

function permissions(
  context: RuntimeContext,
  projectId: string,
  authorization: AuthorizationService,
): ProjectWorkspacePermissionDTO {
  return Object.freeze({
    role: context.role,
    canRunComparison: authorization.canRunComparison(context, projectId).allowed,
    canReadQuote: authorization.canReadCommercial(context, projectId, "QUOTE").allowed,
    canReadForecast: authorization.canReadCommercial(context, projectId, "FORECAST").allowed,
    canReadActual: authorization.canReadCommercial(context, projectId, "ACTUAL").allowed,
    canReadEvidence: authorization.canReadEvidence(context, projectId).allowed,
    canProposeInternalReview: authorization.canProposeInternalReview(context, projectId).allowed,
    canCreateInternalReview: authorization.canCreateInternalReview(context, projectId).allowed,
    canAssignInternalReview: authorization.canAssignInternalReview(context, projectId).allowed,
  });
}

function allowed(decision: AuthorizationDecision): boolean {
  return decision.allowed;
}

export class GetProjectWorkspace {
  constructor(
    private readonly projects: ProjectRepositoryPort,
    private readonly workspace: ProjectWorkspaceRepositoryPort,
    private readonly authorization = new AuthorizationService(),
    private readonly clock: () => Date = () => new Date(),
    private readonly authorizedActions?: Readonly<{
      list(context: RuntimeContext, projectKey: string): Promise<readonly ProjectActionRecord[]>;
    }>,
  ) {}

  async execute(context: RuntimeContext, projectKey: string): Promise<ProjectWorkspaceOutcome> {
    const lists = context.firmLists;
    if (!lists)
      return {
        kind: "UNAVAILABLE",
        errorCode: "PROJECT_UNAVAILABLE",
        requestId: context.requestId,
      };
    const authorizedProject = await this.projects.getAuthorizedByBusinessKey(context, projectKey);
    if (!authorizedProject) {
      return Object.freeze({
        kind: "UNAVAILABLE",
        errorCode: "PROJECT_UNAVAILABLE",
        requestId: context.requestId,
      });
    }

    const projectAccess = this.authorization.canReadProject(context, authorizedProject.id);
    if (!projectAccess.allowed || authorizedProject.organizationId !== context.organizationId) {
      return Object.freeze({
        kind: "UNAVAILABLE",
        errorCode: "PROJECT_UNAVAILABLE",
        requestId: context.requestId,
      });
    }

    const base = await this.workspace.getProjectContext(
      context.organizationId,
      authorizedProject.id,
    );
    if (!base || base.organizationId !== context.organizationId) {
      return Object.freeze({
        kind: "UNAVAILABLE",
        errorCode: "PROJECT_UNAVAILABLE",
        requestId: context.requestId,
      });
    }

    const quoteDecision = this.authorization.canReadCommercial(context, base.id, "QUOTE");
    const forecastDecision = this.authorization.canReadCommercial(context, base.id, "FORECAST");
    const actualDecision = this.authorization.canReadCommercial(context, base.id, "ACTUAL");
    const evidenceDecision = this.authorization.canReadEvidence(context, base.id);
    const projectPermissions = permissions(context, base.id, this.authorization);

    const [quote, forecast, actual, evidence, offers, actions] = await Promise.all([
      allowed(quoteDecision)
        ? this.workspace.getCurrentQuote(context.organizationId, base.id)
        : Promise.resolve(null),
      allowed(forecastDecision)
        ? this.workspace.getCurrentForecast(context.organizationId, base.id)
        : Promise.resolve(null),
      allowed(actualDecision)
        ? this.workspace.getCurrentActual(context.organizationId, base.id)
        : Promise.resolve(null),
      allowed(evidenceDecision)
        ? this.workspace.listEvidence(
            context.organizationId,
            base.id,
            projectAccess.evidenceScope === "AUTHORIZED" ? "AUTHORIZED" : "NON_SENSITIVE",
          )
        : Promise.resolve([]),
      allowed(forecastDecision)
        ? this.workspace.listSupplierOffers(context.organizationId, base.id)
        : Promise.resolve([]),
      this.authorizedActions
        ? this.authorizedActions.list(context, projectKey)
        : Promise.resolve([]),
    ]);

    const evidenceIds = evidence.map((item) => item.evidenceReferenceId);
    const conflicts =
      evidenceIds.length > 0
        ? await this.workspace.listOpenEvidenceConflicts(context.organizationId, evidenceIds)
        : [];
    const now = this.clock();
    const conflictIds = conflictEvidenceIds(conflicts);
    const offerDTOs = offers.map((offer) => supplierOfferDTO(context, offer, now));

    const activeQuote = allowed(quoteDecision)
      ? quote
        ? quoteObservation(quote, now)
        : unavailableObservation("QUOTED_PRICE", "QUOTE_UNAVAILABLE")
      : restrictedObservation("QUOTED_PRICE", "QUOTE_RESTRICTED");
    const activeForecast = allowed(forecastDecision)
      ? forecast
        ? forecastObservation(forecast)
        : unavailableObservation("FORECAST_DIRECT_COST", "FORECAST_UNAVAILABLE")
      : restrictedObservation("FORECAST_DIRECT_COST", "FORECAST_RESTRICTED");
    const reconciledActual = allowed(actualDecision)
      ? actual
        ? actualObservation(actual)
        : unavailableObservation("RECONCILED_ACTUAL_COST", "ACTUAL_UNAVAILABLE")
      : restrictedObservation("RECONCILED_ACTUAL_COST", "ACTUAL_RESTRICTED");

    const health = evidenceHealth(allowed(evidenceDecision), evidence, conflicts, now);
    const warnings = new Set<ProjectWorkspaceWarningCode>();
    if (!base.manager) warnings.add("PROJECT_MANAGER_UNRECORDED");
    if (base.scopes.length === 0) warnings.add("PROJECT_CONTEXT_PARTIAL");
    for (const warning of activeQuote.warningCodes) warnings.add(warning);
    for (const warning of activeForecast.warningCodes) warnings.add(warning);
    for (const warning of reconciledActual.warningCodes) warnings.add(warning);
    if (!allowed(evidenceDecision)) warnings.add("EVIDENCE_RESTRICTED");
    if (health.state === "PARTIAL" || health.state === "INSUFFICIENT") {
      warnings.add("EVIDENCE_PARTIAL");
    }
    if (health.state === "CONFLICTED") warnings.add("EVIDENCE_CONFLICT");
    if ((health.staleCount ?? 0) > 0) warnings.add("EVIDENCE_STALE");
    if (offerDTOs.some((offer) => offer.freshness === "STALE")) {
      warnings.add("SUPPLIER_OFFER_STALE");
    }

    const hasConflict =
      conflicts.length > 0 ||
      activeQuote.state === "CONFLICTED" ||
      activeForecast.state === "CONFLICTED" ||
      reconciledActual.state === "CONFLICTED";
    const hasStaleEvidence =
      (health.staleCount ?? 0) > 0 ||
      offerDTOs.some((offer) => offer.freshness === "STALE") ||
      (activeQuote.state === "VALUE" && activeQuote.freshness === "STALE");
    const hasPartialData =
      !base.manager ||
      base.scopes.length === 0 ||
      (allowed(quoteDecision) && base.stage === "QUOTE_REVIEW" && quote === null) ||
      (allowed(forecastDecision) && base.stage === "QUOTE_REVIEW" && forecast === null) ||
      (allowed(evidenceDecision) && evidence.length === 0);
    const hasRestrictedSections =
      !allowed(quoteDecision) ||
      !allowed(forecastDecision) ||
      !allowed(actualDecision) ||
      !allowed(evidenceDecision) ||
      !projectPermissions.canProposeInternalReview;

    const workspace: ProjectWorkspaceDTO = Object.freeze({
      version: "project-workspace.v1",
      state: determineProjectWorkspaceState({
        hasConflict,
        hasStaleEvidence,
        hasPartialData,
        hasRestrictedSections,
      }),
      warnings: Object.freeze([...warnings]),
      dataMode: context.dataMode,
      project: Object.freeze({
        id: base.businessKey,
        businessKey: base.businessKey,
        name: localized(context, base.nameEn, base.nameZhTw),
        clientName: localized(context, base.client.nameEn, base.client.nameZhTw),
        status: base.status,
        stage: base.stage,
        comparisonClass: base.comparisonClass,
        subtype: base.subtype,
        subtypeName:
          projectSubtypeLabel(context.locale, base.subtype, lists.jobTypes) ?? base.subtype,
        location: Object.freeze({
          country: "TW",
          city: base.locationCity,
          district: base.locationDistrict ?? undefined,
          display: [base.locationCity, base.locationDistrict].filter(Boolean).join(", "),
        }),
        area: Object.freeze({
          value: base.areaQuantity,
          unit: base.areaUnit,
          displayValue: areaInFirmUnit(base.areaQuantity, lists.areaDisplayUnit),
          displayUnit: areaUnitLabel(lists.areaDisplayUnit),
        }),
        programmeWeeks: base.programmeWeeks ?? undefined,
        targetHandover: isoDate(base.targetCompletionAt),
        manager: base.manager
          ? localized(context, base.manager.nameEn, base.manager.nameZhTw)
          : undefined,
        scopeCategories: Object.freeze(
          base.scopes.map((scope) =>
            Object.freeze({
              categoryId: scope.categoryId,
              name: localized(
                context,
                categoryLabel("en", scope.categoryId, lists.workCategories),
                categoryLabel("zh-TW", scope.categoryId, lists.workCategories),
              ),
              authorityState: scope.authorityState,
            }),
          ),
        ),
        demoData: context.dataMode === "DEMO_SYNTHETIC",
        dataClassification: base.dataClassification,
      }),
      commercial: Object.freeze({
        activeQuote,
        activeForecast,
        reconciledActual,
        supplierOffers: Object.freeze(offerDTOs),
      }),
      evidenceHealth: health,
      evidence: Object.freeze(
        evidence.map((item) =>
          Object.freeze({
            referenceKey: item.evidenceReferenceId,
            claimKey: item.claimKey,
            sourceType: item.document?.documentType ?? item.subjectType,
            sourceKey: item.document?.businessKey,
            sourceVersion: item.document?.versionLabel,
            sourceName: item.document
              ? localized(context, item.document.titleEn, item.document.titleZhTw)
              : undefined,
            authorityState: item.authorityState,
            observationType: item.observationType ?? undefined,
            effectiveAt: isoDate(item.effectiveAt),
            staleAt: isoDate(item.staleAt),
            condition: evidenceCondition(item, conflictIds, now),
          }),
        ),
      ),
      suppliers: Object.freeze(
        base.suppliers.map((supplier) =>
          Object.freeze({
            businessKey: supplier.businessKey,
            name: localized(context, supplier.nameEn, supplier.nameZhTw),
            categoryId: supplier.categoryId,
            relationship: supplier.relationship,
          }),
        ),
      ),
      materials: Object.freeze(
        base.materials.map((material) =>
          Object.freeze({
            businessKey: material.businessKey,
            name: localized(context, material.nameEn, material.nameZhTw),
            categoryId: material.categoryId,
            relationship: material.relationship,
          }),
        ),
      ),
      openActions: Object.freeze(
        actions.map((action) =>
          Object.freeze({
            actionKey: action.id,
            title: action.title,
            status: action.status,
            dueDate: isoDate(action.dueDate),
          }),
        ),
      ),
      permissions: projectPermissions,
      suggestedQuestions: Object.freeze([
        Object.freeze({
          id: "comparable-projects",
          labelKey: "project.question.comparableProjects",
          promptEn: "Have we done something like this before?",
          promptZhTw: "我們以前做過類似的案子嗎？",
        }),
        Object.freeze({
          id: "compare-quote",
          labelKey: "project.question.compareQuote",
          promptEn: "Compare the current quote with relevant completed projects.",
          promptZhTw: "把目前報價和相關已完工專案比較一下。",
        }),
        Object.freeze({
          id: "evidence-source",
          labelKey: "project.question.evidenceSource",
          promptEn: "Where did these numbers come from?",
          promptZhTw: "這些數字是從哪裡來的？",
        }),
      ]),
    });

    return Object.freeze({ kind: "AVAILABLE", workspace });
  }
}
