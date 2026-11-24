import { PrismaFirmListsRepository } from "./prisma-firm-lists-repository";
import { orderQuoteLines } from "@/modules/quote-draft/domain/quote-line-order";
import { categoryLabel } from "@/modules/localization/jobs";
import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "../../../.generated/prisma/client";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { ActiveProjectContextService } from "@/modules/comparisons/application/active-project-context-service";
import { GetHomeComparison } from "@/modules/home-intelligence/application/get-home-comparison";
import { QUOTE_DRAFT_POLICY_VERSION } from "@/modules/quote-draft/domain/draft-policy";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  DraftAuditReceipt,
  DraftReceipt,
  QuoteDraftJob,
  QuoteDraftRepositoryPort,
  QuoteDraftSessionPort,
  RecordedDraftBasis,
  SavedDraft,
} from "@/repositories/ports/quote-draft-repository";
import { PrismaProjectRepository, type PrismaProjectReader } from "./prisma-project-repository";
import {
  PrismaComparableProjectRepository,
  type PrismaComparableProjectDatabase,
} from "./prisma-comparable-project-repository";
import {
  PrismaComparisonRunRepository,
  type PrismaComparisonRunDatabase,
} from "./prisma-comparison-run-repository";
import {
  PrismaLatestProjectComparisonRepository,
  type PrismaLatestProjectComparisonDatabase,
} from "./prisma-latest-project-comparison-repository";
import {
  PrismaEconomicsEnrichmentRunRepository,
  type PrismaEconomicsEnrichmentDatabase,
} from "./prisma-economics-enrichment-run-repository";
import {
  PrismaEconomicsObservationRepository,
  type PrismaEconomicsObservationDatabase,
} from "./prisma-economics-observation-repository";
import {
  PrismaEvidencePanelRepository,
  type PrismaEvidencePanelDatabase,
} from "./prisma-evidence-panel-repository";

const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export class PrismaQuoteDraftSession implements QuoteDraftSessionPort {
  private readonly auth = new AuthorizationService();
  constructor(protected readonly tx: Prisma.TransactionClient) {}
  async getJob(context: RuntimeContext, projectKey: string): Promise<QuoteDraftJob | null> {
    if (!context.capabilities.has("project:read")) return null;
    const organizationId = context.organizationId;
    const member = await this.tx.membership.findFirst({
      where: { id: context.membershipId, organizationId, active: true },
      select: { id: true },
    });
    if (!member) return null;
    const row = await this.tx.project.findFirst({
      where: {
        organizationId,
        businessKey: projectKey,
        deletedAt: null,
        ...(context.role === "ORGANIZATION_ADMIN"
          ? {}
          : { assignments: { some: { organizationId, membershipId: context.membershipId } } }),
      },
      select: {
        id: true,
        organizationId: true,
        businessKey: true,
        nameEn: true,
        nameZhTw: true,
        stage: true,
        areaQuantity: true,
        areaUnit: true,
        currency: true,
        commercialCategoryIds: true,
        scopes: {
          where: { organizationId },
          orderBy: { categoryId: "asc" },
          select: { categoryId: true },
        },
      },
    });
    if (!row || !this.auth.canReadProject(context, row.id).allowed) return null;
    const catalog = await new PrismaFirmListsRepository(this.tx).read(context);
    if (!catalog) return null;
    return {
      catalog,
      id: row.id,
      organizationId: row.organizationId,
      businessKey: row.businessKey,
      name: context.locale === "zh-TW" ? row.nameZhTw : row.nameEn,
      stage: row.stage,
      area: row.areaQuantity.toFixed(3),
      areaUnit: row.areaUnit,
      currency: row.currency,
      commercialCategoryIds: row.commercialCategoryIds,
      scopeCategoryIds: row.scopes.map((scope) => scope.categoryId),
    };
  }
  getStoredComparison: QuoteDraftSessionPort["getStoredComparison"] = (context, id) =>
    new PrismaComparisonRunRepository(
      this.tx as unknown as PrismaComparisonRunDatabase,
    ).getAuthorizedResult(context, id);
  getConflict: QuoteDraftSessionPort["getConflict"] = (context, id, key) =>
    new PrismaEvidencePanelRepository(
      this.tx as unknown as PrismaEvidencePanelDatabase,
    ).getAuthorizedConflict(context, id, key);
  getComparison(context: RuntimeContext, job: QuoteDraftJob) {
    const projects = new PrismaProjectRepository(this.tx as unknown as PrismaProjectReader);
    return new GetHomeComparison(
      projects,
      new PrismaLatestProjectComparisonRepository(
        this.tx as unknown as PrismaLatestProjectComparisonDatabase,
      ),
      new PrismaComparisonRunRepository(this.tx as unknown as PrismaComparisonRunDatabase),
      new PrismaEconomicsEnrichmentRunRepository(
        this.tx as unknown as PrismaEconomicsEnrichmentDatabase,
      ),
      new ActiveProjectContextService(
        new PrismaComparableProjectRepository(
          this.tx as unknown as PrismaComparableProjectDatabase,
        ),
      ),
    ).execute(context, job.businessKey);
  }
  loadBatch: QuoteDraftSessionPort["loadBatch"] = (context, result) =>
    new PrismaEconomicsObservationRepository(
      this.tx as unknown as PrismaEconomicsObservationDatabase,
    ).loadAuthorizedBatch(
      context,
      result.comparison.run.id,
      result.comparison,
      result.economics?.selectedProjectKeys,
    );
  getSources: QuoteDraftSessionPort["getSources"] = (context, runId, ids) =>
    new PrismaEvidencePanelRepository(
      this.tx as unknown as PrismaEvidencePanelDatabase,
    ).getAuthorizedSources(context, runId, ids);
  async getSaved(context: RuntimeContext, job: QuoteDraftJob): Promise<SavedDraft | null> {
    if (
      job.organizationId !== context.organizationId ||
      !this.auth.canReadCommercial(context, job.id, "QUOTE").allowed
    )
      return null;
    const organizationId = context.organizationId;
    const row = await this.tx.quoteVersion.findFirst({
      where: { organizationId, supersededById: null, quote: { organizationId, projectId: job.id } },
      orderBy: [{ createdAt: "desc" }, { versionNumber: "desc" }, { id: "asc" }],
      include: { items: { where: { organizationId }, orderBy: { lineNumber: "asc" } } },
    });
    if (!row) return null;
    const references = await this.tx.evidenceReference.findMany({
      where: {
        organizationId,
        subjectType: "QUOTE_ITEM",
        subjectId: { in: row.items.map((line) => line.id) },
        claimKey: "quote-draft:line",
      },
      select: { subjectId: true, supportedValue: true },
    });
    return {
      id: row.id,
      quoteId: row.quoteId,
      versionNumber: row.versionNumber,
      status: row.status,
      currency: row.currency,
      totals: {
        amountBeforeTax: row.amountBeforeTax.toFixed(2),
        taxAmount: row.taxAmount.toFixed(2),
        totalAmount: row.totalAmount.toFixed(2),
      },
      lines: row.items.map((line) => {
        const provenance = object(
          object(references.find((entry) => entry.subjectId === line.id)?.supportedValue)
            .quoteDraft,
        );
        const recorded = object(provenance.recorded);
        return {
          id: line.id,
          categoryId: line.categoryId,
          unit: line.unit,
          description: context.locale === "zh-TW" ? line.descriptionZhTw : line.descriptionEn,
          amount: line.amount.toFixed(2),
          recorded:
            object(recorded.basis).policyVersion === QUOTE_DRAFT_POLICY_VERSION &&
            typeof recorded.comparisonRunId === "string"
              ? (recorded as RecordedDraftBasis)
              : null,
          enteredBy: typeof provenance.enteredBy === "string" ? provenance.enteredBy : null,
        };
      }),
    };
  }
  async findReceipt(
    context: RuntimeContext,
    idempotencyKey: string,
  ): Promise<DraftAuditReceipt | null> {
    if (!context.capabilities.has("quote:draft")) return null;
    const audit = await this.tx.auditEvent.findUnique({
      where: {
        organizationId_idempotencyKey: { organizationId: context.organizationId, idempotencyKey },
      },
    });
    if (!audit) return null;
    const payload = object(audit.payload);
    return {
      actorMembershipId: audit.actorMembershipId,
      fingerprint: audit.eventType === "QUOTE_DRAFT_SAVED" ? String(payload.fingerprint) : "",
      projectId: String(payload.projectId),
      receipt: payload.receipt as DraftReceipt,
    };
  }
  persist: QuoteDraftSessionPort["persist"] = async (context, job, input, data) => {
    if (
      job.organizationId !== context.organizationId ||
      !context.capabilities.has("quote:draft") ||
      !this.auth.canReadCommercial(context, job.id, "QUOTE").allowed
    )
      throw new Error("QUOTE_DRAFT_UNAVAILABLE");
    const organizationId = context.organizationId;
    let quoteId = data.previous?.quoteId;
    if (!quoteId) {
      const existing = await this.tx.quote.findFirst({
        where: { organizationId, projectId: job.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      quoteId = existing?.id;
    }
    if (!quoteId) {
      quoteId = randomUUID();
      await this.tx.quote.create({
        data: { id: quoteId, organizationId, projectId: job.id, businessKey: `quote-${quoteId}` },
      });
    }
    const latest = await this.tx.quoteVersion.findFirst({
      where: { organizationId, quoteId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    const versionId = randomUUID(),
      versionNumber = (latest?.versionNumber ?? 0) + 1;
    await this.tx.quoteVersion.create({
      data: {
        id: versionId,
        organizationId,
        quoteId,
        versionNumber,
        status: "DRAFT",
        authorityState: "HUMAN_REVIEWED",
        currency: job.currency,
        ...data.totals,
      },
    });
    const changedLineIds: string[] = [];
    for (const [index, line] of orderQuoteLines(data.lines, job.catalog.workCategories).entries()) {
      const lineId = randomUUID();
      const old = data.previous?.lines.find((entry) => entry.categoryId === line.categoryId);
      const oldItem = old
        ? await this.tx.quoteItem.findFirst({
            where: { id: old.id, organizationId, quoteVersionId: data.previous!.id },
            select: { descriptionEn: true, descriptionZhTw: true },
          })
        : null;
      await this.tx.quoteItem.create({
        data: {
          id: lineId,
          organizationId,
          quoteVersionId: versionId,
          lineNumber: index + 1,
          categoryId: line.categoryId,
          descriptionEn:
            context.locale === "en"
              ? line.description
              : (oldItem?.descriptionEn ??
                categoryLabel("en", line.categoryId, job.catalog.workCategories)),
          descriptionZhTw:
            context.locale === "zh-TW"
              ? line.description
              : (oldItem?.descriptionZhTw ??
                categoryLabel("zh-TW", line.categoryId, job.catalog.workCategories)),
          amount: line.amount,
          quantity: "1",
          unit: line.unit!,
          unitPrice: line.amount,
          authorityState: "HUMAN_REVIEWED",
        },
      });
      await this.tx.evidenceReference.create({
        data: {
          id: randomUUID(),
          organizationId,
          subjectType: "QUOTE_ITEM",
          subjectId: lineId,
          claimKey: "quote-draft:line",
          locator: { kind: "structured-line", lineNumber: index + 1 },
          supportedValue: json({
            amount: line.amount,
            currency: job.currency,
            quoteDraft: { recorded: line.recorded, enteredBy: line.enteredBy },
          }),
          authorityState: "HUMAN_REVIEWED",
          observationType: "QUOTED_PRICE",
          dataClassification: context.dataMode,
          effectiveAt: new Date(),
        },
      });
      if (data.changedCategories.includes(line.categoryId)) changedLineIds.push(lineId);
    }
    if (data.previous)
      await this.tx.quoteVersion.updateMany({
        where: {
          id: data.previous.id,
          organizationId,
          quoteId,
          status: "DRAFT",
          supersededById: null,
        },
        data: { supersededById: versionId, authorityState: "SUPERSEDED" },
      });
    const receipt: DraftReceipt = {
      kind: "SAVED",
      versionId,
      versionNumber,
      totals: data.totals,
      firstSave: !data.previous,
    };
    const comparisonRunIds = [
      ...new Set(
        data.lines.flatMap((line) => (line.recorded ? [line.recorded.comparisonRunId] : [])),
      ),
    ];
    await this.tx.auditEvent.create({
      data: {
        id: randomUUID(),
        organizationId,
        actorMembershipId: context.membershipId,
        comparisonRunId: comparisonRunIds[0] ?? null,
        eventType: "QUOTE_DRAFT_SAVED",
        requestId: context.requestId,
        idempotencyKey: input.idempotencyKey,
        result: "SAVED",
        payload: json({
          projectId: job.id,
          fingerprint: data.fingerprint,
          receipt,
          policyVersion: QUOTE_DRAFT_POLICY_VERSION,
          comparisonRunIds,
          basisMode: data.basisMode,
          changedLineIds,
          changedCategoryIds: data.changedCategories,
        }),
      },
    });
    return receipt;
  };
}
export class PrismaQuoteDraftRepository implements QuoteDraftRepositoryPort {
  constructor(private readonly database: PrismaClient) {}
  async transaction<T>(work: (session: QuoteDraftSessionPort) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.database.$transaction((tx) => work(new PrismaQuoteDraftSession(tx)), {
          isolationLevel: "Serializable",
          timeout: 15_000,
        });
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error ? String(error.code) : "";
        if (attempt >= 2 || !["P2034", "P2002"].includes(code)) throw error;
      }
    }
  }
}
