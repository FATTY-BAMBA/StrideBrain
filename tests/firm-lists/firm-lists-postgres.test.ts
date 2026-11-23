import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { assistantDatabase } from "../assistant/database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaFirmListsRepository } from "@/repositories/prisma/prisma-firm-lists-repository";
import { PrismaFirmListsWriteRepository } from "@/repositories/prisma/prisma-firm-lists-write-repository";
import {
  ChangeFirmList,
  GetFirmListSettings,
} from "@/modules/firm-lists/application/manage-firm-lists";
import { GetFirmLists } from "@/modules/firm-lists/application/get-firm-lists";
import type { FirmListChange } from "@/modules/firm-lists/domain/list-change";
import { roleBundle } from "@/modules/runtime-context/capabilities";

const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("tenant-owned lists", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  const reader = () => new PrismaFirmListsRepository(getPrismaClient());
  const writer = () => new PrismaFirmListsWriteRepository(getPrismaClient());
  async function revision() {
    return (await reader().read(await db.actor()))!.revision;
  }
  async function input(kind: "JOB_TYPE" | "QUOTE_UNIT" = "JOB_TYPE"): Promise<FirmListChange> {
    return {
      kind,
      key: null,
      nameEn: "Residential",
      nameZhTw: "住宅",
      sortOrder: 9,
      active: true,
      relatedKeys: [],
      expectedRevision: await revision(),
      idempotencyKey: randomUUID(),
    };
  }
  it("loads firm labels/relationships/units without client data and allows project readers", async () => {
    const lists = await new GetFirmLists(reader()).execute(
      await db.actor("membership_horizon_viewer"),
    );
    expect(lists.kind).toBe("AVAILABLE");
    if (lists.kind !== "AVAILABLE") return;
    expect(
      lists.lists.jobTypes.find((entry) => entry.key === "RETAIL_FLAGSHIP")?.relatedKeys,
    ).toEqual(["RETAIL_CONCEPT_STORE", "RETAIL_RENOVATION", "RETAIL_SHOWROOM"]);
    expect(
      lists.lists.workCategories.find((entry) => entry.key === "PARTITIONS_CEILINGS")
        ?.pricedUnderKey,
    ).toBe("DEMOLITION_CEILING");
    expect(lists.lists.areaDisplayUnit).toBe("m2");
    expect(JSON.stringify(lists)).not.toMatch(/contactPerson|phone|email|address|client/);
  });
  it("adds with a stable key, replays once, renames/reorders/retires without deleting", async () => {
    for (const kind of ["JOB_TYPE", "QUOTE_UNIT"] as const) {
      const owner = await db.actor();
      const value = await input(kind),
        saved = await writer().changeWithAudit(owner, value);
      expect(saved.kind).toBe("SAVED");
      if (saved.kind !== "SAVED" || value.kind === "AREA_UNIT") return;
      expect(saved.key).toMatch(/^[a-f0-9-]{36}$/);
      expect(await writer().changeWithAudit(owner, value)).toEqual(saved);
      expect(await writer().changeWithAudit(owner, { ...value, nameEn: "changed retry" })).toEqual({
        kind: "CONFLICT",
      });
      const updated = await writer().changeWithAudit(
        { ...owner, requestId: randomUUID() },
        {
          ...value,
          key: saved.key,
          nameEn: "Home",
          nameZhTw: "住家",
          sortOrder: 1,
          active: false,
          expectedRevision: await revision(),
          idempotencyKey: randomUUID(),
        },
      );
      expect(updated).toEqual(saved);
      const lists = await reader().read(owner);
      expect(
        (kind === "JOB_TYPE" ? lists!.jobTypes : lists!.quoteUnits).find(
          (entry) => entry.key === saved.key,
        ),
      ).toMatchObject({ nameEn: "Home", nameZhTw: "住家", sortOrder: 1, active: false });
      expect(
        (
          await db.sql.query('SELECT count(*) FROM "AuditEvent" WHERE "idempotencyKey"=$1', [
            value.idempotencyKey,
          ])
        ).rows[0].count,
      ).toBe("1");
    }
  });
  it("changes area preference without changing any stored area", async () => {
    const before = (
      await db.sql.query('SELECT id,"areaQuantity","areaUnit" FROM "Project" ORDER BY id')
    ).rows;
    expect(
      await writer().changeWithAudit(await db.actor(), {
        kind: "AREA_UNIT",
        areaDisplayUnit: "ping",
        expectedRevision: await revision(),
        idempotencyKey: randomUUID(),
      }),
    ).toEqual({ kind: "SAVED", key: null });
    expect((await reader().read(await db.actor()))!.areaDisplayUnit).toBe("ping");
    expect(
      (await db.sql.query('SELECT id,"areaQuantity","areaUnit" FROM "Project" ORDER BY id')).rows,
    ).toEqual(before);
  });
  it("rejects non-owner mutations and foreign membership/key/related identifiers", async () => {
    const owner = await db.actor(),
      value = await input();
    for (const membership of [
      "membership_horizon_viewer",
      "membership_horizon_mei",
      "membership_horizon_finance",
    ]) {
      const actor = await db.actor(membership);
      expect(await writer().changeWithAudit(actor, value)).toEqual({ kind: "UNAVAILABLE" });
      expect(await new GetFirmListSettings(reader()).execute(actor)).toEqual({
        kind: "UNAVAILABLE",
      });
    }
    expect(
      await new GetFirmLists(reader()).execute({ ...owner, organizationId: "org_northern" }),
    ).toEqual({ kind: "UNAVAILABLE" });
    expect(
      await new GetFirmListSettings(reader()).execute({ ...owner, organizationId: "org_northern" }),
    ).toEqual({ kind: "UNAVAILABLE" });
    expect(
      await new ChangeFirmList(writer()).execute(
        { ...owner, organizationId: "org_northern" },
        value,
      ),
    ).toEqual({ kind: "UNAVAILABLE" });
    await db.sql.query(
      `INSERT INTO "FirmJobType" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder","updatedAt") VALUES ('foreign-type','org_northern','FOREIGN-TYPE','Foreign','外部',9,NOW())`,
    );
    if (value.kind === "AREA_UNIT") return;
    expect(await writer().changeWithAudit(owner, { ...value, key: "FOREIGN-TYPE" })).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(
      await writer().changeWithAudit(owner, { ...value, relatedKeys: ["FOREIGN-TYPE"] }),
    ).toEqual({ kind: "INVALID", fields: ["relatedKeys"] });
    const denied = { ...owner, capabilities: roleBundle("VIEWER") };
    expect(await writer().changeWithAudit(denied, value)).toEqual({ kind: "UNAVAILABLE" });
  });
  it("does not overwrite a concurrent settings edit", async () => {
    const owner = await db.actor(),
      value = await input();
    expect((await writer().changeWithAudit(owner, value)).kind).toBe("SAVED");
    expect(
      await writer().changeWithAudit(owner, { ...value, idempotencyKey: randomUUID() }),
    ).toEqual({ kind: "CHANGED" });
  });
  it("rolls back a settings change when the audit fails", async () => {
    const owner = await db.actor(),
      before = await reader().read(owner);
    await db.sql.query(
      `CREATE FUNCTION reject_list_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."eventType" = 'FIRM_LIST_CHANGED' THEN RAISE EXCEPTION 'TEST_AUDIT_FAILURE'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_list_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION reject_list_audit()`,
    );
    try {
      expect(await new ChangeFirmList(writer()).execute(owner, await input())).toEqual({
        kind: "FAILED",
      });
      expect(await reader().read(owner)).toEqual(before);
    } finally {
      await db.sql.query(
        'DROP TRIGGER reject_list_audit ON "AuditEvent"; DROP FUNCTION reject_list_audit()',
      );
    }
  });
});
