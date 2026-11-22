import type { PrismaClient, Prisma } from "../../../.generated/prisma/client";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ClosedJobRecord,
  HomeDecisionSource,
  HomeDeskRepositoryPort,
} from "@/repositories/ports/home-desk-repository";
import type {
  EconomicsLineSnapshot,
  EconomicsProjectSnapshot,
  FinancialObservationRecord,
} from "@/modules/economics/domain/contracts";
import { PrismaProjectListRepository } from "./prisma-project-list-repository";

function readableIds(context: RuntimeContext, ids: readonly string[]) {
  const authorization = new AuthorizationService();
  return ids.filter((id) => authorization.canReadProject(context, id).allowed);
}

export class PrismaHomeDeskRepository implements HomeDeskRepositoryPort {
  constructor(private readonly database: PrismaClient) {}
  listReadableProjects(context: RuntimeContext) {
    return new PrismaProjectListRepository(this.database).listReadableProjects(context);
  }
  async listDecisionSources(
    context: RuntimeContext,
    projectIds: readonly string[],
    now: Date,
  ): Promise<readonly HomeDecisionSource[]> {
    const authorization = new AuthorizationService();
    const ids = readableIds(context, projectIds).filter(
      (id) => authorization.canCreateInternalReview(context, id).allowed,
    );
    const drafts =
      context.capabilities.has("quote:draft") && context.capabilities.has("quote:read")
        ? await this.database.project.findMany({
            where: {
              organizationId: context.organizationId,
              id: { in: readableIds(context, projectIds) },
              deletedAt: null,
              status: "ACTIVE",
              stage: { in: ["DISCOVERY", "DESIGN", "QUOTE_REVIEW"] },
              comparisonRuns: {
                some: { organizationId: context.organizationId, status: "COMPLETED" },
              },
              quotes: {
                none: {
                  organizationId: context.organizationId,
                  versions: { some: { organizationId: context.organizationId } },
                },
              },
            },
            select: { id: true, organizationId: true, businessKey: true },
            orderBy: { businessKey: "asc" },
          })
        : [];
    const sources: HomeDecisionSource[] = drafts.map((row) => ({
      kind: "DRAFT_QUOTE",
      organizationId: row.organizationId,
      projectId: row.id,
      key: `draft:${row.businessKey}`,
    }));
    const financialIds = readableIds(context, projectIds).filter(
      (id) => authorization.canReadCommercial(context, id, "QUOTE").allowed,
    );
    if (financialIds.length) {
      const versions = await this.database.quoteVersion.findMany({
        where: {
          organizationId: context.organizationId,
          supersededById: null,
          quote: {
            organizationId: context.organizationId,
            projectId: { in: financialIds },
            project: { deletedAt: null, status: "ACTIVE" },
          },
        },
        select: {
          id: true,
          organizationId: true,
          status: true,
          issuedAt: true,
          documentNumber: true,
          validUntil: true,
          quote: { select: { projectId: true } },
        },
        orderBy: [{ createdAt: "desc" }, { versionNumber: "desc" }, { id: "asc" }],
      });
      const current = new Set<string>();
      for (const version of versions) {
        const projectId = version.quote.projectId;
        if (
          !current.has(projectId) &&
          version.status === "DRAFT" &&
          context.capabilities.has("quote:issue")
        )
          sources.push({
            kind: "ISSUE_QUOTE",
            organizationId: version.organizationId,
            projectId,
            key: `issue:${version.id}`,
          });
        current.add(projectId);
        if (
          version.status === "ISSUED" &&
          version.issuedAt &&
          version.documentNumber &&
          version.validUntil
        )
          sources.push({
            kind: "AWAITING_CLIENT",
            organizationId: version.organizationId,
            projectId,
            key: `awaiting:${version.id}`,
            documentNumber: version.documentNumber,
            validUntil: version.validUntil.toISOString().slice(0, 10),
          });
      }
    }
    if (!ids.length) return sources;
    const rows = await this.database.proposedAction.findMany({
      where: {
        organizationId: context.organizationId,
        projectId: { in: ids },
        preparedByMembershipId: context.membershipId,
        status: "PREPARED",
        consumedAt: null,
        expiresAt: { gt: now },
        businessKey: { not: null },
        enrichmentRunId: { not: null },
        project: { organizationId: context.organizationId, deletedAt: null, status: "ACTIVE" },
      },
      select: {
        organizationId: true,
        projectId: true,
        preparedByMembershipId: true,
        businessKey: true,
        comparisonRunId: true,
        enrichmentRunId: true,
        expiresAt: true,
      },
      orderBy: { businessKey: "asc" },
    });
    return [
      ...sources,
      ...rows.flatMap((row) =>
        row.businessKey && row.enrichmentRunId && row.preparedByMembershipId && row.expiresAt
          ? [
              {
                kind: "PREPARED_REVIEW" as const,
                organizationId: row.organizationId,
                projectId: row.projectId,
                membershipId: row.preparedByMembershipId,
                key: row.businessKey,
                comparisonRunId: row.comparisonRunId,
                enrichmentRunId: row.enrichmentRunId,
                expiresAt: row.expiresAt.toISOString(),
              },
            ]
          : [],
      ),
    ];
  }
  async listComparedProjectIds(context: RuntimeContext, projectIds: readonly string[]) {
    if (!context.capabilities.has("project:compare")) return [];
    const ids = readableIds(context, projectIds);
    if (!ids.length) return [];
    const rows = await this.database.comparisonRun.findMany({
      where: {
        organizationId: context.organizationId,
        activeProjectId: { in: ids },
        status: "COMPLETED",
      },
      distinct: ["activeProjectId"],
      select: { activeProjectId: true },
    });
    return rows.map((row) => row.activeProjectId);
  }
  async listClosedJobs(
    context: RuntimeContext,
    projectIds: readonly string[],
  ): Promise<readonly ClosedJobRecord[]> {
    const ids = readableIds(context, projectIds);
    if (!ids.length) return [];
    const authorization = new AuthorizationService();
    return this.database.$transaction(
      async (tx) => {
        // Structural readers fetch names/eligibility, never amounts or commercial lines.
        const rows = await tx.project.findMany({
          where: {
            organizationId: context.organizationId,
            id: { in: ids },
            deletedAt: null,
            stage: "COMPLETE",
            status: { in: ["COMPLETED", "CLOSED"] },
            completedAt: { not: null },
            actualCosts: {
              some: {
                organizationId: context.organizationId,
                authorityState: "RECONCILED_ACTUAL",
                observationType: "RECONCILED_ACTUAL_COST",
                supersededById: null,
                reconciledAt: { not: null },
              },
            },
          },
          orderBy: [{ completedAt: "desc" }, { businessKey: "asc" }],
          take: 3,
          select: {
            id: true,
            organizationId: true,
            businessKey: true,
            nameEn: true,
            nameZhTw: true,
            status: true,
            stage: true,
            completedAt: true,
          },
        });
        const result: ClosedJobRecord[] = [];
        for (const row of rows) {
          const financial =
            authorization.canReadCommercial(context, row.id, "QUOTE").allowed &&
            authorization.canReadCommercial(context, row.id, "ACTUAL").allowed &&
            authorization.canReadEvidence(context, row.id).allowed;
          result.push({
            ...row,
            completedAt: row.completedAt!.toISOString(),
            ...(financial ? { financials: await readFinancials(tx, context, row.id) } : {}),
          });
        }
        return result;
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
}

async function readFinancials(
  tx: Prisma.TransactionClient,
  context: RuntimeContext,
  projectId: string,
) {
  const organizationId = context.organizationId;
  const project = await tx.project.findFirstOrThrow({
    where: { id: projectId, organizationId, deletedAt: null },
  });
  const quote = await tx.quoteVersion.findFirst({
    where: {
      organizationId,
      quote: { organizationId, projectId },
      supersededById: null,
      authorityState: "APPROVED_COMMERCIAL",
      observationType: "QUOTED_PRICE",
    },
    orderBy: [
      { approvedAt: { sort: "desc", nulls: "last" } },
      { versionNumber: "desc" },
      { id: "asc" },
    ],
    include: { items: { where: { organizationId }, orderBy: { lineNumber: "asc" } } },
  });
  const actual = await tx.projectCostVersion.findFirst({
    where: {
      organizationId,
      projectId,
      supersededById: null,
      authorityState: "RECONCILED_ACTUAL",
      observationType: "RECONCILED_ACTUAL_COST",
      reconciledAt: { not: null },
    },
    orderBy: [{ reconciledAt: "desc" }, { versionNumber: "desc" }, { id: "asc" }],
    include: { lines: { where: { organizationId }, orderBy: { lineNumber: "asc" } } },
  });
  const subjectIds = [
    quote?.id,
    actual?.id,
    ...(quote?.items.map((line) => line.id) ?? []),
    ...(actual?.lines.map((line) => line.id) ?? []),
  ].filter((id): id is string => !!id);
  const evidence = await tx.evidenceReference.findMany({
    where: {
      organizationId,
      subjectId: { in: subjectIds },
      subjectType: { in: ["QUOTE_VERSION", "QUOTE_ITEM", "PROJECT_COST_VERSION", "COST_LINE"] },
    },
    select: { id: true, subjectType: true, subjectId: true },
  });
  const conflicts = await tx.evidenceConflict.findMany({
    where: {
      organizationId,
      status: "OPEN",
      OR: [
        { primaryEvidenceId: { in: evidence.map((row) => row.id) } },
        { conflictingEvidenceId: { in: evidence.map((row) => row.id) } },
      ],
    },
    select: { id: true, primaryEvidenceId: true, conflictingEvidenceId: true },
  });
  const references = (subjectType: string, subjectId: string) =>
    evidence
      .filter((row) => row.subjectType === subjectType && row.subjectId === subjectId)
      .map((row) => row.id);
  const snapshot: EconomicsProjectSnapshot = {
    internalId: project.id,
    businessKey: project.businessKey,
    status: project.status,
    areaValue: project.areaQuantity.toString(),
    areaUnit: project.areaUnit,
    currency: project.currency,
    dataClassification: project.dataClassification,
    evidenceReferenceIds: [],
  };
  const mapRecord = (
    row: NonNullable<typeof quote> | NonNullable<typeof actual>,
    kind: "QUOTE_VERSION" | "PROJECT_COST_VERSION",
  ): FinancialObservationRecord => {
    const lines: EconomicsLineSnapshot[] =
      "items" in row
        ? row.items.map((line) => ({
            id: line.id,
            subjectType: "QUOTE_ITEM",
            lineNumber: line.lineNumber,
            categoryId: line.categoryId,
            amount: line.amount.toString(),
            quantity: line.quantity.toString(),
            unitRate: line.unitPrice.toString(),
            unit: line.unit,
            authorityState: line.authorityState,
            evidenceReferenceIds: references("QUOTE_ITEM", line.id),
          }))
        : row.lines.map((line) => ({
            id: line.id,
            subjectType: "COST_LINE",
            lineNumber: line.lineNumber,
            categoryId: line.categoryId,
            amount: line.amount.toString(),
            quantity: line.quantity.toString(),
            unitRate: line.unitCost.toString(),
            unit: line.unit,
            authorityState: line.authorityState,
            evidenceReferenceIds: references("COST_LINE", line.id),
          }));
    const evidenceReferenceIds = references(kind, row.id);
    const allIds = [...evidenceReferenceIds, ...lines.flatMap((line) => line.evidenceReferenceIds)];
    return {
      id: row.id,
      projectId,
      projectKey: project.businessKey,
      recordKey: row.id,
      versionNumber: row.versionNumber,
      subjectType: kind,
      observationType: row.observationType,
      authorityState: row.authorityState,
      currency: row.currency,
      totalAmount: ("amountBeforeTax" in row
        ? row.amountBeforeTax
        : row.totalDirectCost
      ).toString(),
      conflictIds: conflicts
        .filter(
          (conflict) =>
            allIds.includes(conflict.primaryEvidenceId) ||
            allIds.includes(conflict.conflictingEvidenceId),
        )
        .map((conflict) => conflict.id),
      evidenceReferenceIds,
      dataClassification: project.dataClassification,
      lines,
    };
  };
  return {
    project: snapshot,
    quote: quote ? mapRecord(quote, "QUOTE_VERSION") : null,
    actual: actual ? mapRecord(actual, "PROJECT_COST_VERSION") : null,
  };
}
