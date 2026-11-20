import type { AuthorityState } from "@/modules/projects/domain/project-workspace";
import type {
  ComparisonFactorEvidence,
  ComparisonProjectProfile,
  DataClassification,
  ProjectRecordStatus,
} from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import {
  allowedActiveProjectClassifications,
  hasOrganizationWidePrivateHistory,
  organizationComparisonLibraryClassifications,
  type ActiveComparisonProfileRecord,
  type ComparableProjectRepositoryPort,
  type HistoricalCandidateBatch,
} from "@/repositories/ports/comparable-project-repository";

type DecimalLike = { toString(): string } | string;

type ProfileQuoteItemRow = Readonly<{
  id: string;
  categoryId: string;
}>;

type ProfileQuoteVersionRow = Readonly<{
  id: string;
  versionNumber: number;
  createdAt: Date;
  items: readonly ProfileQuoteItemRow[];
}>;

type ProfileQuoteRow = Readonly<{
  businessKey: string;
  versions: readonly ProfileQuoteVersionRow[];
}>;

type ProfileDocumentRow = Readonly<{
  versions: readonly Readonly<{ id: string }>[];
}>;

type ProfileProjectRow = Readonly<{
  id: string;
  organizationId: string;
  businessKey: string;
  nameEn: string;
  nameZhTw: string;
  comparisonClass: string;
  subtype: string;
  status: ProjectRecordStatus;
  locationCity: string;
  locationDistrict: string | null;
  areaQuantity: DecimalLike;
  areaUnit: string;
  currency: string;
  commercialCategoryIds: readonly string[];
  completedAt: Date | null;
  metadataAuthority: AuthorityState;
  dataClassification: DataClassification;
  updatedAt: Date;
  scopes: readonly Readonly<{ categoryId: string }>[];
  projectMaterials: readonly Readonly<{
    material: Readonly<{ businessKey: string }>;
  }>[];
  projectSuppliers: readonly Readonly<{
    supplier: Readonly<{ businessKey: string }>;
  }>[];
  quotes: readonly ProfileQuoteRow[];
  documents: readonly ProfileDocumentRow[];
}>;

type ProfileEvidenceRow = Readonly<{
  id: string;
  subjectType: "DOCUMENT_VERSION" | "QUOTE_ITEM";
  subjectId: string;
}>;

export type PrismaComparableProjectDatabase = {
  project: {
    findFirst(args: unknown): Promise<ProfileProjectRow | null>;
    findMany(args: unknown): Promise<ProfileProjectRow[]>;
  };
  evidenceReference: {
    findMany(args: unknown): Promise<ProfileEvidenceRow[]>;
  };
};

const MAX_HISTORICAL_ROWS = 100;

function historicalAccessPredicates(context: RuntimeContext): readonly unknown[] {
  const predicates: unknown[] = [
    {
      dataClassification: {
        in: organizationComparisonLibraryClassifications(),
      },
    },
  ];
  if (hasOrganizationWidePrivateHistory(context)) {
    predicates.push({ dataClassification: "TENANT_PRIVATE" });
  } else {
    const assigned = [...(context.assignedProjectIds ?? [])].sort();
    if (assigned.length > 0) {
      predicates.push({
        id: { in: assigned },
        dataClassification: "TENANT_PRIVATE",
      });
    }
  }
  return Object.freeze(predicates);
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function currentQuote(row: ProfileProjectRow): Readonly<{
  quoteKey: string;
  version: ProfileQuoteVersionRow;
}> | null {
  const versions = row.quotes.flatMap((quote) =>
    quote.versions.map((version) => ({ quoteKey: quote.businessKey, version })),
  );
  versions.sort(
    (left, right) =>
      right.version.versionNumber - left.version.versionNumber ||
      right.version.createdAt.getTime() - left.version.createdAt.getTime() ||
      left.quoteKey.localeCompare(right.quoteKey),
  );
  return versions[0] ?? null;
}

function factorEvidence(
  projectEvidence: readonly string[],
  commercialEvidence: readonly string[],
): ComparisonFactorEvidence {
  return Object.freeze({
    SUBTYPE: projectEvidence,
    SCOPE_OVERLAP: projectEvidence,
    AREA_SIMILARITY: projectEvidence,
    COMMERCIAL_CATEGORY_OVERLAP: commercialEvidence,
    MATERIAL_OVERLAP: commercialEvidence,
    SUPPLIER_OVERLAP: commercialEvidence,
    COMPLETION_RECENCY: projectEvidence,
    LOCATION_PROXIMITY: projectEvidence,
  });
}

function profileSourceIds(row: ProfileProjectRow): Readonly<{
  documentVersionIds: readonly string[];
  quoteItemIds: readonly string[];
}> {
  const quote = currentQuote(row);
  return Object.freeze({
    documentVersionIds: unique(
      row.documents.flatMap((document) => document.versions.map((version) => version.id)),
    ),
    quoteItemIds: unique(quote?.version.items.map((item) => item.id) ?? []),
  });
}

function mapEvidence(
  evidence: readonly ProfileEvidenceRow[],
): ReadonlyMap<string, readonly string[]> {
  const map = new Map<string, string[]>();
  for (const reference of evidence) {
    const key = `${reference.subjectType}:${reference.subjectId}`;
    const existing = map.get(key) ?? [];
    existing.push(reference.id);
    map.set(key, existing);
  }
  return new Map([...map.entries()].map(([key, values]) => [key, unique(values)] as const));
}

function evidenceFor(
  map: ReadonlyMap<string, readonly string[]>,
  subjectType: "DOCUMENT_VERSION" | "QUOTE_ITEM",
  subjectIds: readonly string[],
): readonly string[] {
  return unique(subjectIds.flatMap((subjectId) => map.get(`${subjectType}:${subjectId}`) ?? []));
}

function mapProfile(
  row: ProfileProjectRow,
  evidence: ReadonlyMap<string, readonly string[]>,
): ComparisonProjectProfile {
  const quote = currentQuote(row);
  const sourceIds = profileSourceIds(row);
  const projectEvidence = evidenceFor(evidence, "DOCUMENT_VERSION", sourceIds.documentVersionIds);
  const commercialEvidence = evidenceFor(evidence, "QUOTE_ITEM", sourceIds.quoteItemIds);

  return Object.freeze({
    internalId: row.id,
    organizationId: row.organizationId,
    businessKey: row.businessKey,
    nameEn: row.nameEn,
    nameZhTw: row.nameZhTw,
    comparisonClass: row.comparisonClass,
    subtype: row.subtype,
    status: row.status,
    location: Object.freeze({
      city: row.locationCity,
      district: row.locationDistrict ?? undefined,
    }),
    areaValue: row.areaQuantity.toString(),
    areaUnit: row.areaUnit,
    currency: row.currency,
    completedAt: row.completedAt?.toISOString().slice(0, 10),
    metadataAuthority: row.metadataAuthority,
    dataClassification: row.dataClassification,
    scopeCategoryIds: unique(row.scopes.map((scope) => scope.categoryId)),
    commercialCategoryIds: unique(
      quote ? quote.version.items.map((item) => item.categoryId) : row.commercialCategoryIds,
    ),
    materialIds: unique(
      row.projectMaterials.map((relationship) => relationship.material.businessKey),
    ),
    supplierIds: unique(
      row.projectSuppliers.map((relationship) => relationship.supplier.businessKey),
    ),
    factorEvidence: factorEvidence(projectEvidence, commercialEvidence),
    recordVersion: `${row.updatedAt.toISOString()}|${quote?.version.id ?? "NO_CURRENT_QUOTE"}|${quote?.version.createdAt.toISOString() ?? ""}`,
  });
}

function projectSelect(organizationId: string) {
  return {
    id: true,
    organizationId: true,
    businessKey: true,
    nameEn: true,
    nameZhTw: true,
    comparisonClass: true,
    subtype: true,
    status: true,
    locationCity: true,
    locationDistrict: true,
    areaQuantity: true,
    areaUnit: true,
    currency: true,
    commercialCategoryIds: true,
    completedAt: true,
    metadataAuthority: true,
    dataClassification: true,
    updatedAt: true,
    scopes: {
      where: { organizationId },
      orderBy: { categoryId: "asc" },
      select: { categoryId: true },
    },
    projectMaterials: {
      where: { organizationId, material: { organizationId, active: true } },
      orderBy: { material: { businessKey: "asc" } },
      select: { material: { select: { businessKey: true } } },
    },
    projectSuppliers: {
      where: { organizationId, supplier: { organizationId, active: true } },
      orderBy: { supplier: { businessKey: "asc" } },
      select: { supplier: { select: { businessKey: true } } },
    },
    quotes: {
      where: { organizationId },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        businessKey: true,
        versions: {
          where: {
            organizationId,
            supersededById: null,
            authorityState: { not: "SUPERSEDED" },
          },
          orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            id: true,
            versionNumber: true,
            createdAt: true,
            items: {
              where: { organizationId },
              orderBy: { lineNumber: "asc" },
              select: { id: true, categoryId: true },
            },
          },
        },
      },
    },
    documents: {
      where: { organizationId, documentType: "PROJECT_SUMMARY" },
      take: 5,
      orderBy: { businessKey: "asc" },
      select: {
        versions: {
          where: { organizationId, supersededById: null },
          orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: { id: true },
        },
      },
    },
  } as const;
}

export class PrismaComparableProjectRepository implements ComparableProjectRepositoryPort {
  constructor(private readonly database: PrismaComparableProjectDatabase) {}

  async getActiveComparisonProfile(
    context: RuntimeContext,
    projectId: string,
  ): Promise<ActiveComparisonProfileRecord | null> {
    if (!context.capabilities.has("project:compare")) return null;
    const row = await this.database.project.findFirst({
      where: {
        id: projectId,
        organizationId: context.organizationId,
        deletedAt: null,
        dataClassification: { in: allowedActiveProjectClassifications() },
      },
      select: projectSelect(context.organizationId),
    });
    if (!row || row.organizationId !== context.organizationId) return null;

    const sources = profileSourceIds(row);
    const evidenceRows = await this.database.evidenceReference.findMany({
      where: {
        organizationId: context.organizationId,
        dataClassification: { in: allowedActiveProjectClassifications() },
        OR: [
          {
            subjectType: "DOCUMENT_VERSION",
            subjectId: { in: [...sources.documentVersionIds] },
          },
          {
            subjectType: "QUOTE_ITEM",
            subjectId: { in: [...sources.quoteItemIds] },
          },
        ],
      },
      orderBy: { id: "asc" },
      select: { id: true, subjectType: true, subjectId: true },
    });
    const quote = currentQuote(row);
    return Object.freeze({
      profile: mapProfile(row, mapEvidence(evidenceRows)),
      activeQuoteVersionId: quote?.version.id,
      activeQuoteVersionKey: quote
        ? `${quote.quoteKey}-v${quote.version.versionNumber}`
        : undefined,
    });
  }

  async listAuthorizedHistoricalProfiles(
    context: RuntimeContext,
    activeProjectId: string,
  ): Promise<HistoricalCandidateBatch> {
    if (!context.capabilities.has("project:compare")) {
      return Object.freeze({
        profiles: Object.freeze([]),
        diagnostics: Object.freeze({
          databaseQueries: 0,
          authorizedRowsReturned: 0,
          maximumRows: MAX_HISTORICAL_ROWS,
        }),
      });
    }

    const rows = await this.database.project.findMany({
      where: {
        organizationId: context.organizationId,
        id: { not: activeProjectId },
        status: { in: ["COMPLETED", "CLOSED", "ARCHIVED"] },
        deletedAt: null,
        OR: historicalAccessPredicates(context),
      },
      take: MAX_HISTORICAL_ROWS,
      orderBy: { businessKey: "asc" },
      select: projectSelect(context.organizationId),
    });

    const sourceIds = rows.map(profileSourceIds);
    const documentVersionIds = unique(sourceIds.flatMap((sources) => sources.documentVersionIds));
    const quoteItemIds = unique(sourceIds.flatMap((sources) => sources.quoteItemIds));
    const evidenceQueryExecuted = documentVersionIds.length > 0 || quoteItemIds.length > 0;
    const evidenceRows = evidenceQueryExecuted
      ? await this.database.evidenceReference.findMany({
          where: {
            organizationId: context.organizationId,
            dataClassification: { in: allowedActiveProjectClassifications() },
            OR: [
              {
                subjectType: "DOCUMENT_VERSION",
                subjectId: { in: [...documentVersionIds] },
              },
              {
                subjectType: "QUOTE_ITEM",
                subjectId: { in: [...quoteItemIds] },
              },
            ],
          },
          orderBy: { id: "asc" },
          select: { id: true, subjectType: true, subjectId: true },
        })
      : [];
    const evidence = mapEvidence(evidenceRows);
    const profiles = rows
      .filter((row) => row.organizationId === context.organizationId)
      .map((row) => mapProfile(row, evidence));

    return Object.freeze({
      profiles: Object.freeze(profiles),
      diagnostics: Object.freeze({
        databaseQueries: evidenceQueryExecuted ? 2 : 1,
        authorizedRowsReturned: profiles.length,
        maximumRows: MAX_HISTORICAL_ROWS,
      }),
    });
  }
}
