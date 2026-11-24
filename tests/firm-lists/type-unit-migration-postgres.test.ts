import { resetWorkerDatabase } from "../database/worker";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const base = process.env.DATABASE_URL;
const suite = base ? describe.sequential : describe.skip;
const migration = "20261124011000_firm_job_types_and_units";
let sql: Client;
suite("SB-066 populated firm-list upgrade", () => {
  beforeAll(async () => {
    await resetWorkerDatabase(true);
    sql = new Client({ connectionString: process.env.DATABASE_URL });
    await sql.connect();
    for (const dir of readdirSync("prisma/migrations")
      .filter((dir) => dir < migration)
      .sort())
      await sql.query(readFileSync(`prisma/migrations/${dir}/migration.sql`, "utf8"));
    await sql.query(readFileSync("prisma/fixtures/horizon-atelier.sql", "utf8"));
    await sql.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    await sql.query(
      readFileSync("prisma/migrations/20261124012000_firm_work_categories/migration.sql", "utf8"),
    );
  }, 30000);
  afterAll(async () => {
    await sql?.end();
  });
  it("seeds the original four choices and exact directed related-type pairs", async () => {
    const types = await sql.query(
      'SELECT key FROM "FirmJobType" WHERE "organizationId"=$1 AND active ORDER BY "sortOrder"',
      ["org_horizon"],
    );
    expect(types.rows.map((row) => row.key)).toEqual([
      "RETAIL_FLAGSHIP",
      "RETAIL_RENOVATION",
      "RETAIL_CONCEPT_STORE",
      "RETAIL_SHOWROOM",
    ]);
    const related = await sql.query(
      `SELECT a.key AS source, b.key AS target FROM "FirmJobTypeRelation" r
      JOIN "FirmJobType" a ON a.id=r."fromTypeId" AND a."organizationId"=r."organizationId"
      JOIN "FirmJobType" b ON b.id=r."toTypeId" AND b."organizationId"=r."organizationId"
      WHERE r."organizationId"=$1 ORDER BY a.key,b.key`,
      ["org_horizon"],
    );
    expect(related.rows).toEqual([
      { source: "RETAIL_CONCEPT_STORE", target: "RETAIL_FLAGSHIP" },
      { source: "RETAIL_CONCEPT_STORE", target: "RETAIL_RENOVATION" },
      { source: "RETAIL_FLAGSHIP", target: "RETAIL_CONCEPT_STORE" },
      { source: "RETAIL_FLAGSHIP", target: "RETAIL_RENOVATION" },
      { source: "RETAIL_FLAGSHIP", target: "RETAIL_SHOWROOM" },
      { source: "RETAIL_RENOVATION", target: "RETAIL_CONCEPT_STORE" },
      { source: "RETAIL_RENOVATION", target: "RETAIL_FLAGSHIP" },
      { source: "RETAIL_SHOWROOM", target: "RETAIL_FLAGSHIP" },
    ]);
    expect(
      (
        await sql.query(`SELECT p.id FROM "Project" p LEFT JOIN "FirmJobType" t
      ON t."organizationId"=p."organizationId" AND t.key=p.subtype WHERE t.id IS NULL`)
      ).rows,
    ).toEqual([]);
    expect(
      (
        await sql.query(`SELECT q.id FROM "QuoteItem" q LEFT JOIN "FirmQuoteUnit" u
      ON u."organizationId"=q."organizationId" AND u.key=q.unit WHERE u.id IS NULL`)
      ).rows,
    ).toEqual([]);
  });
  it("preserves the original scope-to-pricing mapping and rejects foreign parents", async () => {
    const rows = (
      await sql.query(
        `SELECT c.key, p.key AS parent FROM "FirmWorkCategory" c
      LEFT JOIN "FirmWorkCategory" p ON p.id=c."pricedUnderId" AND p."organizationId"=c."organizationId"
      WHERE c."organizationId"=$1 ORDER BY c."sortOrder"`,
        ["org_horizon"],
      )
    ).rows;
    expect(rows).toEqual([
      { key: "DEMOLITION_CEILING", parent: null },
      { key: "SELECTIVE_DEMOLITION", parent: "DEMOLITION_CEILING" },
      { key: "PARTITIONS_CEILINGS", parent: "DEMOLITION_CEILING" },
      { key: "CUSTOM_MILLWORK", parent: null },
      { key: "LIGHTING_ELECTRICAL", parent: null },
      { key: "IMPORTED_STONE", parent: null },
      { key: "SIGNAGE", parent: null },
      { key: "COORDINATION", parent: null },
      { key: "GENERAL_TRADES", parent: null },
    ]);
    const foreign = (
      await sql.query('SELECT id FROM "FirmWorkCategory" WHERE "organizationId"<>$1 LIMIT 1', [
        "org_horizon",
      ])
    ).rows[0].id;
    await expect(
      sql.query(
        'UPDATE "FirmWorkCategory" SET "pricedUnderId"=$1 WHERE "organizationId"=$2 AND key=$3',
        [foreign, "org_horizon", "CUSTOM_MILLWORK"],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      sql.query(
        'UPDATE "FirmWorkCategory" SET "pricedUnderId"=id WHERE "organizationId"=$1 AND key=$2',
        ["org_horizon", "CUSTOM_MILLWORK"],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("does not overwrite edits when fixture seed is applied again", async () => {
    await sql.query('UPDATE "FirmJobType" SET "nameEn"=$1 WHERE "organizationId"=$2 AND key=$3', [
      "Renamed type",
      "org_horizon",
      "RETAIL_SHOWROOM",
    ]);
    await sql.query(readFileSync("prisma/fixtures/firm-job-types-and-units.sql", "utf8"));
    expect(
      (
        await sql.query('SELECT "nameEn" FROM "FirmJobType" WHERE "organizationId"=$1 AND key=$2', [
          "org_horizon",
          "RETAIL_SHOWROOM",
        ])
      ).rows[0].nameEn,
    ).toBe("Renamed type");
  });
  it("rejects cross-organization and self relationships at the database boundary", async () => {
    const own = (
      await sql.query('SELECT id FROM "FirmJobType" WHERE "organizationId"=$1 LIMIT 1', [
        "org_horizon",
      ])
    ).rows[0].id;
    const other = (
      await sql.query('SELECT id FROM "FirmJobType" WHERE "organizationId"<>$1 LIMIT 1', [
        "org_horizon",
      ])
    ).rows[0].id;
    await expect(
      sql.query(
        'INSERT INTO "FirmJobTypeRelation" (id,"organizationId","fromTypeId","toTypeId") VALUES ($1,$2,$3,$4)',
        [randomUUID(), "org_horizon", own, other],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      sql.query(
        'INSERT INTO "FirmJobTypeRelation" (id,"organizationId","fromTypeId","toTypeId") VALUES ($1,$2,$3,$3)',
        [randomUUID(), "org_horizon", own],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
});
