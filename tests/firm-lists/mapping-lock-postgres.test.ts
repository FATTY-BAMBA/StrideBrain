import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { assistantDatabase } from "../assistant/database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaFirmListsRepository } from "@/repositories/prisma/prisma-firm-lists-repository";
import { PrismaFirmListsWriteRepository } from "@/repositories/prisma/prisma-firm-lists-write-repository";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("pricing mapping becomes immutable on first use", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  const reader = () => new PrismaFirmListsRepository(getPrismaClient());
  const writer = () => new PrismaFirmListsWriteRepository(getPrismaClient());
  async function value(key: string | null, pricedUnderKey: string | null) {
    return {
      kind: "WORK_CATEGORY" as const,
      key,
      pricedUnderKey,
      nameEn: "New work",
      nameZhTw: "新工種",
      active: true,
      sortOrder: 90,
      relatedKeys: [],
      expectedRevision: (await reader().read(await db.actor()))!.revision,
      idempotencyKey: randomUUID(),
    };
  }
  it("allows mapping changes before use, rejects self/cycle/foreign targets", async () => {
    const owner = await db.actor();
    const saved = await writer().changeWithAudit(
      { ...owner, requestId: randomUUID() },
      await value(null, null),
    );
    expect(saved.kind).toBe("SAVED");
    if (saved.kind !== "SAVED" || !saved.key) return;
    expect(
      await writer().changeWithAudit(
        { ...owner, requestId: randomUUID() },
        await value(saved.key, "DEMOLITION_CEILING"),
      ),
    ).toEqual(saved);
    expect(
      await writer().changeWithAudit(
        { ...owner, requestId: randomUUID() },
        await value(saved.key, saved.key),
      ),
    ).toEqual({ kind: "INVALID", fields: ["pricedUnderKey"] });
    expect(
      await writer().changeWithAudit(
        { ...owner, requestId: randomUUID() },
        await value(saved.key, "FOREIGN"),
      ),
    ).toEqual({ kind: "INVALID", fields: ["pricedUnderKey"] });
  });
  it.each([
    "ProjectScope",
    "QuoteItem",
    "ForecastCostLine",
    "CostLine",
    "SupplierOfferItem",
    "Supplier",
    "Material",
  ])("locks a category referenced by %s, including retired records", async (table) => {
    const owner = await db.actor();
    const saved = await writer().changeWithAudit(
      { ...owner, requestId: randomUUID() },
      await value(null, null),
    );
    expect(saved.kind).toBe("SAVED");
    if (saved.kind !== "SAVED" || !saved.key) return;
    const original = (
      await db.sql.query(
        `SELECT id,"categoryId" FROM "${table}" WHERE "organizationId"='org_horizon' LIMIT 1`,
      )
    ).rows[0];
    expect(original).toBeDefined();
    await db.sql.query(`UPDATE "${table}" SET "categoryId"=$1 WHERE id=$2`, [
      saved.key,
      original.id,
    ]);
    await db.sql.query(
      'UPDATE "FirmWorkCategory" SET active=false WHERE "organizationId"=$1 AND key=$2',
      [owner.organizationId, saved.key],
    );
    try {
      expect(await reader().referencedCategories(owner)).toContain(saved.key);
      const change = await value(saved.key, "DEMOLITION_CEILING");
      expect(await writer().changeWithAudit({ ...owner, requestId: randomUUID() }, change)).toEqual(
        { kind: "MAPPING_IN_USE" },
      );
      expect(
        (
          await writer().changeWithAudit(
            { ...owner, requestId: randomUUID() },
            { ...(await value(saved.key, null)), nameEn: "Renamed", active: false },
          )
        ).kind,
      ).toBe("SAVED");
    } finally {
      await db.sql.query(`UPDATE "${table}" SET "categoryId"=$1 WHERE id=$2`, [
        original.categoryId,
        original.id,
      ]);
    }
  });
  it("counts commercial categories on closed and deleted jobs and locks a used pricing parent", async () => {
    const owner = await db.actor();
    expect(await reader().referencedCategories(owner)).toContain("DEMOLITION_CEILING");
    const saved = await writer().changeWithAudit(
      { ...owner, requestId: randomUUID() },
      await value(null, null),
    );
    if (saved.kind !== "SAVED" || !saved.key) throw Error("CREATE_REQUIRED");
    await db.sql.query(
      `UPDATE "Project" SET "commercialCategoryIds"=ARRAY[$1],"deletedAt"=NOW(),stage='COMPLETE' WHERE id='prj_neihu_021'`,
      [saved.key],
    );
    expect(
      await writer().changeWithAudit(
        { ...owner, requestId: randomUUID() },
        await value(saved.key, "DEMOLITION_CEILING"),
      ),
    ).toEqual({ kind: "MAPPING_IN_USE" });
  });
});
