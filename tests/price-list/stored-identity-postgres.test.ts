import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "../assistant/database-fixture";
import { priceJob, issuedPrice, priceItem, priceServices } from "./fixtures";
const suite = process.env.DATABASE_URL ? describe.sequential : describe.skip;
suite("stored price identity and invoker security", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  let versionId: string;
  beforeAll(async () => {
    db = await assistantDatabase();
    const owner = await db.actor();
    ({ versionId } = await issuedPrice(owner, await priceJob(owner), [
      priceItem("  Ｃｅｉｌｉｎｇ Guard  ", "3500", "ｍ²"),
    ]));
  });
  afterAll(async () => {
    await db?.close();
  });
  it("backfills existing lines and preserves issued snapshots through the forward migration", async () => {
    await db.sql.query("BEGIN");
    try {
      const before = (
        await db.sql.query('SELECT "documentSnapshot" FROM "QuoteVersion" WHERE id=$1', [versionId])
      ).rows[0];
      await db.sql.query(
        'DROP VIEW "IssuedQuotePrice"; ALTER TABLE "QuoteItem" DROP COLUMN "priceDescriptionKey", DROP COLUMN "priceUnitKey"',
      );
      const original = readFileSync(
        "prisma/migrations/20261125080000_price_list_read_model/migration.sql",
        "utf8",
      );
      await db.sql.query(original.slice(original.indexOf("CREATE VIEW")));
      await db.sql.query(
        readFileSync(
          "prisma/migrations/20261125083000_stored_price_identity/migration.sql",
          "utf8",
        ),
      );
      expect(
        (
          await db.sql.query(
            'SELECT "descriptionKey", "unitKey" FROM "IssuedQuotePrice" WHERE "versionId"=$1',
            [versionId],
          )
        ).rows,
      ).toEqual([{ descriptionKey: "ceiling guard", unitKey: "m2" }]);
      expect(
        (
          await db.sql.query('SELECT "documentSnapshot" FROM "QuoteVersion" WHERE id=$1', [
            versionId,
          ])
        ).rows[0],
      ).toEqual(before);
      expect(
        (
          await db.sql.query(
            `SELECT attgenerated FROM pg_attribute WHERE attrelid='"QuoteItem"'::regclass AND attname IN ('priceDescriptionKey','priceUnitKey')`,
          )
        ).rows,
      ).toEqual([{ attgenerated: "s" }, { attgenerated: "s" }]);
    } finally {
      await db.sql.query("ROLLBACK");
    }
  });
  it("derives keys on updates and refuses application-supplied keys", async () => {
    const owner = await db.actor();
    const source = (
      await db.sql.query('SELECT "projectKey" FROM "IssuedQuotePrice" WHERE "versionId"=$1', [
        versionId,
      ])
    ).rows[0];
    const revised = await priceServices().revise.execute(
      { ...owner, requestId: randomUUID() },
      { projectKey: source.projectKey, versionId, idempotencyKey: randomUUID() },
    );
    if (revised.kind !== "REVISED") throw Error("REVISION_REQUIRED");
    const draftId = revised.versionId;
    await db.sql.query("BEGIN");
    try {
      // Edit only the new draft. The issued source remains immutable.
      await db.sql.query(
        'UPDATE "QuoteItem" SET description=$1, unit=$2 WHERE "quoteVersionId"=$3',
        ["New ＩＴＥＭ", " ＰＣ ", draftId],
      );
      expect(
        (
          await db.sql.query(
            'SELECT "priceDescriptionKey", "priceUnitKey" FROM "QuoteItem" WHERE "quoteVersionId"=$1',
            [draftId],
          )
        ).rows,
      ).toEqual([{ priceDescriptionKey: "new item", priceUnitKey: "pc" }]);
      await expect(
        db.sql.query('UPDATE "QuoteItem" SET "priceDescriptionKey"=$1 WHERE "quoteVersionId"=$2', [
          "drift",
          draftId,
        ]),
      ).rejects.toMatchObject({ code: "428C9" });
    } finally {
      await db.sql.query("ROLLBACK");
    }
  });
  it("never re-normalizes modern description/unit values when reading the view", async () => {
    await db.sql.query("BEGIN");
    try {
      // Runtime tripwire, not a SQL-text assertion: any per-row normalizer call fails.
      await db.sql.query(
        `CREATE OR REPLACE FUNCTION sb_price_identity(value text) RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT AS $$ BEGIN RAISE EXCEPTION 'NORMALIZATION_DURING_READ'; END $$`,
      );
      expect(
        (
          await db.sql.query(
            'SELECT "descriptionKey", "unitKey" FROM "IssuedQuotePrice" WHERE "versionId"=$1',
            [versionId],
          )
        ).rows,
      ).toEqual([{ descriptionKey: "ceiling guard", unitKey: "m2" }]);
    } finally {
      await db.sql.query("ROLLBACK");
    }
  });
  it("applies the invoking role's RLS policy rather than the view owner's", async () => {
    await db.sql.query("BEGIN");
    try {
      expect(
        (
          await db.sql.query(
            `SELECT reloptions FROM pg_class WHERE oid='"IssuedQuotePrice"'::regclass`,
          )
        ).rows[0].reloptions,
      ).toContain("security_invoker=true");
      expect(
        (
          await db.sql.query(
            'SELECT count(*)::int n FROM "IssuedQuotePrice" WHERE "versionId"=$1',
            [versionId],
          )
        ).rows[0].n,
      ).toBe(1);
      // Unique role per isolated worker; creation/grants/policy are all rolled back.
      const role = `sb_price_reader_${process.pid}_${process.env.VITEST_POOL_ID}`;
      await db.sql.query(
        `CREATE ROLE "${role}" NOLOGIN; GRANT USAGE ON SCHEMA public TO "${role}"; GRANT SELECT ON ALL TABLES IN SCHEMA public TO "${role}"; ALTER TABLE "QuoteItem" ENABLE ROW LEVEL SECURITY; CREATE POLICY price_test_deny ON "QuoteItem" TO "${role}" USING (false); SET LOCAL ROLE "${role}"`,
      );
      expect((await db.sql.query('SELECT count(*)::int n FROM "IssuedQuotePrice"')).rows[0].n).toBe(
        0,
      );
    } finally {
      await db.sql.query("ROLLBACK");
    }
  });
});
