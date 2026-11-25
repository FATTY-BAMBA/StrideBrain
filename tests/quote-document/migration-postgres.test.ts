import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetWorkerDatabase } from "../database/worker";
import { fixturePaths } from "../database/lifecycle";
const suite = process.env.DATABASE_URL ? describe.sequential : describe.skip;
const migration = "20261124150000_quote_document_sections";
let sql: Client;
let original: unknown;
const existingRows = async () => ({
  quotes: (
    await sql.query(
      `SELECT to_jsonb(v) - ARRAY['documentFormatVersion','discountAmount','discountLabel'] AS value FROM "QuoteVersion" v ORDER BY id`,
    )
  ).rows,
  items: (
    await sql.query(
      `SELECT to_jsonb(i) - ARRAY['sectionId','kind','description','remark','percentage'] AS value FROM "QuoteItem" i ORDER BY id`,
    )
  ).rows,
  projects: (
    await sql.query(`SELECT to_jsonb(p) - 'siteAddress' AS value FROM "Project" p ORDER BY id`)
  ).rows,
});
suite("SB-065 populated document migration", () => {
  beforeAll(async () => {
    await resetWorkerDatabase(true);
    sql = new Client({ connectionString: process.env.DATABASE_URL });
    await sql.connect();
    for (const name of readdirSync("prisma/migrations")
      .filter((name) => name < migration)
      .sort())
      await sql.query(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
    // These fixtures depend on migrations later than the historical document schema.
    for (const path of fixturePaths("db:seed").filter(
      (path) =>
        !["quote-document", "firm-client-types", "project-cities"].some((name) =>
          path.includes(name),
        ),
    ))
      await sql.query(readFileSync(path, "utf8"));
    await sql.query(
      `UPDATE "QuoteVersion" SET "documentSnapshot"=$1::jsonb WHERE id=(SELECT id FROM "QuoteVersion" ORDER BY id LIMIT 1)`,
      [
        JSON.stringify({
          schemaVersion: "QUOTE-DOCUMENT-1.0",
          immutable: "unchanged issued payload",
        }),
      ],
    );
    original = await existingRows();
    await sql.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  }, 30000);
  afterAll(async () => {
    await sql?.end();
  });
  it("preserves every existing item, version total, issued snapshot and job", async () => {
    expect(await existingRows()).toEqual(original);
    expect((await sql.query('SELECT count(*)::int AS count FROM "QuoteSection"')).rows).toEqual([
      { count: 0 },
    ]);
  });
  it("binds sections to their tenant/version and lines to their section's tenant/version", async () => {
    const rows = (
      await sql.query(
        'SELECT id,"organizationId" FROM "QuoteVersion" WHERE "organizationId"=$1 ORDER BY id LIMIT 2',
        ["org_horizon"],
      )
    ).rows;
    const foreign = (
      await sql.query('SELECT id FROM "Organization" WHERE id<>$1 LIMIT 1', ["org_horizon"])
    ).rows[0].id;
    await expect(
      sql.query(
        'INSERT INTO "QuoteSection" (id,"organizationId","quoteVersionId",position,title) VALUES ($1,$2,$3,1,$4)',
        ["foreign-section", foreign, rows[0].id, "Work"],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await sql.query(
      'INSERT INTO "QuoteSection" (id,"organizationId","quoteVersionId",position,title,"categoryId") VALUES ($1,$2,$3,1,$4,$5)',
      ["test-section", "org_horizon", rows[0].id, "Work", "CUSTOM_MILLWORK"],
    );
    await expect(
      sql.query('UPDATE "QuoteItem" SET "sectionId"=$1 WHERE "quoteVersionId"=$2', [
        "test-section",
        rows[1].id,
      ]),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      sql.query(
        'INSERT INTO "QuoteSection" (id,"organizationId","quoteVersionId",position,title) VALUES ($1,$2,$3,1,$4)',
        ["duplicate-position", "org_horizon", rows[0].id, "Work"],
      ),
    ).rejects.toMatchObject({ code: "23505" });
    await expect(
      sql.query('UPDATE "QuoteSection" SET "categoryId"=$1 WHERE id=$2', [
        "not-a-firm-category",
        "test-section",
      ]),
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("adds all specified unit suggestions repeatably without renaming original keys or edited labels", async () => {
    const seed = readFileSync("prisma/fixtures/quote-document.sql", "utf8");
    await sql.query(seed);
    await sql.query(
      `UPDATE "FirmQuoteUnit" SET "nameZhTw"='自訂單位' WHERE "organizationId"='org_horizon' AND key='ping'`,
    );
    await sql.query(seed);
    await sql.query(readFileSync("prisma/fixtures/verify-quote-document.sql", "utf8"));
    expect(
      (
        await sql.query(
          `SELECT key,"nameZhTw" FROM "FirmQuoteUnit" WHERE "organizationId"='org_horizon' AND key IN ('lot','m2','ping') ORDER BY key`,
        )
      ).rows,
    ).toEqual([
      { key: "lot", nameZhTw: "式" },
      { key: "m2", nameZhTw: "平方公尺" },
      { key: "ping", nameZhTw: "自訂單位" },
    ]);
  });
});
