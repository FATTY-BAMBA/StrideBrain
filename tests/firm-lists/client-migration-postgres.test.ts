import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const base = process.env.DATABASE_URL;
const suite = base ? describe.sequential : describe.skip;
const migration = "20261124010000_client_details_and_firm_preferences";
const name = `sb066_upgrade_${randomUUID().replaceAll("-", "")}`;
let admin: Client, sql: Client;
let before: unknown;
async function oldRecords() {
  return {
    clients: (
      await sql.query(
        'SELECT id, "organizationId", "businessKey", "nameEn", "nameZhTw", "clientType", active, "createdAt", "updatedAt" FROM "Client" ORDER BY id',
      )
    ).rows,
    projects: (await sql.query('SELECT row_to_json(p) AS record FROM "Project" p ORDER BY id'))
      .rows,
    quotes: (await sql.query('SELECT row_to_json(q) AS record FROM "QuoteVersion" q ORDER BY id'))
      .rows,
  };
}
suite("SB-066 additive client upgrade", () => {
  beforeAll(async () => {
    const url = new URL(base!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
      throw new Error("DISPOSABLE_LOCAL_DATABASE_ONLY");
    admin = new Client({ connectionString: base });
    await admin.connect();
    await admin.query(`CREATE DATABASE "${name}"`);
    url.pathname = `/${name}`;
    sql = new Client({ connectionString: url.toString() });
    await sql.connect();
    for (const dir of readdirSync("prisma/migrations")
      .filter((dir) => dir < migration)
      .sort())
      await sql.query(readFileSync(`prisma/migrations/${dir}/migration.sql`, "utf8"));
    for (const fixture of [
      "horizon-atelier",
      "stage2-authorization",
      "stage4-comparison",
      "stage5-economics",
      "job-neutral-findings",
      "quote-draft",
      "quote-issue",
      "assistant",
    ])
      await sql.query(readFileSync(`prisma/fixtures/${fixture}.sql`, "utf8"));
    await sql.query(`UPDATE "QuoteVersion" SET status='ISSUED', "issuedAt"='2026-11-20',
      "issuedByMembershipId"='membership_horizon_admin', "documentNumber"='Q-UPGRADE-001',
      "validUntil"='2026-12-20', "approvedAt"='2026-11-20', "authorityState"='APPROVED_COMMERCIAL',
      "documentSnapshot"='{"schemaVersion":"QUOTE-DOCUMENT-1.0","clientName":"Original client","lines":[]}'
      WHERE id='qv_neihu_021_v2'`);
    before = await oldRecords();
    await sql.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  }, 30000);
  afterAll(async () => {
    await sql?.end();
    if (admin) {
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await admin.end();
    }
  });
  it("preserves all pre-existing clients, jobs and issued snapshots", async () => {
    expect(await oldRecords()).toEqual(before);
    const defaults = await sql.query(`SELECT count(*)::int AS count FROM "Client"
      WHERE "contactPerson"<>'' OR phone<>'' OR email<>'' OR address<>'' OR "taxId"<>'' OR note<>''`);
    expect(defaults.rows[0].count).toBe(0);
    const units = await sql.query('SELECT DISTINCT "areaDisplayUnit" FROM "Organization"');
    expect(units.rows).toEqual([{ areaDisplayUnit: "m2" }]);
  });
  it("accepts empty/eight-digit tax IDs and bounds optional details", async () => {
    const client = (await sql.query('SELECT id FROM "Client" ORDER BY id LIMIT 1')).rows[0].id;
    for (const taxId of ["", "12345678"])
      await sql.query('UPDATE "Client" SET "taxId"=$1 WHERE id=$2', [taxId, client]);
    await expect(
      sql.query('UPDATE "Client" SET "taxId"=$1 WHERE id=$2', ["1234567", client]),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      sql.query('UPDATE "Client" SET phone=$1 WHERE id=$2', ["1".repeat(81), client]),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      sql.query('UPDATE "Organization" SET "areaDisplayUnit"=$1', ["sqft"]),
    ).rejects.toMatchObject({ code: "23514" });
  });
});
