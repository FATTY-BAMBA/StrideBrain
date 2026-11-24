import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "../../../.generated/prisma/client";
import type { FirmLists } from "@/modules/firm-lists/domain/contracts";
import type { FirmListSettingsReader } from "@/repositories/ports/firm-lists-repository";
import { canManageFirmLists } from "@/modules/firm-lists/application/manage-firm-lists";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export const firmEntrySelect = {
  key: true,
  nameEn: true,
  nameZhTw: true,
  sortOrder: true,
  active: true,
} as const;
const orderBy = [{ sortOrder: "asc" }, { key: "asc" }] as const;
type Database = PrismaClient | Prisma.TransactionClient;

export class PrismaFirmListsRepository implements FirmListSettingsReader {
  constructor(private readonly database: Database) {}
  async referencedCategories(context: RuntimeContext): Promise<readonly string[] | null> {
    if (!canManageFirmLists(context)) return null;
    const organizationId = context.organizationId;
    if (
      !(await this.database.membership.findFirst({
        where: {
          id: context.membershipId,
          organizationId,
          personId: context.userId,
          role: "ORGANIZATION_ADMIN",
          active: true,
        },
        select: { id: true },
      }))
    )
      return null;
    // Deliberately no active, status, deletedAt, supersession or authority predicate.
    const rows = await this.database.$queryRaw<{ key: string }[]>`
      SELECT "categoryId" AS key FROM "ProjectScope" WHERE "organizationId"=${organizationId}
      UNION SELECT unnest("commercialCategoryIds") FROM "Project" WHERE "organizationId"=${organizationId}
      UNION SELECT "categoryId" FROM "QuoteItem" WHERE "organizationId"=${organizationId}
      UNION SELECT "categoryId" FROM "QuoteSection" WHERE "organizationId"=${organizationId}
      UNION SELECT "categoryId" FROM "ForecastCostLine" WHERE "organizationId"=${organizationId}
      UNION SELECT "categoryId" FROM "CostLine" WHERE "organizationId"=${organizationId}
      UNION SELECT "categoryId" FROM "SupplierOfferItem" WHERE "organizationId"=${organizationId}
      UNION SELECT "categoryId" FROM "Supplier" WHERE "organizationId"=${organizationId}
      UNION SELECT "categoryId" FROM "Material" WHERE "organizationId"=${organizationId}
      UNION SELECT "categoryId" FROM "ComparisonClaim" WHERE "organizationId"=${organizationId} AND "categoryId" IS NOT NULL
      UNION SELECT "categoryId" FROM "EconomicsObservationDecision" WHERE "organizationId"=${organizationId} AND "categoryId" IS NOT NULL
    `;
    const lists = await this.read(context);
    if (!lists) return null;
    const used = new Set(rows.map((row) => row.key));
    // A relationship in a used scope's pricing chain carries the same immutable meaning.
    for (const key of [...used]) {
      let parent = lists.workCategories.find((entry) => entry.key === key)?.pricedUnderKey;
      while (parent && !used.has(parent)) {
        used.add(parent);
        parent = lists.workCategories.find((entry) => entry.key === parent)?.pricedUnderKey;
      }
    }
    return [...used].sort();
  }
  async read(context: RuntimeContext): Promise<FirmLists | null> {
    if (!context.capabilities.has("project:read") && !context.capabilities.has("firm-lists:manage"))
      return null;
    const organizationId = context.organizationId;
    const membership = await this.database.membership.findFirst({
      where: { id: context.membershipId, organizationId, personId: context.userId, active: true },
      select: { id: true },
    });
    if (!membership) return null;
    const [organization, jobTypes, categories, quoteUnits] = await Promise.all([
      this.database.organization.findUnique({
        where: { id: organizationId },
        select: { areaDisplayUnit: true },
      }),
      this.database.firmJobType.findMany({
        where: { organizationId },
        orderBy: [...orderBy],
        take: 501,
        select: {
          ...firmEntrySelect,
          relatedTo: {
            where: { organizationId, toType: { organizationId } },
            orderBy: { toType: { key: "asc" } },
            select: { toType: { select: { key: true } } },
          },
        },
      }),
      this.database.firmWorkCategory.findMany({
        where: { organizationId },
        orderBy: [...orderBy],
        take: 501,
        select: {
          id: true,
          ...firmEntrySelect,
          aliases: true,
          scopeSelectable: true,
          pricedUnderId: true,
        },
      }),
      this.database.firmQuoteUnit.findMany({
        where: { organizationId },
        orderBy: [...orderBy],
        take: 501,
        select: firmEntrySelect,
      }),
    ]);
    if (
      !organization ||
      !["m2", "ping"].includes(organization.areaDisplayUnit) ||
      [jobTypes, categories, quoteUnits].some((rows) => rows.length > 500)
    )
      return null;
    const data: Omit<FirmLists, "revision"> = {
      areaDisplayUnit: organization.areaDisplayUnit as FirmLists["areaDisplayUnit"],
      jobTypes: jobTypes.map(({ relatedTo, ...entry }) => ({
        ...entry,
        relatedKeys: relatedTo.map((relation) => relation.toType.key),
      })),
      workCategories: categories.map(
        ({
          key,
          nameEn,
          nameZhTw,
          sortOrder,
          active,
          aliases,
          scopeSelectable,
          pricedUnderId,
        }) => ({
          key,
          nameEn,
          nameZhTw,
          sortOrder,
          active,
          aliases,
          scopeSelectable,
          pricedUnderKey: categories.find((parent) => parent.id === pricedUnderId)?.key ?? null,
        }),
      ),
      quoteUnits,
    };
    return { ...data, revision: createHash("sha256").update(JSON.stringify(data)).digest("hex") };
  }
}
