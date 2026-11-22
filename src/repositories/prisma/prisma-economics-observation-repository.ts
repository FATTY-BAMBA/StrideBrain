import { publicEvidenceValue } from "@/modules/evidence/domain/public-evidence-value";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type {
  AuthorizedEconomicsBatch,
  DataClassification,
  EconomicsAccessScope,
  EconomicsLineSnapshot,
  EconomicsProjectSnapshot,
  EconomicsSubjectType,
  EvidenceReferenceSnapshot,
  FinancialObservationRecord,
} from "@/modules/economics/domain/contracts";
import type { AuthorityState, ObservationType } from "@/modules/projects/domain/project-workspace";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import {
  hasOrganizationWidePrivateHistory,
  organizationComparisonLibraryClassifications,
} from "@/repositories/ports/comparable-project-repository";
import type { EconomicsObservationRepositoryPort } from "@/repositories/ports/economics-observation-repository";

type DecimalLike = { toString(): string } | string;

type EconomicsProjectRow = Readonly<{
  id: string;
  businessKey: string;
  status: EconomicsProjectSnapshot["status"];
  areaQuantity: DecimalLike;
  areaUnit: string;
  currency: string;
  programmeWeeks: DecimalLike | null;
  dataClassification: DataClassification;
}>;

type ComparisonCandidateRow = Readonly<{
  candidateProjectId: string;
  rank: number;
  candidateProject: EconomicsProjectRow;
}>;

type ComparisonRunRow = Readonly<{
  id: string;
  organizationId: string;
  activeProjectId: string;
  status: "COMPLETED" | "PENDING" | "RUNNING" | "FAILED" | "STALE";
  activeProject: EconomicsProjectRow;
  candidates: readonly ComparisonCandidateRow[];
}>;

type FinancialLineRow = Readonly<{
  id: string;
  lineNumber: number;
  categoryId: string;
  amount: DecimalLike;
  quantity: DecimalLike;
  unit: string;
  authorityState: AuthorityState;
}>;

type QuoteLineRow = FinancialLineRow & Readonly<{ unitPrice: DecimalLike }>;
type CostLineRow = FinancialLineRow & Readonly<{ unitCost: DecimalLike }>;
type OfferLineRow = Readonly<{
  id: string;
  lineNumber: number;
  categoryId: string;
  amount: DecimalLike;
  quantity: DecimalLike;
  unit: string;
  unitPrice: DecimalLike;
}>;

type QuoteVersionRow = Readonly<{
  status: string;
  id: string;
  organizationId: string;
  versionNumber: number;
  observationType: ObservationType;
  authorityState: AuthorityState;
  currency: string;
  amountBeforeTax: DecimalLike;
  approvedAt: Date | null;
  createdAt: Date;
  supersededById: string | null;
  quote: Readonly<{ businessKey: string; projectId: string }>;
  items: readonly QuoteLineRow[];
}>;

type ForecastVersionRow = Readonly<{
  id: string;
  organizationId: string;
  projectId: string;
  versionNumber: number;
  observationType: ObservationType;
  authorityState: AuthorityState;
  currency: string;
  totalDirectCost: DecimalLike;
  effectiveAt: Date;
  supersededById: string | null;
  lines: readonly CostLineRow[];
}>;

type ActualVersionRow = Readonly<{
  id: string;
  organizationId: string;
  projectId: string;
  versionNumber: number;
  observationType: ObservationType;
  authorityState: AuthorityState;
  currency: string;
  totalDirectCost: DecimalLike;
  reconciledAt: Date | null;
  supersededById: string | null;
  lines: readonly CostLineRow[];
}>;

type SupplierOfferRow = Readonly<{
  id: string;
  organizationId: string;
  businessKey: string;
  projectId: string | null;
  observationType: ObservationType;
  authorityState: AuthorityState;
  currency: string;
  amountBeforeTax: DecimalLike;
  offeredAt: Date;
  validUntil: Date | null;
  items: readonly OfferLineRow[];
}>;

type EvidenceRow = Readonly<{
  id: string;
  subjectType: EconomicsSubjectType;
  subjectId: string;
  documentVersionId: string | null;
  locator: unknown;
  claimKey: string;
  supportedValue: unknown;
  authorityState: AuthorityState;
  observationType: ObservationType | null;
  dataClassification: DataClassification;
  effectiveAt: Date | null;
  staleAt: Date | null;
}>;

type ConflictRow = Readonly<{
  id: string;
  primaryEvidenceId: string;
  conflictingEvidenceId: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
}>;

export type PrismaEconomicsObservationDatabase = {
  comparisonRun: {
    findFirst(args: unknown): Promise<ComparisonRunRow | null>;
  };
  quoteVersion: {
    findMany(args: unknown): Promise<QuoteVersionRow[]>;
  };
  forecastCostVersion: {
    findMany(args: unknown): Promise<ForecastVersionRow[]>;
  };
  projectCostVersion: {
    findMany(args: unknown): Promise<ActualVersionRow[]>;
  };
  supplierOffer: {
    findMany(args: unknown): Promise<SupplierOfferRow[]>;
  };
  evidenceReference: {
    findMany(args: unknown): Promise<EvidenceRow[]>;
  };
  evidenceConflict: {
    findMany(args: unknown): Promise<ConflictRow[]>;
  };
};

const MAX_SELECTED_PROJECTS = 3;
const MAX_FINANCIAL_RECORDS = 100;
const LIBRARY_CLASSIFICATIONS = new Set(organizationComparisonLibraryClassifications());

function dateOnly(value: Date | null | undefined): string | undefined {
  return value?.toISOString().slice(0, 10);
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function uniqueInOrder(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))]);
}

function objectValue(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return Object.freeze({ ...(value as Record<string, unknown>) });
}

function historicalProjectAllowed(context: RuntimeContext, project: EconomicsProjectRow): boolean {
  if (LIBRARY_CLASSIFICATIONS.has(project.dataClassification)) return true;
  if (project.dataClassification !== "TENANT_PRIVATE") return false;
  if (hasOrganizationWidePrivateHistory(context)) return true;
  return context.assignedProjectIds?.has(project.id) === true;
}

function historicalActualAllowed(context: RuntimeContext, project: EconomicsProjectRow): boolean {
  if (!context.capabilities.has("commercial:actual-read")) return false;
  if (LIBRARY_CLASSIFICATIONS.has(project.dataClassification)) return true;
  if (project.dataClassification !== "TENANT_PRIVATE") return false;
  if (hasOrganizationWidePrivateHistory(context)) return true;
  return context.projectAssignments?.get(project.id)?.canReadActuals === true;
}

function accessScope(
  context: RuntimeContext,
  activeProjectId: string,
  canReadEvidence: boolean,
  authorization: AuthorizationService,
): EconomicsAccessScope {
  if (!canReadEvidence) return "STRUCTURAL_ONLY";
  if (authorization.canReadCommercial(context, activeProjectId, "ACTUAL").allowed) {
    return "FULL_ACTUAL";
  }
  if (authorization.canReadCommercial(context, activeProjectId, "FORECAST").allowed) {
    return "QUOTE_AND_FORECAST";
  }
  if (authorization.canReadCommercial(context, activeProjectId, "QUOTE").allowed) {
    return "QUOTE_ONLY";
  }
  return "STRUCTURAL_ONLY";
}

function projectSelect() {
  return {
    id: true,
    businessKey: true,
    status: true,
    areaQuantity: true,
    areaUnit: true,
    currency: true,
    programmeWeeks: true,
    dataClassification: true,
  } as const;
}

function evidenceKey(subjectType: string, subjectId: string): string {
  return `${subjectType}:${subjectId}`;
}

function evidenceMap(rows: readonly EvidenceRow[]): ReadonlyMap<string, readonly string[]> {
  const output = new Map<string, string[]>();
  for (const row of rows) {
    const key = evidenceKey(row.subjectType, row.subjectId);
    const ids = output.get(key) ?? [];
    ids.push(row.id);
    output.set(key, ids);
  }
  return new Map([...output.entries()].map(([key, ids]) => [key, unique(ids)] as const));
}

function evidenceFor(
  map: ReadonlyMap<string, readonly string[]>,
  subjectType: EconomicsSubjectType,
  subjectId: string,
): readonly string[] {
  return map.get(evidenceKey(subjectType, subjectId)) ?? Object.freeze([]);
}

function conflictMap(rows: readonly ConflictRow[]): ReadonlyMap<string, readonly string[]> {
  const output = new Map<string, string[]>();
  for (const row of rows.filter((candidate) => candidate.status === "OPEN")) {
    for (const evidenceId of [row.primaryEvidenceId, row.conflictingEvidenceId]) {
      const conflicts = output.get(evidenceId) ?? [];
      conflicts.push(row.id);
      output.set(evidenceId, conflicts);
    }
  }
  return new Map([...output.entries()].map(([key, ids]) => [key, unique(ids)] as const));
}

function conflictsFor(
  evidenceReferenceIds: readonly string[],
  conflicts: ReadonlyMap<string, readonly string[]>,
): readonly string[] {
  return unique(evidenceReferenceIds.flatMap((id) => conflicts.get(id) ?? []));
}

function mapProject(
  row: EconomicsProjectRow,
  evidence: ReadonlyMap<string, readonly string[]>,
): EconomicsProjectSnapshot {
  return Object.freeze({
    internalId: row.id,
    businessKey: row.businessKey,
    status: row.status,
    areaValue: row.areaQuantity.toString(),
    areaUnit: row.areaUnit,
    currency: row.currency,
    ...(row.programmeWeeks ? { programmeWeeks: row.programmeWeeks.toString() } : {}),
    dataClassification: row.dataClassification,
    evidenceReferenceIds: evidenceFor(evidence, "PROJECT", row.id),
  });
}

function mapLine(
  line: FinancialLineRow,
  subjectType: EconomicsLineSnapshot["subjectType"],
  unitRate: DecimalLike,
  evidence: ReadonlyMap<string, readonly string[]>,
): EconomicsLineSnapshot {
  return Object.freeze({
    id: line.id,
    subjectType,
    lineNumber: line.lineNumber,
    categoryId: line.categoryId,
    amount: line.amount.toString(),
    quantity: line.quantity.toString(),
    unitRate: unitRate.toString(),
    unit: line.unit,
    authorityState: line.authorityState,
    evidenceReferenceIds: evidenceFor(evidence, subjectType, line.id),
  });
}

function recordEvidence(
  subjectType: EconomicsSubjectType,
  subjectId: string,
  lines: readonly EconomicsLineSnapshot[],
  evidence: ReadonlyMap<string, readonly string[]>,
): readonly string[] {
  return unique([
    ...evidenceFor(evidence, subjectType, subjectId),
    ...lines.flatMap((line) => line.evidenceReferenceIds),
  ]);
}

function mapQuote(
  row: QuoteVersionRow,
  project: EconomicsProjectSnapshot,
  evidence: ReadonlyMap<string, readonly string[]>,
  conflicts: ReadonlyMap<string, readonly string[]>,
): FinancialObservationRecord {
  const lines = Object.freeze(
    row.items.map((line) => mapLine(line, "QUOTE_ITEM", line.unitPrice, evidence)),
  );
  const evidenceReferenceIds = recordEvidence("QUOTE_VERSION", row.id, lines, evidence);
  return Object.freeze({
    id: row.id,
    projectId: project.internalId,
    projectKey: project.businessKey,
    recordKey: `${row.quote.businessKey}-v${row.versionNumber}`,
    quoteStatus: row.status,
    versionNumber: row.versionNumber,
    subjectType: "QUOTE_VERSION",
    observationType: row.observationType,
    authorityState: row.authorityState,
    currency: row.currency,
    totalAmount: row.amountBeforeTax.toString(),
    effectiveAt: dateOnly(row.approvedAt ?? row.createdAt),
    ...(row.supersededById ? { supersededById: row.supersededById } : {}),
    conflictIds: conflictsFor(evidenceReferenceIds, conflicts),
    evidenceReferenceIds,
    dataClassification: project.dataClassification,
    lines,
  });
}

function mapForecast(
  row: ForecastVersionRow,
  project: EconomicsProjectSnapshot,
  evidence: ReadonlyMap<string, readonly string[]>,
  conflicts: ReadonlyMap<string, readonly string[]>,
): FinancialObservationRecord {
  const lines = Object.freeze(
    row.lines.map((line) => mapLine(line, "FORECAST_COST_LINE", line.unitCost, evidence)),
  );
  const evidenceReferenceIds = recordEvidence("FORECAST_COST_VERSION", row.id, lines, evidence);
  return Object.freeze({
    id: row.id,
    projectId: project.internalId,
    projectKey: project.businessKey,
    recordKey: `${project.businessKey}-FORECAST-v${row.versionNumber}`,
    versionNumber: row.versionNumber,
    subjectType: "FORECAST_COST_VERSION",
    observationType: row.observationType,
    authorityState: row.authorityState,
    currency: row.currency,
    totalAmount: row.totalDirectCost.toString(),
    effectiveAt: dateOnly(row.effectiveAt),
    ...(row.supersededById ? { supersededById: row.supersededById } : {}),
    conflictIds: conflictsFor(evidenceReferenceIds, conflicts),
    evidenceReferenceIds,
    dataClassification: project.dataClassification,
    lines,
  });
}

function mapActual(
  row: ActualVersionRow,
  project: EconomicsProjectSnapshot,
  evidence: ReadonlyMap<string, readonly string[]>,
  conflicts: ReadonlyMap<string, readonly string[]>,
): FinancialObservationRecord {
  const lines = Object.freeze(
    row.lines.map((line) => mapLine(line, "COST_LINE", line.unitCost, evidence)),
  );
  const evidenceReferenceIds = recordEvidence("PROJECT_COST_VERSION", row.id, lines, evidence);
  return Object.freeze({
    id: row.id,
    projectId: project.internalId,
    projectKey: project.businessKey,
    recordKey: `${project.businessKey}-ACTUAL-v${row.versionNumber}`,
    versionNumber: row.versionNumber,
    subjectType: "PROJECT_COST_VERSION",
    observationType: row.observationType,
    authorityState: row.authorityState,
    currency: row.currency,
    totalAmount: row.totalDirectCost.toString(),
    effectiveAt: dateOnly(row.reconciledAt),
    ...(row.supersededById ? { supersededById: row.supersededById } : {}),
    conflictIds: conflictsFor(evidenceReferenceIds, conflicts),
    evidenceReferenceIds,
    dataClassification: project.dataClassification,
    lines,
  });
}

function mapOffer(
  row: SupplierOfferRow,
  project: EconomicsProjectSnapshot,
  evidence: ReadonlyMap<string, readonly string[]>,
  conflicts: ReadonlyMap<string, readonly string[]>,
): FinancialObservationRecord {
  const lines = Object.freeze(
    row.items.map((line) =>
      mapLine(
        { ...line, authorityState: row.authorityState },
        "SUPPLIER_OFFER_ITEM",
        line.unitPrice,
        evidence,
      ),
    ),
  );
  const evidenceReferenceIds = recordEvidence("SUPPLIER_OFFER", row.id, lines, evidence);
  return Object.freeze({
    id: row.id,
    projectId: project.internalId,
    projectKey: project.businessKey,
    recordKey: row.businessKey,
    subjectType: "SUPPLIER_OFFER",
    observationType: row.observationType,
    authorityState: row.authorityState,
    currency: row.currency,
    totalAmount: row.amountBeforeTax.toString(),
    effectiveAt: dateOnly(row.offeredAt),
    validUntil: dateOnly(row.validUntil),
    conflictIds: conflictsFor(evidenceReferenceIds, conflicts),
    evidenceReferenceIds,
    dataClassification: project.dataClassification,
    lines,
  });
}

function mapEvidenceRows(
  rows: readonly EvidenceRow[],
  conflicts: ReadonlyMap<string, readonly string[]>,
): readonly EvidenceReferenceSnapshot[] {
  return Object.freeze(
    rows
      .map((row) =>
        Object.freeze({
          id: row.id,
          subjectType: row.subjectType,
          subjectId: row.subjectId,
          ...(row.documentVersionId ? { documentVersionId: row.documentVersionId } : {}),
          locator: objectValue(row.locator) ?? Object.freeze({}),
          claimKey: row.claimKey,
          ...(publicEvidenceValue(row.supportedValue)
            ? { supportedValue: publicEvidenceValue(row.supportedValue) }
            : {}),
          authorityState: row.authorityState,
          ...(row.observationType ? { observationType: row.observationType } : {}),
          dataClassification: row.dataClassification,
          ...(dateOnly(row.effectiveAt) ? { effectiveAt: dateOnly(row.effectiveAt) } : {}),
          ...(dateOnly(row.staleAt) ? { staleAt: dateOnly(row.staleAt) } : {}),
          conflictIds: conflicts.get(row.id) ?? Object.freeze([]),
        }),
      )
      .sort((left, right) => left.id.localeCompare(right.id)),
  );
}

function requestedSelection(
  stage4: Stage4ComparisonResult,
  selectedProjectKeys: readonly string[] | undefined,
): readonly string[] | null {
  const requested = uniqueInOrder(selectedProjectKeys ?? stage4.defaultSelectedProjectKeys);
  if (requested.length === 0 || requested.length > MAX_SELECTED_PROJECTS) return null;
  const available = new Set(
    [...stage4.matches, ...stage4.broaderMatches].map((match) => match.project.projectKey),
  );
  if (!requested.every((key) => available.has(key))) return null;
  const chosen = new Set(requested);
  return Object.freeze(
    [...stage4.matches, ...stage4.broaderMatches]
      .map((match) => match.project.projectKey)
      .filter((key) => chosen.has(key)),
  );
}

function financialSubjectSelectors(
  input: Readonly<{
    projectIds: readonly string[];
    quoteRows: readonly QuoteVersionRow[];
    forecastRows: readonly ForecastVersionRow[];
    actualRows: readonly ActualVersionRow[];
    offerRows: readonly SupplierOfferRow[];
  }>,
): readonly unknown[] {
  return Object.freeze(
    [
      { subjectType: "PROJECT", subjectId: { in: [...input.projectIds] } },
      {
        subjectType: "QUOTE_VERSION",
        subjectId: { in: input.quoteRows.map((row) => row.id) },
      },
      {
        subjectType: "QUOTE_ITEM",
        subjectId: { in: input.quoteRows.flatMap((row) => row.items.map((line) => line.id)) },
      },
      {
        subjectType: "FORECAST_COST_VERSION",
        subjectId: { in: input.forecastRows.map((row) => row.id) },
      },
      {
        subjectType: "FORECAST_COST_LINE",
        subjectId: { in: input.forecastRows.flatMap((row) => row.lines.map((line) => line.id)) },
      },
      {
        subjectType: "PROJECT_COST_VERSION",
        subjectId: { in: input.actualRows.map((row) => row.id) },
      },
      {
        subjectType: "COST_LINE",
        subjectId: { in: input.actualRows.flatMap((row) => row.lines.map((line) => line.id)) },
      },
      {
        subjectType: "SUPPLIER_OFFER",
        subjectId: { in: input.offerRows.map((row) => row.id) },
      },
      {
        subjectType: "SUPPLIER_OFFER_ITEM",
        subjectId: { in: input.offerRows.flatMap((row) => row.items.map((line) => line.id)) },
      },
    ].filter((selector) => {
      const value = selector as { subjectId: { in: readonly string[] } };
      return value.subjectId.in.length > 0;
    }),
  );
}

export class PrismaEconomicsObservationRepository implements EconomicsObservationRepositoryPort {
  constructor(
    private readonly database: PrismaEconomicsObservationDatabase,
    private readonly authorization = new AuthorizationService(),
  ) {}

  async loadAuthorizedBatch(
    context: RuntimeContext,
    comparisonRunId: string,
    stage4: Stage4ComparisonResult,
    selectedProjectKeys?: readonly string[],
  ): Promise<AuthorizedEconomicsBatch | null> {
    if (!context.capabilities.has("project:compare") || stage4.run.id !== comparisonRunId) {
      return null;
    }

    const selection = requestedSelection(stage4, selectedProjectKeys);
    if (!selection) return null;

    const run = await this.database.comparisonRun.findFirst({
      where: {
        id: comparisonRunId,
        organizationId: context.organizationId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        organizationId: true,
        activeProjectId: true,
        status: true,
        activeProject: { select: projectSelect() },
        candidates: {
          orderBy: { rank: "asc" },
          select: {
            candidateProjectId: true,
            rank: true,
            candidateProject: { select: projectSelect() },
          },
        },
      },
    });
    if (!run || run.organizationId !== context.organizationId) return null;
    if (!this.authorization.canRunComparison(context, run.activeProjectId).allowed) return null;
    if (run.activeProject.businessKey !== stage4.activeContext.projectKey) return null;

    const candidateByKey = new Map(
      run.candidates.map(
        (candidate) => [candidate.candidateProject.businessKey, candidate] as const,
      ),
    );
    const selectedCandidates = selection.map((key) => candidateByKey.get(key));
    if (
      selectedCandidates.some(
        (candidate) => !candidate || !historicalProjectAllowed(context, candidate.candidateProject),
      )
    ) {
      return null;
    }

    const selected = selectedCandidates.filter((candidate): candidate is ComparisonCandidateRow =>
      Boolean(candidate),
    );
    const selectedProjectIds = Object.freeze(
      selected.map((candidate) => candidate.candidateProjectId),
    );
    const selectedActualProjectIds = Object.freeze(
      selected
        .filter((candidate) => historicalActualAllowed(context, candidate.candidateProject))
        .map((candidate) => candidate.candidateProjectId),
    );

    const evidenceAllowed = this.authorization.canReadEvidence(
      context,
      run.activeProjectId,
    ).allowed;
    const scope = accessScope(context, run.activeProjectId, evidenceAllowed, this.authorization);
    const allProjectIds = Object.freeze([run.activeProjectId, ...selectedProjectIds]);

    let databaseQueries = 1;
    const quotePromise =
      scope === "STRUCTURAL_ONLY"
        ? Promise.resolve([] as QuoteVersionRow[])
        : (databaseQueries++,
          this.database.quoteVersion.findMany({
            where: {
              organizationId: context.organizationId,
              quote: {
                organizationId: context.organizationId,
                projectId: { in: [...allProjectIds] },
              },
            },
            orderBy: [{ quote: { projectId: "asc" } }, { versionNumber: "desc" }],
            take: MAX_FINANCIAL_RECORDS,
            select: {
              id: true,
              organizationId: true,
              versionNumber: true,
              status: true,
              observationType: true,
              authorityState: true,
              currency: true,
              amountBeforeTax: true,
              approvedAt: true,
              createdAt: true,
              supersededById: true,
              quote: { select: { businessKey: true, projectId: true } },
              items: {
                where: { organizationId: context.organizationId },
                orderBy: { lineNumber: "asc" },
                select: {
                  id: true,
                  lineNumber: true,
                  categoryId: true,
                  amount: true,
                  quantity: true,
                  unitPrice: true,
                  unit: true,
                  authorityState: true,
                },
              },
            },
          }));
    const forecastPromise =
      scope === "QUOTE_AND_FORECAST" || scope === "FULL_ACTUAL"
        ? (databaseQueries++,
          this.database.forecastCostVersion.findMany({
            where: {
              organizationId: context.organizationId,
              projectId: run.activeProjectId,
            },
            orderBy: { versionNumber: "desc" },
            take: MAX_FINANCIAL_RECORDS,
            select: {
              id: true,
              organizationId: true,
              projectId: true,
              versionNumber: true,
              observationType: true,
              authorityState: true,
              currency: true,
              totalDirectCost: true,
              effectiveAt: true,
              supersededById: true,
              lines: {
                where: { organizationId: context.organizationId },
                orderBy: { lineNumber: "asc" },
                select: {
                  id: true,
                  lineNumber: true,
                  categoryId: true,
                  amount: true,
                  quantity: true,
                  unitCost: true,
                  unit: true,
                  authorityState: true,
                },
              },
            },
          }))
        : Promise.resolve([] as ForecastVersionRow[]);
    const actualPromise =
      scope === "FULL_ACTUAL" && selectedActualProjectIds.length > 0
        ? (databaseQueries++,
          this.database.projectCostVersion.findMany({
            where: {
              organizationId: context.organizationId,
              projectId: { in: [...selectedActualProjectIds] },
            },
            orderBy: [{ projectId: "asc" }, { versionNumber: "desc" }],
            take: MAX_FINANCIAL_RECORDS,
            select: {
              id: true,
              organizationId: true,
              projectId: true,
              versionNumber: true,
              observationType: true,
              authorityState: true,
              currency: true,
              totalDirectCost: true,
              reconciledAt: true,
              supersededById: true,
              lines: {
                where: { organizationId: context.organizationId },
                orderBy: { lineNumber: "asc" },
                select: {
                  id: true,
                  lineNumber: true,
                  categoryId: true,
                  amount: true,
                  quantity: true,
                  unitCost: true,
                  unit: true,
                  authorityState: true,
                },
              },
            },
          }))
        : Promise.resolve([] as ActualVersionRow[]);
    const offerPromise =
      scope === "QUOTE_AND_FORECAST" || scope === "FULL_ACTUAL"
        ? (databaseQueries++,
          this.database.supplierOffer.findMany({
            where: {
              organizationId: context.organizationId,
              projectId: { in: [...allProjectIds] },
            },
            orderBy: [{ projectId: "asc" }, { offeredAt: "desc" }],
            take: MAX_FINANCIAL_RECORDS,
            select: {
              id: true,
              organizationId: true,
              businessKey: true,
              projectId: true,
              observationType: true,
              authorityState: true,
              currency: true,
              amountBeforeTax: true,
              offeredAt: true,
              validUntil: true,
              items: {
                where: { organizationId: context.organizationId },
                orderBy: { lineNumber: "asc" },
                select: {
                  id: true,
                  lineNumber: true,
                  categoryId: true,
                  amount: true,
                  quantity: true,
                  unitPrice: true,
                  unit: true,
                },
              },
            },
          }))
        : Promise.resolve([] as SupplierOfferRow[]);

    const [quoteRows, forecastRows, actualRows, offerRows] = await Promise.all([
      quotePromise,
      forecastPromise,
      actualPromise,
      offerPromise,
    ]);

    const selectors =
      scope === "STRUCTURAL_ONLY"
        ? Object.freeze([])
        : financialSubjectSelectors({
            projectIds: allProjectIds,
            quoteRows,
            forecastRows,
            actualRows,
            offerRows,
          });
    const evidenceRows =
      evidenceAllowed && selectors.length > 0
        ? (databaseQueries++,
          await this.database.evidenceReference.findMany({
            where: {
              organizationId: context.organizationId,
              OR: [...selectors],
            },
            orderBy: { id: "asc" },
            take: 1000,
            select: {
              id: true,
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
          }))
        : [];
    const evidenceIds = evidenceRows.map((reference) => reference.id);
    const conflictRows =
      evidenceIds.length > 0
        ? (databaseQueries++,
          await this.database.evidenceConflict.findMany({
            where: {
              organizationId: context.organizationId,
              status: "OPEN",
              OR: [
                { primaryEvidenceId: { in: evidenceIds } },
                { conflictingEvidenceId: { in: evidenceIds } },
              ],
            },
            orderBy: { id: "asc" },
            take: 200,
            select: {
              id: true,
              primaryEvidenceId: true,
              conflictingEvidenceId: true,
              status: true,
            },
          }))
        : [];

    const evidenceBySubject = evidenceMap(evidenceRows);
    const conflictsByEvidence = conflictMap(conflictRows);
    const projects = Object.freeze([
      mapProject(run.activeProject, evidenceBySubject),
      ...selected.map((candidate) => mapProject(candidate.candidateProject, evidenceBySubject)),
    ]);
    const projectsById = new Map(projects.map((project) => [project.internalId, project] as const));

    const records = Object.freeze(
      [
        ...quoteRows.map((row) =>
          mapQuote(
            row,
            projectsById.get(row.quote.projectId)!,
            evidenceBySubject,
            conflictsByEvidence,
          ),
        ),
        ...forecastRows.map((row) =>
          mapForecast(
            row,
            projectsById.get(row.projectId)!,
            evidenceBySubject,
            conflictsByEvidence,
          ),
        ),
        ...actualRows.map((row) =>
          mapActual(row, projectsById.get(row.projectId)!, evidenceBySubject, conflictsByEvidence),
        ),
        ...offerRows
          .filter((row): row is SupplierOfferRow & { projectId: string } => Boolean(row.projectId))
          .map((row) =>
            mapOffer(row, projectsById.get(row.projectId)!, evidenceBySubject, conflictsByEvidence),
          ),
      ].sort((left, right) => left.id.localeCompare(right.id)),
    );

    if (records.some((record) => !projectsById.has(record.projectId))) return null;

    return Object.freeze({
      structuralResult: stage4,
      comparisonRunId,
      activeProjectId: run.activeProjectId,
      activeProjectKey: run.activeProject.businessKey,
      selectedProjectIds,
      selectedProjectKeys: selection,
      accessScope: scope,
      canReadEvidence: evidenceAllowed,
      projects,
      records,
      evidence: mapEvidenceRows(evidenceRows, conflictsByEvidence),
      diagnostics: Object.freeze({
        databaseQueries,
        projectRowsReturned: projects.length,
        financialRecordsReturned: records.length,
        evidenceRowsReturned: evidenceRows.length,
        maximumSelectedProjects: MAX_SELECTED_PROJECTS,
      }),
    });
  }
}
