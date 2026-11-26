import { Prisma, type PrismaClient } from "../../../.generated/prisma/client";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { priceQuery, type PriceQuery } from "@/modules/price-list/domain/price-input";
import type {
  PriceListRepositoryPort,
  PriceListRow,
  QuotedItemPrice,
} from "@/repositories/ports/price-list-repository";

type DbPrice = {
  description: string;
  unit: string;
  unitPrice: string;
  currency: string;
  issuedOn: string;
  documentNumber: string;
  versionId: string;
  projectKey: string;
  projectNameEn: string;
  projectNameZhTw: string;
  clientNameEn: string;
  clientNameZhTw: string;
  timesQuoted: number;
  clientPrice?: DbPrice | null;
  sourceProjectKeys?: string[];
};
function visible(row: DbPrice, context: RuntimeContext): QuotedItemPrice {
  return {
    description: row.description,
    unit: row.unit,
    unitPrice: row.unitPrice.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""),
    currency: row.currency,
    issuedOn: row.issuedOn,
    documentNumber: row.documentNumber,
    versionId: row.versionId,
    projectKey: row.projectKey,
    projectName: context.locale === "zh-TW" ? row.projectNameZhTw : row.projectNameEn,
    clientName: context.locale === "zh-TW" ? row.clientNameZhTw : row.clientNameEn,
  };
}
/** Applies both the trusted capability/assignment scope and current membership/assignment records. */
function sourceScope(
  context: RuntimeContext,
  projectId: Prisma.Sql,
  organizationId: Prisma.Sql,
): Prisma.Sql {
  const assignments = [...(context.assignedProjectIds ?? [])];
  return Prisma.sql`${organizationId}=${context.organizationId}
    AND EXISTS (SELECT 1 FROM "Membership" m WHERE m.id=${context.membershipId} AND m."organizationId"=${context.organizationId}
      AND m."personId"=${context.userId} AND m.active AND m.role::text=${context.role})
    ${
      context.role === "ORGANIZATION_ADMIN"
        ? Prisma.empty
        : assignments.length
          ? Prisma.sql`
      AND ${projectId} IN (${Prisma.join(assignments)})
      AND EXISTS (SELECT 1 FROM "ProjectAssignment" pa WHERE pa."projectId"=${projectId}
        AND pa."organizationId"=${context.organizationId} AND pa."membershipId"=${context.membershipId})`
          : Prisma.sql`AND FALSE`
    }`;
}
export class PrismaPriceListRepository implements PriceListRepositoryPort {
  constructor(private readonly db: PrismaClient) {}
  async read(context: RuntimeContext, raw: PriceQuery) {
    const input = priceQuery(raw);
    if (
      !input ||
      !context.capabilities.has("project:read") ||
      !context.capabilities.has("quote:read")
    )
      return null;
    return this.db.$transaction(
      async (tx) => {
        if (
          !(await tx.membership.findFirst({
            where: {
              id: context.membershipId,
              organizationId: context.organizationId,
              personId: context.userId,
              active: true,
              role: context.role,
            },
            select: { id: true },
          }))
        )
          return null;
        let clientId: string | null = null;
        if (input.projectKey) {
          const jobs = await tx.$queryRaw<
            { clientId: string }[]
          >(Prisma.sql`SELECT p."clientId" FROM "Project" p
          WHERE p."businessKey"=${input.projectKey} AND p."deletedAt" IS NULL
            AND ${sourceScope(context, Prisma.sql`p.id`, Prisma.sql`p."organizationId"`)} LIMIT 1`);
          if (!jobs[0]) return null;
          clientId = jobs[0].clientId;
        }
        const authorized = Prisma.sql`SELECT r.* FROM "IssuedQuotePrice" r
        WHERE ${sourceScope(context, Prisma.sql`r."projectId"`, Prisma.sql`r."organizationId"`)}`;
        if (input.mode === "HISTORY") {
          const rows = await tx.$queryRaw<DbPrice[]>(Prisma.sql`
          WITH authorized AS (${authorized}), unique_prices AS (
            SELECT DISTINCT ON ("quoteId", currency, "unitPrice") * FROM authorized
            WHERE "descriptionKey"=sb_price_identity(${input.search}) AND "unitKey"=sb_price_identity(${input.unit})
            ORDER BY "quoteId", currency, "unitPrice", "sectionPosition" DESC, "lineNumber" DESC
          )
          SELECT unique_prices.*, "unitPrice"::text AS "unitPrice", 1 AS "timesQuoted" FROM unique_prices
          ORDER BY "issuedAt" DESC, "versionId" DESC, "sectionPosition" DESC, "lineNumber" DESC LIMIT 5
        `);
          return {
            rows: rows.map((row) => ({ ...visible(row, context), timesQuoted: 1 })),
            hasMore: false,
          };
        }
        const limit = input.mode === "SUGGEST" ? 8 : 50;
        const rows = await tx.$queryRaw<DbPrice[]>(Prisma.sql`
        WITH authorized AS (${authorized}), matching AS (
          -- Identity keys use bytewise ordering throughout grouping/sorting, matching
          -- their exact normalized identity and final tie-break. This avoids locale
          -- collation work on every comparison in large repeated price histories.
          SELECT "descriptionKey" COLLATE "C" AS "descriptionKey", "unitKey" COLLATE "C" AS "unitKey",
            "quoteId", "versionId", "lineNumber", "sectionPosition", "clientId", "issuedAt",
            description, unit, "unitPrice", currency, "issuedOn", "documentNumber", "projectKey",
            "projectNameEn", "projectNameZhTw", "clientNameEn", "clientNameZhTw"
          FROM authorized WHERE strpos("descriptionKey", sb_price_identity(${input.search}))>0
            AND (${input.unit} = '' OR "unitKey" = sb_price_identity(${input.unit}))
        -- Compute each per-item aggregate and client price once. With underestimated
        -- view cardinality, inlining lets a nested loop repeat them for every item.
        ), groups AS MATERIALIZED (
          SELECT "descriptionKey", "unitKey", count(DISTINCT "quoteId")::int AS "timesQuoted",
            array_agg(DISTINCT "projectKey") AS "sourceProjectKeys",
            bool_or("clientId"=${clientId}) AS "sameClient" FROM matching GROUP BY "descriptionKey", "unitKey"
        ), latest AS MATERIALIZED (
          SELECT DISTINCT ON ("descriptionKey", "unitKey") * FROM matching
          ORDER BY "descriptionKey", "unitKey", "issuedAt" DESC, "versionId" DESC, "sectionPosition" DESC, "lineNumber" DESC
        ), client_latest AS MATERIALIZED (
          SELECT DISTINCT ON ("descriptionKey", "unitKey") * FROM matching WHERE "clientId"=${clientId}
          ORDER BY "descriptionKey", "unitKey", "issuedAt" DESC, "versionId" DESC, "sectionPosition" DESC, "lineNumber" DESC
        )
        SELECT latest.*, latest."unitPrice"::text AS "unitPrice", groups."timesQuoted", groups."sourceProjectKeys",
          CASE WHEN cp."unitPrice" <> latest."unitPrice" OR cp.currency <> latest.currency
            THEN to_jsonb(cp) || jsonb_build_object('unitPrice',cp."unitPrice"::text) ELSE NULL END AS "clientPrice"
        FROM latest JOIN groups USING ("descriptionKey","unitKey")
        LEFT JOIN client_latest cp USING ("descriptionKey","unitKey")
        ORDER BY ${
          input.mode === "SUGGEST"
            ? Prisma.sql`groups."sameClient" DESC NULLS LAST,
              (strpos(latest."descriptionKey", sb_price_identity(${input.search})) = 1) DESC,
              latest."issuedAt" DESC,`
            : Prisma.empty
        }
          latest."descriptionKey" COLLATE "C", latest."unitKey" COLLATE "C"
        LIMIT ${limit + 1} OFFSET ${(input.page - 1) * limit}
      `);
        const mapped: PriceListRow[] = rows.slice(0, limit).map((row) => ({
          ...visible(row, context),
          timesQuoted: row.timesQuoted,
          sourceProjectKeys: row.sourceProjectKeys ?? [row.projectKey],
          ...(input.projectKey && row.clientPrice
            ? { clientPrice: visible(row.clientPrice, context) }
            : {}),
        }));
        return { rows: mapped, hasMore: rows.length > limit };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
}
