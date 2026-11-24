import { PrismaFirmListsRepository } from "./prisma-firm-lists-repository";
import { orderQuoteLines } from "@/modules/quote-draft/domain/quote-line-order";
import { categoryLabel } from "@/modules/localization/jobs";
import { storedQuoteDocument, type ComputedQuoteLine } from "@/modules/finance/quote-totals";
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
  private readonly sourceReads = new WeakMap<
    RuntimeContext,
    Map<string, ReturnType<QuoteDraftSessionPort["getSources"]>>
  >();
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
        siteAddress: true,
        organization: {
          select: {
            nameEn: true,
            nameZhTw: true,
            quoteDocumentDetails: { select: { legalNameEn: true, legalNameZhTw: true } },
          },
        },
        client: { select: { organizationId: true, nameEn: true, nameZhTw: true } },
        clientId: true,
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
    if (
      !row ||
      row.client.organizationId !== organizationId ||
      !this.auth.canReadProject(context, row.id).allowed
    )
      return null;
    const catalog = await new PrismaFirmListsRepository(this.tx).read(context);
    if (!catalog) return null;
    const details = context.capabilities.has("client:read")
      ? await this.tx.client.findFirst({
          where: { id: row.clientId, organizationId },
          select: { contactPerson: true, address: true, taxId: true },
        })
      : null;
    const zh = context.locale === "zh-TW";
    return {
      catalog,
      id: row.id,
      organizationId: row.organizationId,
      businessKey: row.businessKey,
      name: context.locale === "zh-TW" ? row.nameZhTw : row.nameEn,
      stage: row.stage,
      siteAddress: row.siteAddress ?? "",
      header: {
        firmName:
          (zh
            ? row.organization.quoteDocumentDetails?.legalNameZhTw
            : row.organization.quoteDocumentDetails?.legalNameEn) ||
          (zh ? row.organization.nameZhTw : row.organization.nameEn),
        clientName: zh ? row.client.nameZhTw : row.client.nameEn,
        ...(details
          ? {
              contactPerson: details.contactPerson,
              clientAddress: details.address,
              clientTaxId: details.taxId,
            }
          : {}),
      },
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
  getSources: QuoteDraftSessionPort["getSources"] = (context, runId, ids) => {
    // Shared category references are read once per trusted actor in this transaction.
    let reads = this.sourceReads.get(context);
    if (!reads) {
      reads = new Map();
      this.sourceReads.set(context, reads);
    }
    const key = JSON.stringify([runId, [...ids].sort()]);
    const previous = reads.get(key);
    if (previous) return previous;
    const result = new PrismaEvidencePanelRepository(
      this.tx as unknown as PrismaEvidencePanelDatabase,
    ).getAuthorizedSources(context, runId, ids);
    reads.set(key, result);
    return result;
  };
  async getStructure(context: RuntimeContext, job: QuoteDraftJob) {
    if (
      job.organizationId !== context.organizationId ||
      !this.auth.canReadProject(context, job.id).allowed
    )
      return null;
    const organizationId = context.organizationId;
    const row = await this.tx.quoteVersion.findFirst({
      where: { organizationId, supersededById: null, quote: { organizationId, projectId: job.id } },
      orderBy: [{ createdAt: "desc" }, { versionNumber: "desc" }, { id: "asc" }],
      select: {
        versionNumber: true,
        status: true,
        documentFormatVersion: true,
        sections: {
          where: { organizationId },
          orderBy: { position: "asc" },
          select: { id: true, title: true, categoryId: true },
        },
        items: {
          where: { organizationId },
          orderBy: { lineNumber: "asc" },
          select: {
            sectionId: true,
            categoryId: true,
            description: true,
            descriptionEn: true,
            descriptionZhTw: true,
            kind: true,
            quantity: true,
            unit: true,
            remark: true,
          },
        },
      },
    });
    if (!row) return null;
    const mapLine = (line: (typeof row.items)[number]) => ({
      kind: line.kind,
      description:
        line.description ??
        (context.locale === "zh-TW" ? line.descriptionZhTw : line.descriptionEn),
      ...(line.kind === "ITEM"
        ? {
            quantity: row.documentFormatVersion === 1 ? "1.00" : line.quantity.toFixed(2),
            unit: row.documentFormatVersion === 1 ? "式" : line.unit,
          }
        : {}),
      remark: line.remark,
    });
    return {
      versionNumber: row.versionNumber,
      status: row.status,
      sections:
        row.documentFormatVersion === 2
          ? row.sections.map((section) => ({
              title: section.title,
              categoryId: section.categoryId,
              lines: row.items.filter((line) => line.sectionId === section.id).map(mapLine),
            }))
          : [...new Set(row.items.map((line) => line.categoryId))].map((categoryId) => ({
              title: categoryId
                ? categoryLabel(context.locale, categoryId, job.catalog.workCategories)
                : "",
              categoryId,
              lines: row.items.filter((line) => line.categoryId === categoryId).map(mapLine),
            })),
    };
  }
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
      include: {
        items: { where: { organizationId }, orderBy: { lineNumber: "asc" } },
        sections: { where: { organizationId }, orderBy: { position: "asc" } },
      },
    });
    if (!row) return null;
    const totals = {
      amountBeforeTax: row.amountBeforeTax.toFixed(2),
      taxAmount: row.taxAmount.toFixed(2),
      totalAmount: row.totalAmount.toFixed(2),
    };
    const description = (line: (typeof row.items)[number]) =>
      line.description ?? (context.locale === "zh-TW" ? line.descriptionZhTw : line.descriptionEn);
    const storedLine = (line: (typeof row.items)[number]): ComputedQuoteLine => {
      const common = { id: line.id, description: description(line) };
      if (line.kind === "NOTE") return { ...common, kind: "NOTE", amount: null };
      if (line.kind === "PERCENTAGE")
        return {
          ...common,
          kind: "PERCENTAGE",
          percentage: line.percentage!.toFixed(2),
          remark: line.remark,
          amount: line.amount.toFixed(2),
        };
      return {
        ...common,
        kind: "ITEM",
        quantity: row.documentFormatVersion === 1 ? "1.00" : line.quantity.toFixed(2),
        unitPrice:
          row.documentFormatVersion === 1 ? line.amount.toFixed(2) : line.unitPrice.toFixed(2),
        unit: row.documentFormatVersion === 1 ? "式" : line.unit,
        remark: line.remark,
        amount: line.amount.toFixed(2),
      };
    };
    const sections =
      row.documentFormatVersion === 2
        ? row.sections.map((section) => ({
            id: section.id,
            title: section.title,
            categoryId: section.categoryId,
            lines: row.items.filter((line) => line.sectionId === section.id).map(storedLine),
          }))
        : [
            ...new Set(
              orderQuoteLines(
                row.items.map((line) => ({ ...line, categoryId: line.categoryId ?? "" })),
                job.catalog.workCategories,
              ).map((line) => line.categoryId),
            ),
          ].map((categoryId) => ({
            title: categoryLabel(context.locale, categoryId, job.catalog.workCategories),
            categoryId: categoryId || null,
            lines: row.items
              .filter((line) => (line.categoryId ?? "") === categoryId)
              .map(storedLine),
          }));
    const document = storedQuoteDocument(
      sections,
      {
        amount: row.discountAmount.toFixed(2),
        label: row.discountLabel || (context.locale === "zh-TW" ? "優惠折讓" : "Discount"),
      },
      totals,
    );
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
      documentFormatVersion: row.documentFormatVersion,
      document,
      totals,
      lines: row.items
        .filter((line) => line.kind !== "NOTE")
        .map((line) => {
          const provenance = object(
            object(references.find((entry) => entry.subjectId === line.id)?.supportedValue)
              .quoteDraft,
          );
          const recorded = object(provenance.recorded);
          return {
            id: line.id,
            categoryId: line.categoryId ?? "",
            unit: line.unit,
            description: description(line),
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
        ...(data.document
          ? {
              documentFormatVersion: 2,
              discountAmount: data.document.discount.amount,
              discountLabel: data.document.discount.label,
            }
          : {}),
        ...data.totals,
      },
    });
    const changedLineIds: string[] = [];
    if (data.document) {
      const sections: Prisma.QuoteSectionCreateManyInput[] = [];
      const items: Prisma.QuoteItemCreateManyInput[] = [];
      const references: Prisma.EvidenceReferenceCreateManyInput[] = [];
      let lineNumber = 0,
        financialIndex = 0;
      for (const [index, section] of data.document.sections.entries()) {
        const sectionId = randomUUID();
        sections.push({
          id: sectionId,
          organizationId,
          quoteVersionId: versionId,
          position: index + 1,
          title: section.title,
          categoryId: section.categoryId,
        });
        for (const line of section.lines) {
          const lineId = randomUUID();
          lineNumber++;
          items.push({
            id: lineId,
            organizationId,
            quoteVersionId: versionId,
            sectionId,
            lineNumber,
            categoryId: section.categoryId,
            kind: line.kind,
            description: line.description,
            descriptionEn: line.description,
            descriptionZhTw: line.description,
            amount: line.amount ?? "0",
            quantity: line.kind === "ITEM" ? line.quantity : "0",
            unit: line.kind === "ITEM" ? line.unit : line.kind === "PERCENTAGE" ? "%" : "",
            unitPrice: line.kind === "ITEM" ? line.unitPrice : "0",
            percentage: line.kind === "PERCENTAGE" ? line.percentage : null,
            remark: line.kind === "NOTE" ? "" : line.remark,
            authorityState: "HUMAN_REVIEWED",
          });
          if (line.kind !== "NOTE") {
            const source = data.lines[financialIndex++]!;
            references.push({
              id: randomUUID(),
              organizationId,
              subjectType: "QUOTE_ITEM",
              subjectId: lineId,
              claimKey: "quote-draft:line",
              locator: { kind: "structured-line", lineNumber },
              supportedValue: json({
                amount: line.amount,
                currency: job.currency,
                quoteDraft: { recorded: source.recorded, enteredBy: source.enteredBy },
              }),
              authorityState: "HUMAN_REVIEWED",
              observationType: "QUOTED_PRICE",
              dataClassification: context.dataMode,
              effectiveAt: new Date(),
            });
          }
          changedLineIds.push(lineId);
        }
      }
      references.push({
        id: randomUUID(),
        organizationId,
        subjectType: "QUOTE_VERSION",
        subjectId: versionId,
        claimKey: "quote-document:total",
        locator: { kind: "structured-total" },
        supportedValue: json({
          amount: data.totals.amountBeforeTax,
          currency: job.currency,
          discountAmount: data.document.discount.amount,
        }),
        authorityState: "HUMAN_REVIEWED",
        observationType: "QUOTED_PRICE",
        dataClassification: context.dataMode,
        effectiveAt: new Date(),
      });
      await this.tx.quoteSection.createMany({ data: sections });
      if (items.length) await this.tx.quoteItem.createMany({ data: items });
      await this.tx.evidenceReference.createMany({ data: references });
    } else
      for (const [index, line] of orderQuoteLines(
        data.lines,
        job.catalog.workCategories,
      ).entries()) {
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
