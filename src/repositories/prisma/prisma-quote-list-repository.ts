import { Prisma, type PrismaClient } from "../../../.generated/prisma/client";
import { currentQuoteRow, quoteListSearch } from "@/modules/quotes/domain/quote-list";
import type { QuoteListRepository, QuoteListRow } from "@/repositories/ports/quote-list-repository";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export class PrismaQuoteListRepository implements QuoteListRepository {
  constructor(private readonly db: PrismaClient) {}
  async list(context: RuntimeContext, raw: NonNullable<ReturnType<typeof quoteListSearch>>) {
    const input = quoteListSearch(raw);
    if (
      !input ||
      !context.capabilities.has("project:read") ||
      (input.clientKey && !context.capabilities.has("client:read"))
    )
      return null;
    if (
      !(await this.db.membership.findFirst({
        where: {
          id: context.membershipId,
          personId: context.userId,
          organizationId: context.organizationId,
          active: true,
        },
        select: { id: true },
      }))
    )
      return null;
    if (
      input.clientKey &&
      !(await this.db.client.findFirst({
        where: { organizationId: context.organizationId, businessKey: input.clientKey },
        select: { id: true },
      }))
    )
      return null;
    const assigned = [...(context.assignedProjectIds ?? [])];
    if (context.role !== "ORGANIZATION_ADMIN" && !assigned.length)
      return { rows: [], hasMore: false };
    // Select the effective row before filtering/pagination; never filter historical versions.
    const keys = await this.db.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT q.id FROM "Quote" q
      JOIN "Project" p ON p.id=q."projectId" AND p."organizationId"=q."organizationId"
      JOIN "Client" c ON c.id=p."clientId" AND c."organizationId"=p."organizationId"
      JOIN LATERAL (
        SELECT v.status FROM "QuoteVersion" v
        WHERE v."quoteId"=q.id AND v."organizationId"=q."organizationId" AND v.status <> 'SUPERSEDED'
        ORDER BY (v.status IN ('ISSUED','ACCEPTED')) DESC, v."versionNumber" DESC LIMIT 1
      ) current ON true
      WHERE q."organizationId"=${context.organizationId} AND p."deletedAt" IS NULL
      ${context.role === "ORGANIZATION_ADMIN" ? Prisma.empty : Prisma.sql`AND p.id IN (${Prisma.join(assigned)})`}
      ${input.clientKey ? Prisma.sql`AND c."businessKey"=${input.clientKey}` : Prisma.empty}
      ${input.status ? Prisma.sql`AND (CASE WHEN current.status IN ('ISSUED','ACCEPTED') THEN current.status ELSE 'DRAFT' END)=${input.status}` : Prisma.empty}
      ORDER BY q."businessKey" ASC LIMIT 51 OFFSET ${(input.page - 1) * 50}
    `);
    const canReadAmounts = context.capabilities.has("quote:read");
    const quotes = await this.db.quote.findMany({
      where: {
        organizationId: context.organizationId,
        id: { in: keys.slice(0, 50).map((key) => key.id) },
      },
      orderBy: { businessKey: "asc" },
      select: {
        businessKey: true,
        project: {
          select: {
            businessKey: true,
            nameEn: true,
            nameZhTw: true,
            client: { select: { nameEn: true, nameZhTw: true } },
          },
        },
        versions: {
          where: { organizationId: context.organizationId, status: { not: "SUPERSEDED" } },
          take: 1001,
          orderBy: { versionNumber: "desc" },
          select: {
            versionNumber: true,
            status: true,
            documentNumber: true,
            issuedAt: true,
            createdAt: true,
            currency: true,
            ...(canReadAmounts ? { totalAmount: true } : {}),
          },
        },
      },
    });
    if (quotes.some((quote) => quote.versions.length > 1000)) return null;
    const rows: QuoteListRow[] = quotes.flatMap((quote) => {
      const selected = currentQuoteRow(
        quote.versions.map((v) => ({
          versionNumber: v.versionNumber,
          status: v.status,
          documentNumber: v.documentNumber,
          currency: v.currency,
          issuedAt: v.issuedAt?.toISOString() ?? null,
          createdAt: v.createdAt.toISOString(),
          ...(canReadAmounts && v.totalAmount !== undefined
            ? { totalAmount: v.totalAmount.toFixed(2) }
            : {}),
        })),
      );
      if (!selected) return [];
      const p = quote.project;
      return [
        {
          ...selected,
          quoteKey: quote.businessKey,
          projectKey: p.businessKey,
          projectName: context.locale === "zh-TW" ? p.nameZhTw : p.nameEn,
          clientName: context.locale === "zh-TW" ? p.client.nameZhTw : p.client.nameEn,
        },
      ];
    });
    return { rows, hasMore: keys.length > 50 };
  }
}
