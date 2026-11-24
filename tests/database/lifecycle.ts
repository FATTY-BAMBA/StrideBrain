import { randomBytes } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";

export type DatabaseRun = { adminUrl: string; prefix: string; template: string };
const prefixPattern = /^sb_test_[a-f0-9]{16}_$/;
/** Reject URL routing overrides as well as remote hosts, before opening a connection. */
export function localDatabaseUrl(value: string, ci = process.env.CI === "true"): string {
  const url = new URL(value);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]", ...(ci ? ["postgres"] : [])].includes(url.hostname) ||
    [...url.searchParams.keys()].some((key) => key !== "schema")
  )
    throw new Error("TEST_DATABASE_LOCAL_SERVER_REQUIRED");
  url.searchParams.delete("schema");
  return url.toString();
}
export function databaseUrl(run: DatabaseRun, name: string): string {
  ownedName(run, name);
  const url = new URL(localDatabaseUrl(run.adminUrl));
  url.pathname = `/${name}`;
  return url.toString();
}
export function ownedName(run: DatabaseRun, name: string): string {
  if (
    !prefixPattern.test(run.prefix) ||
    !name.startsWith(run.prefix) ||
    !/^sb_test_[a-f0-9]{16}_(?:template|worker_[0-9]+|snapshot_[0-9]+_[a-f0-9]{8})$/.test(name)
  )
    throw new Error("TEST_DATABASE_OWNED_NAME_REQUIRED");
  return `"${name}"`;
}
export function workerName(run: DatabaseRun, id: string): string {
  if (!/^[1-9][0-9]*$/.test(id)) throw new Error("TEST_DATABASE_WORKER_REQUIRED");
  const name = `${run.prefix}worker_${id}`;
  ownedName(run, name);
  return name;
}
export async function adminConnection(run: DatabaseRun): Promise<Client> {
  const admin = new Client({
    connectionString: localDatabaseUrl(run.adminUrl),
    connectionTimeoutMillis: 5000,
  });
  await admin.connect();
  return admin;
}
export async function cloneDatabase(run: DatabaseRun, name: string, source: string): Promise<void> {
  const target = ownedName(run, name);
  const template = source === "template0" ? '"template0"' : ownedName(run, source);
  const admin = await adminConnection(run);
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${target} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${target} TEMPLATE ${template}`);
  } finally {
    await admin.end();
  }
}
export async function removeDatabase(run: DatabaseRun, name: string): Promise<void> {
  const target = ownedName(run, name),
    admin = await adminConnection(run);
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${target} WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}
/** Read the canonical fixture order, including all invariant checks, from the existing scripts. */
export function fixturePaths(script: "db:seed" | "db:verify"): string[] {
  const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts as Record<
    string,
    string
  >;
  const paths = [...scripts[script]!.matchAll(/--file (prisma\/fixtures\/[a-z0-9-]+\.sql)/g)].map(
    (m) => m[1]!,
  );
  if (!paths.length) throw new Error("TEST_FIXTURE_SCRIPT_REQUIRED");
  return paths;
}
export async function createRun(adminUrl: string): Promise<DatabaseRun> {
  const prefix = `sb_test_${randomBytes(8).toString("hex")}_`;
  const run = { adminUrl: localDatabaseUrl(adminUrl), prefix, template: `${prefix}template` };
  try {
    await cloneDatabase(run, run.template, "template0");
    const sql = new Client({ connectionString: databaseUrl(run, run.template) });
    await sql.connect();
    try {
      for (const migration of readdirSync("prisma/migrations")
        .filter((name) => name !== "migration_lock.toml")
        .sort())
        await sql.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
      for (let repeat = 0; repeat < 2; repeat++)
        for (const path of [...fixturePaths("db:seed"), ...fixturePaths("db:verify")])
          await sql.query(readFileSync(path, "utf8"));
    } finally {
      await sql.end();
    }
    return run;
  } catch (error) {
    await cleanupRun(run);
    throw error;
  }
}
export async function cleanupRun(run: DatabaseRun): Promise<void> {
  if (!prefixPattern.test(run.prefix)) throw new Error("TEST_DATABASE_OWNED_NAME_REQUIRED");
  const admin = await adminConnection(run);
  try {
    const rows = await admin.query<{ datname: string }>(
      "SELECT datname FROM pg_database WHERE left(datname, $1)=$2",
      [run.prefix.length, run.prefix],
    );
    for (const { datname } of rows.rows)
      await admin.query(`DROP DATABASE ${ownedName(run, datname)} WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}
