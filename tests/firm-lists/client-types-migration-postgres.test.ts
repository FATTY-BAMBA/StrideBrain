import { resetWorkerDatabase } from "../database/worker";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
const migration = "20261125150000_firm_client_types";
suite("SB-073 populated client-type migration", () => {
  let sql: Client, before: unknown;
  const records = async () => ({
    clients: (await sql.query('SELECT row_to_json(c) FROM "Client" c ORDER BY id')).rows,
    projects: (await sql.query('SELECT row_to_json(p) FROM "Project" p ORDER BY id')).rows,
    quotes: (await sql.query('SELECT row_to_json(q) FROM "QuoteVersion" q ORDER BY id')).rows,
  });
  beforeAll(async () => {
    await resetWorkerDatabase(true);
    sql = new Client({ connectionString: process.env.DATABASE_URL });
    await sql.connect();
    for (const dir of readdirSync("prisma/migrations")
      .filter((dir) => dir < migration)
      .sort())
      await sql.query(readFileSync(`prisma/migrations/${dir}/migration.sql`, "utf8"));
    await sql.query(readFileSync("prisma/fixtures/horizon-atelier.sql", "utf8"));
    await sql.query(
      `UPDATE "Client" SET "clientType"='CUSTOM-FOUNDATION' WHERE "businessKey"='CLIENT-01'`,
    );
    before = await records();
    await sql.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  }, 30000);
  afterAll(async () => {
    await sql?.end();
  });
  it("keeps all rows and keys and adds defaults plus every existing value to each firm", async () => {
    expect(await records()).toEqual(before);
    const missing = await sql.query(
      `SELECT c.id FROM "Client" c LEFT JOIN "FirmClientType" t ON t."organizationId"=c."organizationId" AND t.key=c."clientType" WHERE t.id IS NULL`,
    );
    expect(missing.rows).toEqual([]);
    const defaults = await sql.query(
      `SELECT o.id, count(t.id)::int AS count FROM "Organization" o LEFT JOIN "FirmClientType" t ON t."organizationId"=o.id AND t.key IN ('RETAIL','CORPORATE','HOSPITALITY','INDIVIDUAL') GROUP BY o.id`,
    );
    expect(defaults.rows.length).toBeGreaterThan(0);
    expect(defaults.rows.every((row) => row.count === 4)).toBe(true);
    const custom = await sql.query(
      `SELECT "nameEn", "nameZhTw", active FROM "FirmClientType" WHERE "organizationId"='org_horizon' AND key='CUSTOM-FOUNDATION'`,
    );
    expect(custom.rows).toEqual([
      { nameEn: "CUSTOM-FOUNDATION", nameZhTw: "CUSTOM-FOUNDATION", active: true },
    ]);
  });
});
