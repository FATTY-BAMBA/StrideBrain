import type { AuthorityState, ObservationType } from "@/modules/projects/domain/project-workspace";
import type {
  CurrentActualRecord,
  CurrentForecastRecord,
  CurrentQuoteRecord,
  EvidenceAccessLevel,
  ProjectActionRecord,
  ProjectEvidenceConflictRecord,
  ProjectEvidenceRecord,
  ProjectSupplierOfferRecord,
  ProjectWorkspaceBaseRecord,
  ProjectWorkspaceRepositoryPort,
} from "@/repositories/ports/project-workspace-repository";

type DecimalLike = { toString(): string } | string;

type ProjectContextRow = {
  id: string;
  organizationId: string;
  businessKey: string;
  nameEn: string;
  nameZhTw: string;
  status: string;
  stage: string;
  comparisonClass: string;
  subtype: string;
  locationCity: string;
  locationDistrict: string | null;
  areaQuantity: DecimalLike;
  areaUnit: string;
  currency: string;
  programmeWeeks: DecimalLike | null;
  targetCompletionAt: Date | null;
  metadataAuthority: AuthorityState;
  dataClassification: string;
  client: {
    businessKey: string;
    nameEn: string;
    nameZhTw: string;
  };
  assignments: Array<{
    membership: {
      person: {
        businessKey: string;
        nameEn: string;
        nameZhTw: string;
      };
    };
  }>;
  scopes: Array<{
    categoryId: string;
    labelEn: string;
    labelZhTw: string;
    sourceState: AuthorityState;
  }>;
  projectSuppliers: Array<{
    relationship: string;
    supplier: {
      businessKey: string;
      nameEn: string;
      nameZhTw: string;
      categoryId: string;
    };
  }>;
  projectMaterials: Array<{
    relationship: string;
    material: {
      businessKey: string;
      nameEn: string;
      nameZhTw: string;
      categoryId: string;
    };
  }>;
};

type QuoteVersionRow = {
  id: string;
  versionNumber: number;
  status: string;
  observationType: "QUOTED_PRICE";
  authorityState: AuthorityState;
  currency: string;
  amountBeforeTax: DecimalLike;
  validUntil: Date | null;
  approvedAt: Date | null;
  quote: { businessKey: string };
};

type ForecastVersionRow = {
  id: string;
  versionNumber: number;
  observationType: "FORECAST_DIRECT_COST";
  authorityState: AuthorityState;
  currency: string;
  totalDirectCost: DecimalLike;
  effectiveAt: Date;
};

type ActualVersionRow = {
  id: string;
  versionNumber: number;
  observationType: "RECONCILED_ACTUAL_COST";
  authorityState: AuthorityState;
  currency: string;
  totalDirectCost: DecimalLike;
  reconciledAt: Date | null;
};

type EvidenceRow = {
  id: string;
  subjectType: string;
  subjectId: string;
  claimKey: string;
  authorityState: AuthorityState;
  observationType: ObservationType | null;
  dataClassification: string;
  effectiveAt: Date | null;
  staleAt: Date | null;
  documentVersion: {
    versionLabel: string;
    authorityState: AuthorityState;
    document: {
      businessKey: string;
      titleEn: string;
      titleZhTw: string;
      documentType: string;
    };
  } | null;
};

type EvidenceConflictRow = {
  conflictKey: string;
  primaryEvidenceId: string;
  conflictingEvidenceId: string;
};

type SupplierOfferRow = {
  businessKey: string;
  authorityState: AuthorityState;
  observationType: "SUPPLIER_OFFER";
  currency: string;
  amountBeforeTax: DecimalLike;
  offeredAt: Date;
  validUntil: Date | null;
  supplier: {
    businessKey: string;
    nameEn: string;
    nameZhTw: string;
  };
};

type ActionRow = {
  id: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate: Date | null;
};

export type PrismaProjectWorkspaceDatabase = {
  project: {
    findFirst(args: unknown): Promise<ProjectContextRow | null>;
  };
  quoteVersion: {
    findFirst(args: unknown): Promise<QuoteVersionRow | null>;
  };
  forecastCostVersion: {
    findFirst(args: unknown): Promise<ForecastVersionRow | null>;
  };
  projectCostVersion: {
    findFirst(args: unknown): Promise<ActualVersionRow | null>;
  };
  evidenceReference: {
    findMany(args: unknown): Promise<EvidenceRow[]>;
  };
  evidenceConflict: {
    findMany(args: unknown): Promise<EvidenceConflictRow[]>;
  };
  supplierOffer: {
    findMany(args: unknown): Promise<SupplierOfferRow[]>;
  };
  action: {
    findMany(args: unknown): Promise<ActionRow[]>;
  };
};

function decimalString(value: DecimalLike): string {
  return value.toString();
}

function evidenceClassifications(access: EvidenceAccessLevel): readonly string[] {
  if (access === "AUTHORIZED") {
    return [
      "DEMO_SYNTHETIC",
      "PUBLIC_REFERENCE",
      "TENANT_PRIVATE",
      "TENANT_RESTRICTED",
      "TENANT_APPROVED",
    ];
  }
  return ["DEMO_SYNTHETIC", "PUBLIC_REFERENCE", "TENANT_APPROVED"];
}

/**
 * Stage 3 read adapter.
 *
 * Every query receives both `organizationId` and `projectId`; a business key,
 * URL parameter, model argument, or subject ID can never select a tenant by
 * itself. The adapter returns bounded records, never raw Prisma models.
 */
export class PrismaProjectWorkspaceRepository implements ProjectWorkspaceRepositoryPort {
  constructor(private readonly database: PrismaProjectWorkspaceDatabase) {}

  async getProjectContext(
    organizationId: string,
    projectId: string,
  ): Promise<ProjectWorkspaceBaseRecord | null> {
    const row = await this.database.project.findFirst({
      where: { id: projectId, organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        businessKey: true,
        nameEn: true,
        nameZhTw: true,
        status: true,
        stage: true,
        comparisonClass: true,
        subtype: true,
        locationCity: true,
        locationDistrict: true,
        areaQuantity: true,
        areaUnit: true,
        currency: true,
        programmeWeeks: true,
        targetCompletionAt: true,
        metadataAuthority: true,
        dataClassification: true,
        client: { select: { businessKey: true, nameEn: true, nameZhTw: true } },
        assignments: {
          where: {
            organizationId,
            membership: {
              active: true,
              role: "PROJECT_MANAGER_ESTIMATOR",
              person: { active: true, organizationId },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            membership: {
              select: {
                person: {
                  select: { businessKey: true, nameEn: true, nameZhTw: true },
                },
              },
            },
          },
        },
        scopes: {
          where: { organizationId },
          orderBy: { categoryId: "asc" },
          select: {
            categoryId: true,
            labelEn: true,
            labelZhTw: true,
            sourceState: true,
          },
        },
        projectSuppliers: {
          where: { organizationId },
          orderBy: { supplier: { businessKey: "asc" } },
          select: {
            relationship: true,
            supplier: {
              select: {
                businessKey: true,
                nameEn: true,
                nameZhTw: true,
                categoryId: true,
              },
            },
          },
        },
        projectMaterials: {
          where: { organizationId },
          orderBy: { material: { businessKey: "asc" } },
          select: {
            relationship: true,
            material: {
              select: {
                businessKey: true,
                nameEn: true,
                nameZhTw: true,
                categoryId: true,
              },
            },
          },
        },
      },
    });

    if (!row || row.organizationId !== organizationId) return null;
    const manager = row.assignments[0]?.membership.person ?? null;
    return Object.freeze({
      id: row.id,
      organizationId: row.organizationId,
      businessKey: row.businessKey,
      nameEn: row.nameEn,
      nameZhTw: row.nameZhTw,
      status: row.status,
      stage: row.stage,
      comparisonClass: row.comparisonClass,
      subtype: row.subtype,
      locationCity: row.locationCity,
      locationDistrict: row.locationDistrict,
      areaQuantity: decimalString(row.areaQuantity),
      areaUnit: row.areaUnit,
      currency: row.currency,
      programmeWeeks: row.programmeWeeks ? decimalString(row.programmeWeeks) : null,
      targetCompletionAt: row.targetCompletionAt,
      metadataAuthority: row.metadataAuthority,
      dataClassification: row.dataClassification,
      client: Object.freeze(row.client),
      manager: manager ? Object.freeze(manager) : null,
      scopes: Object.freeze(
        row.scopes.map((scope) =>
          Object.freeze({
            categoryId: scope.categoryId,
            labelEn: scope.labelEn,
            labelZhTw: scope.labelZhTw,
            authorityState: scope.sourceState,
          }),
        ),
      ),
      suppliers: Object.freeze(
        row.projectSuppliers.map((item) =>
          Object.freeze({
            businessKey: item.supplier.businessKey,
            nameEn: item.supplier.nameEn,
            nameZhTw: item.supplier.nameZhTw,
            categoryId: item.supplier.categoryId,
            relationship: item.relationship,
          }),
        ),
      ),
      materials: Object.freeze(
        row.projectMaterials.map((item) =>
          Object.freeze({
            businessKey: item.material.businessKey,
            nameEn: item.material.nameEn,
            nameZhTw: item.material.nameZhTw,
            categoryId: item.material.categoryId,
            relationship: item.relationship,
          }),
        ),
      ),
    });
  }

  async getCurrentQuote(
    organizationId: string,
    projectId: string,
  ): Promise<CurrentQuoteRecord | null> {
    const row = await this.database.quoteVersion.findFirst({
      where: {
        organizationId,
        quote: { organizationId, projectId },
        supersededById: null,
        authorityState: { not: "SUPERSEDED" },
      },
      orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        versionNumber: true,
        status: true,
        observationType: true,
        authorityState: true,
        currency: true,
        amountBeforeTax: true,
        validUntil: true,
        approvedAt: true,
        quote: { select: { businessKey: true } },
      },
    });
    if (!row) return null;
    return Object.freeze({
      quoteBusinessKey: row.quote.businessKey,
      versionId: row.id,
      versionNumber: row.versionNumber,
      status: row.status,
      observationType: row.observationType,
      authorityState: row.authorityState,
      currency: row.currency,
      amountBeforeTax: decimalString(row.amountBeforeTax),
      validUntil: row.validUntil,
      approvedAt: row.approvedAt,
    });
  }

  async getCurrentForecast(
    organizationId: string,
    projectId: string,
  ): Promise<CurrentForecastRecord | null> {
    const row = await this.database.forecastCostVersion.findFirst({
      where: {
        organizationId,
        projectId,
        supersededById: null,
        authorityState: { not: "SUPERSEDED" },
      },
      orderBy: [{ versionNumber: "desc" }, { effectiveAt: "desc" }],
      select: {
        id: true,
        versionNumber: true,
        observationType: true,
        authorityState: true,
        currency: true,
        totalDirectCost: true,
        effectiveAt: true,
      },
    });
    if (!row) return null;
    return Object.freeze({
      versionId: row.id,
      versionNumber: row.versionNumber,
      observationType: row.observationType,
      authorityState: row.authorityState,
      currency: row.currency,
      totalDirectCost: decimalString(row.totalDirectCost),
      effectiveAt: row.effectiveAt,
    });
  }

  async getCurrentActual(
    organizationId: string,
    projectId: string,
  ): Promise<CurrentActualRecord | null> {
    const row = await this.database.projectCostVersion.findFirst({
      where: {
        organizationId,
        projectId,
        supersededById: null,
        authorityState: { in: ["RECONCILED_ACTUAL", "CONFLICTED"] },
      },
      orderBy: [{ versionNumber: "desc" }, { reconciledAt: "desc" }],
      select: {
        id: true,
        versionNumber: true,
        observationType: true,
        authorityState: true,
        currency: true,
        totalDirectCost: true,
        reconciledAt: true,
      },
    });
    if (!row) return null;
    return Object.freeze({
      versionId: row.id,
      versionNumber: row.versionNumber,
      observationType: row.observationType,
      authorityState: row.authorityState,
      currency: row.currency,
      totalDirectCost: decimalString(row.totalDirectCost),
      reconciledAt: row.reconciledAt,
    });
  }

  async listEvidence(
    organizationId: string,
    projectId: string,
    access: EvidenceAccessLevel,
  ): Promise<readonly ProjectEvidenceRecord[]> {
    const rows = await this.database.evidenceReference.findMany({
      where: {
        organizationId,
        dataClassification: { in: evidenceClassifications(access) },
        OR: [
          { subjectType: "PROJECT", subjectId: projectId },
          {
            documentVersion: {
              document: { organizationId, projectId },
            },
          },
        ],
      },
      orderBy: [{ effectiveAt: "desc" }, { id: "asc" }],
      take: 100,
      select: {
        id: true,
        subjectType: true,
        subjectId: true,
        claimKey: true,
        authorityState: true,
        observationType: true,
        dataClassification: true,
        effectiveAt: true,
        staleAt: true,
        documentVersion: {
          select: {
            versionLabel: true,
            authorityState: true,
            document: {
              select: {
                businessKey: true,
                titleEn: true,
                titleZhTw: true,
                documentType: true,
              },
            },
          },
        },
      },
    });
    return Object.freeze(
      rows.map((row) =>
        Object.freeze({
          evidenceReferenceId: row.id,
          subjectType: row.subjectType,
          subjectId: row.subjectId,
          claimKey: row.claimKey,
          authorityState: row.authorityState,
          observationType: row.observationType,
          dataClassification: row.dataClassification,
          effectiveAt: row.effectiveAt,
          staleAt: row.staleAt,
          document: row.documentVersion
            ? Object.freeze({
                businessKey: row.documentVersion.document.businessKey,
                titleEn: row.documentVersion.document.titleEn,
                titleZhTw: row.documentVersion.document.titleZhTw,
                documentType: row.documentVersion.document.documentType,
                versionLabel: row.documentVersion.versionLabel,
                versionAuthorityState: row.documentVersion.authorityState,
              })
            : null,
        }),
      ),
    );
  }

  async listOpenEvidenceConflicts(
    organizationId: string,
    evidenceReferenceIds: readonly string[],
  ): Promise<readonly ProjectEvidenceConflictRecord[]> {
    if (evidenceReferenceIds.length === 0) return Object.freeze([]);
    const rows = await this.database.evidenceConflict.findMany({
      where: {
        organizationId,
        status: "OPEN",
        OR: [
          { primaryEvidenceId: { in: [...evidenceReferenceIds] } },
          { conflictingEvidenceId: { in: [...evidenceReferenceIds] } },
        ],
        primaryEvidence: { organizationId },
        conflictingEvidence: { organizationId },
      },
      orderBy: { conflictKey: "asc" },
      take: 50,
      select: {
        conflictKey: true,
        primaryEvidenceId: true,
        conflictingEvidenceId: true,
      },
    });
    return Object.freeze(rows.map((row) => Object.freeze(row)));
  }

  async listSupplierOffers(
    organizationId: string,
    projectId: string,
  ): Promise<readonly ProjectSupplierOfferRecord[]> {
    const rows = await this.database.supplierOffer.findMany({
      where: {
        organizationId,
        projectId,
        authorityState: { not: "SUPERSEDED" },
      },
      orderBy: [{ offeredAt: "desc" }, { businessKey: "asc" }],
      take: 25,
      select: {
        businessKey: true,
        authorityState: true,
        observationType: true,
        currency: true,
        amountBeforeTax: true,
        offeredAt: true,
        validUntil: true,
        supplier: {
          select: { businessKey: true, nameEn: true, nameZhTw: true },
        },
      },
    });
    return Object.freeze(
      rows.map((row) =>
        Object.freeze({
          businessKey: row.businessKey,
          authorityState: row.authorityState,
          observationType: row.observationType,
          currency: row.currency,
          amountBeforeTax: decimalString(row.amountBeforeTax),
          offeredAt: row.offeredAt,
          validUntil: row.validUntil,
          supplier: Object.freeze(row.supplier),
        }),
      ),
    );
  }

  async listOpenActions(
    organizationId: string,
    projectId: string,
  ): Promise<readonly ProjectActionRecord[]> {
    const rows = await this.database.action.findMany({
      where: {
        organizationId,
        projectId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 25,
      select: { id: true, title: true, status: true, dueDate: true },
    });
    return Object.freeze(rows.map((row) => Object.freeze(row)));
  }
}
