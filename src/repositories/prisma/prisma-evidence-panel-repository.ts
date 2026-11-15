import {
  AuthorizationService,
  type CommercialKind,
} from "@/modules/authorization/authorization-service";
import type { SimilarityFactorKey } from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  AuthorizedEvidenceSourcesResult,
  EvidenceConflictRecord,
  EvidenceFactorRecord,
  EvidencePanelRepositoryPort,
  EvidenceSourceRecord,
} from "@/repositories/ports/evidence-panel-repository";

const FACTOR_KEYS = new Set<SimilarityFactorKey>([
  "SUBTYPE",
  "SCOPE_OVERLAP",
  "AREA_SIMILARITY",
  "COMMERCIAL_CATEGORY_OVERLAP",
  "MATERIAL_OVERLAP",
  "SUPPLIER_OVERLAP",
  "COMPLETION_RECENCY",
  "LOCATION_PROXIMITY",
]);

type EvidenceReferenceRow = Readonly<{
  id: string;
  organizationId: string;
  subjectType: string;
  subjectId: string;
  documentVersionId: string | null;
  locator: unknown;
  claimKey: string;
  supportedValue: unknown;
  authorityState: string;
  observationType: string | null;
  dataClassification: string;
  effectiveAt: Date | null;
  staleAt: Date | null;
}>;

type ConflictRow = Readonly<{
  conflictKey: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  resolutionNote: string | null;
  primaryEvidenceId: string;
  conflictingEvidenceId: string;
}>;

type FactorRow = Readonly<{
  factorKey: string;
  state: "KNOWN" | "UNKNOWN" | "NOT_APPLICABLE";
  weight: unknown;
  normalizedValue: unknown | null;
  contribution: unknown | null;
  explanation: unknown;
  evidenceReferenceIds: string[];
  comparisonCandidate: Readonly<{
    score: unknown;
    evidenceCoverage: unknown;
    candidateProject: Readonly<{
      id: string;
      businessKey: string;
      nameEn: string;
      nameZhTw: string;
    }>;
    comparisonRun: Readonly<{
      id: string;
      activeProjectId: string;
    }>;
  }>;
}>;

type GenericSubjectRow = Readonly<Record<string, unknown>>;

type ModelReader = { findMany(args: unknown): Promise<GenericSubjectRow[]> };

export type PrismaEvidencePanelDatabase = Readonly<{
  evidenceReference: {
    findMany(args: unknown): Promise<EvidenceReferenceRow[]>;
  };
  evidenceConflict: {
    findMany(args: unknown): Promise<ConflictRow[]>;
  };
  comparisonFactor: {
    findFirst(args: unknown): Promise<FactorRow | null>;
  };
  comparisonRun: {
    findFirst(args: unknown): Promise<Readonly<{ id: string; activeProjectId: string }> | null>;
  };
  project: ModelReader;
  projectScope: ModelReader;
  documentVersion: ModelReader;
  quoteVersion: ModelReader;
  quoteItem: ModelReader;
  forecastCostVersion: ModelReader;
  forecastCostLine: ModelReader;
  projectCostVersion: ModelReader;
  costLine: ModelReader;
  supplierOffer: ModelReader;
  supplierOfferItem: ModelReader;
}>;

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numeric(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && "toString" in value) {
    const rendered = String(value);
    return rendered === "[object Object]" ? undefined : rendered;
  }
  return undefined;
}

function isoDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  const valueText = text(value);
  return valueText;
}

function jsonObject(value: unknown): Readonly<Record<string, unknown>> {
  return Object.freeze({ ...object(value) });
}

function modelProject(row: Record<string, unknown>): Record<string, unknown> {
  if (text(row.id) && text(row.businessKey) && text(row.nameEn) && text(row.nameZhTw)) {
    return row;
  }
  const direct = object(row.project);
  if (text(direct.id)) return direct;
  const document = object(row.document);
  const documentProject = object(document.project);
  if (text(documentProject.id)) return documentProject;
  const quote = object(row.quote);
  const quoteProject = object(quote.project);
  if (text(quoteProject.id)) return quoteProject;
  const quoteVersion = object(row.quoteVersion);
  const itemQuote = object(quoteVersion.quote);
  const itemQuoteProject = object(itemQuote.project);
  if (text(itemQuoteProject.id)) return itemQuoteProject;
  const forecast = object(row.forecastCostVersion);
  const forecastProject = object(forecast.project);
  if (text(forecastProject.id)) return forecastProject;
  const cost = object(row.projectCostVersion);
  const costProject = object(cost.project);
  if (text(costProject.id)) return costProject;
  const offer = object(row.supplierOffer);
  const offerProject = object(offer.project);
  if (text(offerProject.id)) return offerProject;
  return {};
}

function projectIdentity(row: Record<string, unknown>): Readonly<{
  id: string;
  key: string;
  nameEn: string;
  nameZhTw: string;
}> | null {
  const project = modelProject(row);
  const id = text(project.id);
  const key = text(project.businessKey);
  const nameEn = text(project.nameEn);
  const nameZhTw = text(project.nameZhTw);
  return id && key && nameEn && nameZhTw ? { id, key, nameEn, nameZhTw } : null;
}

function subjectId(row: Record<string, unknown>): string | undefined {
  return text(row.id);
}

function version(row: Record<string, unknown>): string | undefined {
  const versionLabel = text(row.versionLabel);
  if (versionLabel) return versionLabel;
  const versionNumber = numeric(row.versionNumber);
  return versionNumber ? `v${versionNumber}` : undefined;
}

function titleFor(
  subjectType: string,
  row: Record<string, unknown>,
): Readonly<{
  en: string;
  zhTw: string;
}> {
  const project = projectIdentity(row);
  const descriptionEn = text(row.descriptionEn) ?? text(row.labelEn);
  const descriptionZhTw = text(row.descriptionZhTw) ?? text(row.labelZhTw);
  if (descriptionEn && descriptionZhTw) return { en: descriptionEn, zhTw: descriptionZhTw };
  const document = object(row.document);
  const documentTitleEn = text(document.titleEn);
  const documentTitleZhTw = text(document.titleZhTw);
  if (documentTitleEn && documentTitleZhTw) {
    return { en: documentTitleEn, zhTw: documentTitleZhTw };
  }
  const businessKey = text(row.businessKey) ?? text(object(row.quote).businessKey);
  const baseEn = project?.nameEn ?? "Authorized evidence source";
  const baseZh = project?.nameZhTw ?? "已授權資料來源";
  return {
    en: businessKey ? `${baseEn} · ${businessKey}` : `${baseEn} · ${subjectType}`,
    zhTw: businessKey ? `${baseZh} · ${businessKey}` : `${baseZh} · ${subjectType}`,
  };
}

function previewFields(
  subjectType: string,
  row: Record<string, unknown>,
): readonly Readonly<{
  key: string;
  value: string;
}>[] {
  const result: Array<Readonly<{ key: string; value: string }>> = [];
  const add = (key: string, value: unknown) => {
    const rendered = numeric(value) ?? text(value);
    if (rendered) result.push(Object.freeze({ key, value: rendered }));
  };
  add("category", row.categoryId);
  add("line", row.lineNumber);
  add("descriptionEn", row.descriptionEn);
  add("descriptionZhTw", row.descriptionZhTw);
  add("quantity", row.quantity);
  add("unit", row.unit);
  add("unitPrice", row.unitPrice ?? row.unitCost);
  add("amount", row.amount ?? row.amountBeforeTax ?? row.totalDirectCost ?? row.totalAmount);
  add("currency", row.currency);
  add("status", row.status);
  add("validUntil", isoDate(row.validUntil));
  add("effectiveAt", isoDate(row.effectiveAt ?? row.reconciledAt ?? row.offeredAt));
  add("mimeType", row.mimeType);
  if (subjectType === "PROJECT") {
    add("subtype", row.subtype);
    add("area", row.areaQuantity);
    add("areaUnit", row.areaUnit);
    add("programmeWeeks", row.programmeWeeks);
  }
  return Object.freeze(result);
}

function commercialKind(subjectType: string): CommercialKind | null {
  if (subjectType === "QUOTE_VERSION" || subjectType === "QUOTE_ITEM") return "QUOTE";
  if (subjectType === "FORECAST_COST_VERSION" || subjectType === "FORECAST_COST_LINE") {
    return "FORECAST";
  }
  if (subjectType === "PROJECT_COST_VERSION" || subjectType === "COST_LINE") return "ACTUAL";
  if (subjectType === "SUPPLIER_OFFER" || subjectType === "SUPPLIER_OFFER_ITEM") {
    return "SUPPLIER_OFFER";
  }
  return null;
}

function subjectModel(
  database: PrismaEvidencePanelDatabase,
  subjectType: string,
): ModelReader | null {
  if (subjectType === "PROJECT") return database.project;
  if (subjectType === "PROJECT_SCOPE") return database.projectScope;
  if (subjectType === "DOCUMENT_VERSION") return database.documentVersion;
  if (subjectType === "QUOTE_VERSION") return database.quoteVersion;
  if (subjectType === "QUOTE_ITEM") return database.quoteItem;
  if (subjectType === "FORECAST_COST_VERSION") return database.forecastCostVersion;
  if (subjectType === "FORECAST_COST_LINE") return database.forecastCostLine;
  if (subjectType === "PROJECT_COST_VERSION") return database.projectCostVersion;
  if (subjectType === "COST_LINE") return database.costLine;
  if (subjectType === "SUPPLIER_OFFER") return database.supplierOffer;
  if (subjectType === "SUPPLIER_OFFER_ITEM") return database.supplierOfferItem;
  return null;
}

function subjectOwnershipSelect(subjectType: string): Readonly<Record<string, unknown>> {
  const project = { select: { id: true, businessKey: true, nameEn: true, nameZhTw: true } };
  if (subjectType === "PROJECT") {
    return { id: true, businessKey: true, nameEn: true, nameZhTw: true };
  }
  if (subjectType === "PROJECT_SCOPE") return { id: true, project };
  if (subjectType === "DOCUMENT_VERSION") {
    return { id: true, document: { select: { project } } };
  }
  if (subjectType === "QUOTE_VERSION") {
    return { id: true, quote: { select: { project } } };
  }
  if (subjectType === "QUOTE_ITEM") {
    return { id: true, quoteVersion: { select: { quote: { select: { project } } } } };
  }
  if (subjectType === "FORECAST_COST_VERSION") return { id: true, project };
  if (subjectType === "FORECAST_COST_LINE") {
    return { id: true, forecastCostVersion: { select: { project } } };
  }
  if (subjectType === "PROJECT_COST_VERSION") return { id: true, project };
  if (subjectType === "COST_LINE") {
    return { id: true, projectCostVersion: { select: { project } } };
  }
  if (subjectType === "SUPPLIER_OFFER") return { id: true, project };
  if (subjectType === "SUPPLIER_OFFER_ITEM") {
    return { id: true, supplierOffer: { select: { project } } };
  }
  return { id: true };
}

function subjectSelect(subjectType: string): Readonly<Record<string, unknown>> {
  const project = { select: { id: true, businessKey: true, nameEn: true, nameZhTw: true } };
  if (subjectType === "PROJECT") {
    return {
      id: true,
      businessKey: true,
      nameEn: true,
      nameZhTw: true,
      subtype: true,
      areaQuantity: true,
      areaUnit: true,
      programmeWeeks: true,
      status: true,
    };
  }
  if (subjectType === "PROJECT_SCOPE") {
    return { id: true, categoryId: true, labelEn: true, labelZhTw: true, project };
  }
  if (subjectType === "DOCUMENT_VERSION") {
    return {
      id: true,
      versionLabel: true,
      authorityState: true,
      effectiveAt: true,
      supersededBy: { select: { versionLabel: true } },
      mimeType: true,
      metadata: true,
      document: {
        select: {
          businessKey: true,
          titleEn: true,
          titleZhTw: true,
          documentType: true,
          project,
        },
      },
    };
  }
  if (subjectType === "QUOTE_VERSION") {
    return {
      id: true,
      versionNumber: true,
      status: true,
      currency: true,
      amountBeforeTax: true,
      totalAmount: true,
      validUntil: true,
      approvedAt: true,
      supersededBy: { select: { versionNumber: true } },
      quote: { select: { businessKey: true, project } },
    };
  }
  if (subjectType === "QUOTE_ITEM") {
    return {
      id: true,
      lineNumber: true,
      categoryId: true,
      descriptionEn: true,
      descriptionZhTw: true,
      quantity: true,
      unit: true,
      unitPrice: true,
      amount: true,
      quoteVersion: {
        select: {
          versionNumber: true,
          currency: true,
          approvedAt: true,
          quote: { select: { businessKey: true, project } },
        },
      },
    };
  }
  if (subjectType === "FORECAST_COST_VERSION") {
    return {
      id: true,
      versionNumber: true,
      currency: true,
      totalDirectCost: true,
      effectiveAt: true,
      supersededBy: { select: { versionNumber: true } },
      project,
    };
  }
  if (subjectType === "FORECAST_COST_LINE") {
    return {
      id: true,
      lineNumber: true,
      categoryId: true,
      descriptionEn: true,
      descriptionZhTw: true,
      quantity: true,
      unit: true,
      unitCost: true,
      amount: true,
      forecastCostVersion: {
        select: { versionNumber: true, currency: true, effectiveAt: true, project },
      },
    };
  }
  if (subjectType === "PROJECT_COST_VERSION") {
    return {
      id: true,
      versionNumber: true,
      currency: true,
      totalDirectCost: true,
      reconciledAt: true,
      supersededBy: { select: { versionNumber: true } },
      project,
    };
  }
  if (subjectType === "COST_LINE") {
    return {
      id: true,
      lineNumber: true,
      categoryId: true,
      descriptionEn: true,
      descriptionZhTw: true,
      quantity: true,
      unit: true,
      unitCost: true,
      amount: true,
      projectCostVersion: {
        select: { versionNumber: true, currency: true, reconciledAt: true, project },
      },
    };
  }
  if (subjectType === "SUPPLIER_OFFER") {
    return {
      id: true,
      businessKey: true,
      currency: true,
      amountBeforeTax: true,
      offeredAt: true,
      validUntil: true,
      project,
    };
  }
  if (subjectType === "SUPPLIER_OFFER_ITEM") {
    return {
      id: true,
      lineNumber: true,
      categoryId: true,
      descriptionEn: true,
      descriptionZhTw: true,
      quantity: true,
      unit: true,
      unitPrice: true,
      amount: true,
      supplierOffer: {
        select: { businessKey: true, currency: true, offeredAt: true, validUntil: true, project },
      },
    };
  }
  return { id: true };
}

function nestedValue(row: Record<string, unknown>, keys: readonly string[]): unknown {
  let current: unknown = row;
  for (const key of keys) current = object(current)[key];
  return current;
}

function effectiveFromSubject(
  subjectType: string,
  row: Record<string, unknown>,
): string | undefined {
  if (subjectType === "QUOTE_ITEM")
    return isoDate(nestedValue(row, ["quoteVersion", "approvedAt"]));
  if (subjectType === "FORECAST_COST_LINE") {
    return isoDate(nestedValue(row, ["forecastCostVersion", "effectiveAt"]));
  }
  if (subjectType === "COST_LINE") {
    return isoDate(nestedValue(row, ["projectCostVersion", "reconciledAt"]));
  }
  if (subjectType === "SUPPLIER_OFFER_ITEM") {
    return isoDate(nestedValue(row, ["supplierOffer", "offeredAt"]));
  }
  return isoDate(row.effectiveAt ?? row.reconciledAt ?? row.offeredAt ?? row.approvedAt);
}

function versionFromSubject(subjectType: string, row: Record<string, unknown>): string | undefined {
  if (subjectType === "QUOTE_ITEM") return version(object(row.quoteVersion));
  if (subjectType === "FORECAST_COST_LINE") return version(object(row.forecastCostVersion));
  if (subjectType === "COST_LINE") return version(object(row.projectCostVersion));
  if (subjectType === "SUPPLIER_OFFER_ITEM") return text(object(row.supplierOffer).businessKey);
  return version(row) ?? text(row.businessKey);
}

function supersededLabel(row: Record<string, unknown>): string | undefined {
  const successor = object(row.supersededBy);
  return version(successor) ?? text(successor.businessKey);
}

function dateString(value: Date | null): string | undefined {
  return value ? value.toISOString() : undefined;
}

export class PrismaEvidencePanelRepository implements EvidencePanelRepositoryPort {
  constructor(
    private readonly database: PrismaEvidencePanelDatabase,
    private readonly authorization = new AuthorizationService(),
  ) {}

  async getAuthorizedSources(
    context: RuntimeContext,
    comparisonRunId: string,
    referenceIds: readonly string[],
  ): Promise<AuthorizedEvidenceSourcesResult> {
    const requested = [...new Set(referenceIds)];
    if (requested.length === 0)
      return Object.freeze({ kind: "COMPLETE", sources: Object.freeze([]) });
    if (!context.capabilities.has("evidence:read"))
      return Object.freeze({ kind: "ACCESS_CHANGED" });

    const run = await this.database.comparisonRun.findFirst({
      where: { id: comparisonRunId, organizationId: context.organizationId, status: "COMPLETED" },
      select: { id: true, activeProjectId: true },
    });
    if (!run || !this.authorization.canRunComparison(context, run.activeProjectId).allowed) {
      return Object.freeze({ kind: "UNAVAILABLE" });
    }

    const references = await this.database.evidenceReference.findMany({
      where: { id: { in: requested }, organizationId: context.organizationId },
      select: {
        id: true,
        organizationId: true,
        subjectType: true,
        subjectId: true,
        documentVersionId: true,
        locator: true,
        claimKey: true,
        supportedValue: true,
        authorityState: true,
        observationType: true,
        dataClassification: true,
        effectiveAt: true,
        staleAt: true,
      },
    });
    if (references.length !== requested.length) return Object.freeze({ kind: "ACCESS_CHANGED" });

    const conflicts = await this.database.evidenceConflict.findMany({
      where: {
        organizationId: context.organizationId,
        OR: [
          { primaryEvidenceId: { in: requested } },
          { conflictingEvidenceId: { in: requested } },
        ],
      },
      select: {
        conflictKey: true,
        status: true,
        resolutionNote: true,
        primaryEvidenceId: true,
        conflictingEvidenceId: true,
      },
    });
    const conflictByReference = new Map<string, string[]>();
    for (const conflict of conflicts) {
      if (conflict.status !== "OPEN") continue;
      for (const referenceId of [conflict.primaryEvidenceId, conflict.conflictingEvidenceId]) {
        const existing = conflictByReference.get(referenceId) ?? [];
        existing.push(conflict.conflictKey);
        conflictByReference.set(referenceId, existing);
      }
    }

    const grouped = new Map<string, string[]>();
    for (const reference of references) {
      const ids = grouped.get(reference.subjectType) ?? [];
      ids.push(reference.subjectId);
      grouped.set(reference.subjectType, ids);
    }

    const ownershipRows = new Map<string, GenericSubjectRow>();
    await Promise.all(
      [...grouped.entries()].map(async ([subjectType, ids]) => {
        const model = subjectModel(this.database, subjectType);
        if (!model) return;
        const rows = await model.findMany({
          where: { id: { in: [...new Set(ids)] }, organizationId: context.organizationId },
          select: subjectOwnershipSelect(subjectType),
        });
        for (const row of rows) {
          const id = subjectId(row);
          if (id) ownershipRows.set(`${subjectType}:${id}`, row);
        }
      }),
    );

    for (const reference of references) {
      const ownership = ownershipRows.get(`${reference.subjectType}:${reference.subjectId}`);
      if (!ownership) return Object.freeze({ kind: "ACCESS_CHANGED" });
      const identity = projectIdentity(ownership);
      if (!identity || !this.authorization.canReadEvidence(context, identity.id).allowed) {
        return Object.freeze({ kind: "ACCESS_CHANGED" });
      }
      const commercial = commercialKind(reference.subjectType);
      if (
        commercial &&
        !this.authorization.canReadCommercial(context, identity.id, commercial).allowed
      ) {
        return Object.freeze({ kind: "ACCESS_CHANGED" });
      }
    }

    const subjectRows = new Map<string, GenericSubjectRow>();
    await Promise.all(
      [...grouped.entries()].map(async ([subjectType, ids]) => {
        const model = subjectModel(this.database, subjectType);
        if (!model) return;
        const rows = await model.findMany({
          where: { id: { in: [...new Set(ids)] }, organizationId: context.organizationId },
          select: subjectSelect(subjectType),
        });
        for (const row of rows) {
          const id = subjectId(row);
          if (id) subjectRows.set(`${subjectType}:${id}`, row);
        }
      }),
    );

    const sources: EvidenceSourceRecord[] = [];
    for (const reference of references) {
      const row = subjectRows.get(`${reference.subjectType}:${reference.subjectId}`);
      if (!row) return Object.freeze({ kind: "ACCESS_CHANGED" });
      const identity = projectIdentity(row);
      if (!identity) return Object.freeze({ kind: "ACCESS_CHANGED" });
      const sourceTitle = titleFor(reference.subjectType, row);
      const conflictKeys = Object.freeze([...(conflictByReference.get(reference.id) ?? [])].sort());
      const successor = supersededLabel(row);
      sources.push(
        Object.freeze({
          referenceId: reference.id,
          subjectType: reference.subjectType as EvidenceSourceRecord["subjectType"],
          subjectId: reference.subjectId,
          ...(reference.documentVersionId
            ? { documentVersionId: reference.documentVersionId }
            : {}),
          claimKey: reference.claimKey,
          locator: jsonObject(reference.locator),
          ...(reference.supportedValue
            ? { supportedValue: jsonObject(reference.supportedValue) }
            : {}),
          authorityState: reference.authorityState as EvidenceSourceRecord["authorityState"],
          ...(reference.observationType
            ? {
                observationType:
                  reference.observationType as EvidenceSourceRecord["observationType"],
              }
            : {}),
          dataClassification:
            reference.dataClassification as EvidenceSourceRecord["dataClassification"],
          ...((dateString(reference.effectiveAt) ??
          effectiveFromSubject(reference.subjectType, row))
            ? {
                effectiveAt:
                  dateString(reference.effectiveAt) ??
                  effectiveFromSubject(reference.subjectType, row),
              }
            : {}),
          ...(dateString(reference.staleAt) ? { staleAt: dateString(reference.staleAt) } : {}),
          projectId: identity.id,
          projectKey: identity.key,
          projectNameEn: identity.nameEn,
          projectNameZhTw: identity.nameZhTw,
          titleEn: sourceTitle.en,
          titleZhTw: sourceTitle.zhTw,
          ...(versionFromSubject(reference.subjectType, row)
            ? { versionLabel: versionFromSubject(reference.subjectType, row) }
            : {}),
          ...(successor ? { supersededByLabel: successor } : {}),
          previewFields: previewFields(reference.subjectType, row),
          previewState:
            reference.subjectType === "DOCUMENT_VERSION"
              ? "UNSUPPORTED"
              : previewFields(reference.subjectType, row).length > 0
                ? "STRUCTURED"
                : "UNAVAILABLE",
          conflictKeys,
        }),
      );
    }

    sources.sort(
      (left, right) => requested.indexOf(left.referenceId) - requested.indexOf(right.referenceId),
    );
    return Object.freeze({ kind: "COMPLETE", sources: Object.freeze(sources) });
  }

  async getAuthorizedFactor(
    context: RuntimeContext,
    comparisonRunId: string,
    candidateProjectKey: string,
    factorKey: SimilarityFactorKey,
  ): Promise<EvidenceFactorRecord | null> {
    if (!FACTOR_KEYS.has(factorKey) || !context.capabilities.has("evidence:read")) return null;
    const row = await this.database.comparisonFactor.findFirst({
      where: {
        organizationId: context.organizationId,
        factorKey,
        comparisonCandidate: {
          comparisonRunId,
          candidateProject: { businessKey: candidateProjectKey },
        },
      },
      select: {
        factorKey: true,
        state: true,
        weight: true,
        normalizedValue: true,
        contribution: true,
        explanation: true,
        evidenceReferenceIds: true,
        comparisonCandidate: {
          select: {
            score: true,
            evidenceCoverage: true,
            candidateProject: {
              select: { id: true, businessKey: true, nameEn: true, nameZhTw: true },
            },
            comparisonRun: { select: { id: true, activeProjectId: true } },
          },
        },
      },
    });
    if (!row || row.comparisonCandidate.comparisonRun.id !== comparisonRunId) return null;
    if (
      !this.authorization.canRunComparison(
        context,
        row.comparisonCandidate.comparisonRun.activeProjectId,
      ).allowed
    ) {
      return null;
    }
    if (
      !this.authorization.canReadEvidence(context, row.comparisonCandidate.candidateProject.id)
        .allowed
    ) {
      return null;
    }
    return Object.freeze({
      comparisonRunId,
      candidateProjectId: row.comparisonCandidate.candidateProject.id,
      candidateProjectKey: row.comparisonCandidate.candidateProject.businessKey,
      candidateProjectNameEn: row.comparisonCandidate.candidateProject.nameEn,
      candidateProjectNameZhTw: row.comparisonCandidate.candidateProject.nameZhTw,
      factorKey,
      state: row.state,
      weight: numeric(row.weight) ?? "0",
      ...(numeric(row.normalizedValue) ? { normalizedValue: numeric(row.normalizedValue) } : {}),
      ...(numeric(row.contribution) ? { contribution: numeric(row.contribution) } : {}),
      explanation: jsonObject(row.explanation),
      evidenceReferenceIds: Object.freeze([...row.evidenceReferenceIds]),
      totalScore: numeric(row.comparisonCandidate.score) ?? "0",
      evidenceCoverage: numeric(row.comparisonCandidate.evidenceCoverage) ?? "0",
    });
  }

  async getAuthorizedConflict(
    context: RuntimeContext,
    comparisonRunId: string,
    conflictKey: string,
  ): Promise<EvidenceConflictRecord | null> {
    const conflicts = await this.database.evidenceConflict.findMany({
      where: { organizationId: context.organizationId, conflictKey },
      select: {
        conflictKey: true,
        status: true,
        resolutionNote: true,
        primaryEvidenceId: true,
        conflictingEvidenceId: true,
      },
    });
    if (conflicts.length === 0) return null;
    const referenceIds = [
      ...new Set(
        conflicts.flatMap((conflict) => [
          conflict.primaryEvidenceId,
          conflict.conflictingEvidenceId,
        ]),
      ),
    ];
    const sources = await this.getAuthorizedSources(context, comparisonRunId, referenceIds);
    if (sources.kind !== "COMPLETE") return null;
    const first = conflicts[0];
    if (!first) return null;
    return Object.freeze({
      conflictKey,
      status: first.status,
      ...(first.resolutionNote ? { resolutionNote: first.resolutionNote } : {}),
      sources: sources.sources,
    });
  }
}
