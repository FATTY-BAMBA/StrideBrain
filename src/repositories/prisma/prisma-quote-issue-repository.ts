import { orderQuoteLines } from "@/modules/quote-draft/domain/quote-line-order";
import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "../../../.generated/prisma/client";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { basisOutOfDate, basisSourceIds } from "@/modules/quote-draft/domain/draft-policy";
import { isVisibleFinding } from "@/modules/economics/domain/claim-selection";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  FirmDetails,
  IssueState,
  IssuePreparation,
  IssueReceipt,
  QuoteDocumentSnapshot,
  LineConflict,
} from "@/modules/quote-issue/domain/contracts";
import type {
  QuoteIssueRepositoryPort,
  QuoteIssueSessionPort,
} from "@/repositories/ports/quote-issue-repository";
import { stageAfterAcceptance } from "@/modules/quote-issue/domain/issue-policy";
import { PrismaQuoteDraftSession } from "./prisma-quote-draft-repository";
const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export class PrismaQuoteIssueSession
  extends PrismaQuoteDraftSession
  implements QuoteIssueSessionPort
{
  async readFirm(context: RuntimeContext): Promise<FirmDetails | null> {
    if (!context.capabilities.has("settings:manage") && !context.capabilities.has("quote:read"))
      return null;
    if (
      !(await this.tx.membership.findFirst({
        where: { id: context.membershipId, organizationId: context.organizationId, active: true },
        select: { id: true },
      }))
    )
      return null;
    const row = await this.tx.quoteDocumentDetails.findUnique({
      where: { organizationId: context.organizationId },
    });
    if (!row) return null;
    return {
      legalNameEn: row.legalNameEn,
      legalNameZhTw: row.legalNameZhTw,
      taxId: row.taxId,
      addressEn: row.addressEn,
      addressZhTw: row.addressZhTw,
      phone: row.phone,
      email: row.email,
      defaultValidityDays: row.defaultValidityDays,
      termsEn: row.termsEn,
      termsZhTw: row.termsZhTw,
    };
  }
  async loadIssueState(context: RuntimeContext, projectKey: string): Promise<IssueState | null> {
    const job = await this.getJob(context, projectKey),
      auth = new AuthorizationService();
    if (!job || !auth.canReadCommercial(context, job.id, "QUOTE").allowed) return null;
    const organizationId = context.organizationId;
    const project = await this.tx.project.findFirst({
      where: { id: job.id, organizationId },
      select: {
        nameEn: true,
        nameZhTw: true,
        client: { select: { organizationId: true, nameEn: true, nameZhTw: true } },
        organization: { select: { timezone: true } },
      },
    });
    if (!project || project.client.organizationId !== organizationId) return null;
    const current = await this.getSaved(context, job);
    const descriptions = current
      ? await this.tx.quoteItem.findMany({
          where: { organizationId, quoteVersionId: current.id },
          select: { id: true, descriptionEn: true, descriptionZhTw: true },
        })
      : [];
    const versions = await this.tx.quoteVersion.findMany({
      where: {
        organizationId,
        quote: { organizationId, projectId: job.id },
        issuedAt: { not: null },
      },
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        status: true,
        documentNumber: true,
        validUntil: true,
        acceptedOn: true,
        documentSnapshot: true,
        supersededById: true,
      },
    });
    const activeIssued = versions.find((version) => !version.supersededById);
    const comparison = await this.getComparison(context, job);
    const findings =
      comparison?.kind === "AVAILABLE"
        ? (comparison.economics?.claims ?? []).filter(isVisibleFinding)
        : [];
    const unreviewedFindings =
      findings.length > 0 &&
      comparison?.kind === "AVAILABLE" &&
      !!comparison.economics &&
      !(await this.tx.action.findFirst({
        where: {
          organizationId,
          projectId: job.id,
          enrichmentRunId: comparison.economics.run.id,
          type: "INTERNAL_REVIEW",
        },
        select: { id: true },
      }));
    let sourceAccess = true;
    const conflicts: LineConflict[] = [];
    for (const line of current?.lines ?? []) {
      const recorded = line.recorded;
      if (!recorded) continue;
      const ids = basisSourceIds(recorded.basis);
      if (
        recorded.basis.actualExceeded &&
        !auth.canReadCommercial(context, job.id, "ACTUAL").allowed
      )
        sourceAccess = false;
      if (
        ids.length &&
        (await this.getSources(context, recorded.comparisonRunId, ids)).kind !== "COMPLETE"
      ) {
        sourceAccess = false;
        continue;
      }
      const rows = await this.tx.evidenceConflict.findMany({
        where: {
          organizationId,
          status: "OPEN",
          OR: [
            { primaryEvidenceId: { in: [...ids] } },
            { conflictingEvidenceId: { in: [...ids] } },
          ],
        },
        select: { conflictKey: true },
        orderBy: { conflictKey: "asc" },
      });
      for (const row of rows) {
        if (!(await this.getConflict(context, recorded.comparisonRunId, row.conflictKey))) {
          sourceAccess = false;
          continue;
        }
        conflicts.push({
          categoryId: line.categoryId,
          conflictKey: row.conflictKey,
          comparisonRunId: recorded.comparisonRunId,
        });
      }
    }
    return {
      job,
      timezone: project.organization.timezone,
      projectNameEn: project.nameEn,
      projectNameZhTw: project.nameZhTw,
      clientNameEn: project.client.nameEn,
      clientNameZhTw: project.client.nameZhTw,
      firm: await this.readFirm(context),
      current,
      descriptions: descriptions.map((line) => ({
        id: line.id,
        en: line.descriptionEn,
        zh: line.descriptionZhTw,
      })),
      issuedCount: versions.length,
      issued:
        activeIssued?.documentNumber && activeIssued.validUntil && activeIssued.documentSnapshot
          ? {
              id: activeIssued.id,
              status: activeIssued.status,
              documentNumber: activeIssued.documentNumber,
              validUntil: activeIssued.validUntil.toISOString().slice(0, 10),
              acceptedOn: activeIssued.acceptedOn?.toISOString().slice(0, 10) ?? null,
              snapshot: activeIssued.documentSnapshot as unknown as QuoteDocumentSnapshot,
            }
          : null,
      latestIssued:
        versions[0]?.documentNumber && versions[0].validUntil && versions[0].documentSnapshot
          ? {
              id: versions[0].id,
              status: versions[0].status,
              documentNumber: versions[0].documentNumber,
              validUntil: versions[0].validUntil.toISOString().slice(0, 10),
              acceptedOn: versions[0].acceptedOn?.toISOString().slice(0, 10) ?? null,
              snapshot: versions[0].documentSnapshot as unknown as QuoteDocumentSnapshot,
            }
          : null,
      sourceAccess,
      conflicts: sourceAccess ? conflicts : [],
      basisOutOfDate: !!current?.lines.some(
        (line) => line.recorded && basisOutOfDate(line.recorded.basis, job, line.categoryId),
      ),
      comparisonOutOfDate: !!comparison && comparison.kind !== "AVAILABLE",
      findings,
      unreviewedFindings,
    };
  }
  async document(context: RuntimeContext, versionId: string) {
    if (!context.capabilities.has("quote:read")) return null;
    const row = await this.tx.quoteVersion.findFirst({
      where: { id: versionId, organizationId: context.organizationId },
      select: {
        status: true,
        documentSnapshot: true,
        quote: { select: { project: { select: { businessKey: true, organizationId: true } } } },
      },
    });
    if (!row || row.quote.project.organizationId !== context.organizationId) return null;
    const job = await this.getJob(context, row.quote.project.businessKey);
    if (!job || !new AuthorizationService().canReadCommercial(context, job.id, "QUOTE").allowed)
      return null;
    return {
      projectKey: job.businessKey,
      status: row.status,
      snapshot: row.documentSnapshot as unknown as QuoteDocumentSnapshot | null,
    };
  }
  async receipt(context: RuntimeContext, key: string) {
    const row = await this.tx.auditEvent.findUnique({
      where: {
        organizationId_idempotencyKey: {
          organizationId: context.organizationId,
          idempotencyKey: key,
        },
      },
    });
    if (!row) return null;
    const payload = object(row.payload);
    return {
      actor: row.actorMembershipId,
      fingerprint: String(payload.fingerprint ?? ""),
      receipt: payload.receipt as IssueReceipt,
    };
  }
  async saveFirm(context: RuntimeContext, details: FirmDetails) {
    if (
      !context.capabilities.has("settings:manage") ||
      !(await this.tx.membership.findFirst({
        where: { id: context.membershipId, organizationId: context.organizationId, active: true },
        select: { id: true },
      }))
    )
      throw new Error("UNAVAILABLE");
    await this.tx.quoteDocumentDetails.upsert({
      where: { organizationId: context.organizationId },
      create: { id: randomUUID(), organizationId: context.organizationId, ...details },
      update: details,
    });
  }
  async issue(
    context: RuntimeContext,
    state: IssueState,
    preparation: IssuePreparation,
    now: Date,
  ): Promise<IssueReceipt> {
    if (
      !context.capabilities.has("quote:issue") ||
      !state.current ||
      state.current.status !== "DRAFT" ||
      state.current.id !== preparation.versionId
    )
      throw new Error("UNAVAILABLE");
    const organizationId = context.organizationId,
      id = state.current.id;
    await this.tx.quoteItem.updateMany({
      where: { organizationId, quoteVersionId: id },
      data: { authorityState: "APPROVED_COMMERCIAL" },
    });
    await this.tx.evidenceReference.updateMany({
      where: {
        organizationId,
        subjectType: "QUOTE_ITEM",
        subjectId: { in: state.current.lines.map((line) => line.id) },
        claimKey: "quote-draft:line",
      },
      data: { authorityState: "APPROVED_COMMERCIAL" },
    });
    if (state.issued)
      await this.tx.quoteVersion.update({
        where: { id_organizationId: { id: state.issued.id, organizationId } },
        data: { status: "SUPERSEDED", authorityState: "SUPERSEDED", supersededById: id },
      });
    await this.tx.quoteVersion.update({
      where: { id_organizationId: { id, organizationId } },
      data: {
        status: "ISSUED",
        authorityState: "APPROVED_COMMERCIAL",
        approvedAt: now,
        issuedAt: now,
        issuedByMembershipId: context.membershipId,
        documentNumber: preparation.snapshot.documentNumber,
        validUntil: new Date(`${preparation.snapshot.validUntil}T00:00:00Z`),
        documentSnapshot: json(preparation.snapshot),
      },
    });
    return { kind: "ISSUED", versionId: id, documentNumber: preparation.snapshot.documentNumber };
  }
  async revise(
    context: RuntimeContext,
    state: IssueState,
    versionId: string,
  ): Promise<IssueReceipt> {
    if (
      !context.capabilities.has("quote:draft") ||
      state.issued?.id !== versionId ||
      state.issued.status !== "ISSUED" ||
      state.current?.id !== versionId
    )
      throw new Error("UNAVAILABLE");
    const organizationId = context.organizationId,
      original = await this.tx.quoteVersion.findFirstOrThrow({
        where: { id: versionId, organizationId },
        include: { items: { where: { organizationId }, orderBy: { lineNumber: "asc" } } },
      });
    const last = await this.tx.quoteVersion.findFirstOrThrow({
        where: { organizationId, quoteId: original.quoteId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      }),
      id = randomUUID();
    await this.tx.quoteVersion.create({
      data: {
        id,
        organizationId,
        quoteId: original.quoteId,
        versionNumber: last.versionNumber + 1,
        status: "DRAFT",
        authorityState: "HUMAN_REVIEWED",
        currency: original.currency,
        amountBeforeTax: original.amountBeforeTax,
        taxAmount: original.taxAmount,
        totalAmount: original.totalAmount,
      },
    });
    for (const [index, item] of orderQuoteLines(original.items).entries()) {
      const lineId = randomUUID();
      await this.tx.quoteItem.create({
        data: {
          ...item,
          id: lineId,
          quoteVersionId: id,
          lineNumber: index + 1,
          authorityState: "HUMAN_REVIEWED",
          createdAt: new Date(),
        },
      });
      const refs = await this.tx.evidenceReference.findMany({
        where: {
          organizationId,
          subjectType: "QUOTE_ITEM",
          subjectId: item.id,
          claimKey: "quote-draft:line",
        },
      });
      for (const ref of refs)
        await this.tx.evidenceReference.create({
          data: {
            ...ref,
            id: randomUUID(),
            subjectId: lineId,
            authorityState: "HUMAN_REVIEWED",
            locator: json(
              object(ref.locator).kind === "structured-line"
                ? { ...object(ref.locator), lineNumber: index + 1 }
                : ref.locator,
            ),
            supportedValue: json(ref.supportedValue),
            createdAt: new Date(),
            dataClassification: context.dataMode,
          },
        });
    }
    return { kind: "REVISED", versionId: id };
  }
  async accept(
    context: RuntimeContext,
    state: IssueState,
    versionId: string,
    date: string,
    note: string,
  ): Promise<IssueReceipt> {
    if (
      !context.capabilities.has("project:update") ||
      !context.capabilities.has("quote:read") ||
      state.issued?.id !== versionId ||
      state.issued.status !== "ISSUED"
    )
      throw new Error("UNAVAILABLE");
    const organizationId = context.organizationId;
    await this.tx.quoteVersion.update({
      where: { id_organizationId: { id: versionId, organizationId } },
      data: {
        status: "ACCEPTED",
        acceptedOn: new Date(`${date}T00:00:00Z`),
        acceptedByMembershipId: context.membershipId,
        acceptanceNote: note,
      },
    });
    if (stageAfterAcceptance(state.job.stage) !== state.job.stage)
      await this.tx.project.update({
        where: { id_organizationId: { id: state.job.id, organizationId } },
        data: { stage: "APPROVED" },
      });
    return { kind: "ACCEPTED", versionId, documentNumber: state.issued.documentNumber };
  }
  async resolveConflict(
    context: RuntimeContext,
    state: IssueState,
    conflictKey: string,
    status: "RESOLVED" | "DISMISSED",
    note: string,
    now: Date,
  ): Promise<IssueReceipt> {
    if (
      !context.capabilities.has("authority:financial-conflict:resolve") ||
      !state.sourceAccess ||
      !state.conflicts.some((entry) => entry.conflictKey === conflictKey)
    )
      throw new Error("UNAVAILABLE");
    const result = await this.tx.evidenceConflict.updateMany({
      where: { organizationId: context.organizationId, conflictKey, status: "OPEN" },
      data: { status, resolutionNote: note, resolvedAt: now },
    });
    if (!result.count) throw new Error("CONFLICT_CHANGED");
    return { kind: "RESOLVED" };
  }
  async audit(
    context: RuntimeContext,
    key: string,
    fingerprint: string,
    receipt: IssueReceipt,
    details: Readonly<Record<string, unknown>>,
  ) {
    await this.tx.auditEvent.create({
      data: {
        id: randomUUID(),
        organizationId: context.organizationId,
        actorMembershipId: context.membershipId,
        eventType: `QUOTE_${receipt.kind}`,
        requestId: context.requestId,
        idempotencyKey: key,
        result: receipt.kind,
        payload: json({ fingerprint, receipt, ...details }),
      },
    });
  }
}
export class PrismaQuoteIssueRepository implements QuoteIssueRepositoryPort {
  constructor(private readonly database: PrismaClient) {}
  async transaction<T>(work: (tx: QuoteIssueSessionPort) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++)
      try {
        return await this.database.$transaction((tx) => work(new PrismaQuoteIssueSession(tx)), {
          isolationLevel: "Serializable",
          timeout: 20000,
        });
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? error.code : null;
        if (attempt >= 2 || !["P2034", "P2002"].includes(String(code))) throw error;
      }
  }
}
