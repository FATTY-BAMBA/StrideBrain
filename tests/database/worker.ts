import { randomBytes } from "node:crypto";
import { Client } from "pg";
import {
  cloneDatabase,
  databaseUrl,
  ownedName,
  removeDatabase,
  workerName,
  type DatabaseRun,
} from "./lifecycle";

type CachedPrisma = typeof globalThis & { __stridebrainPrisma?: { $disconnect(): Promise<void> } };
export async function disconnectWorkerPrisma() {
  const global = globalThis as CachedPrisma,
    prisma = global.__stridebrainPrisma;
  delete global.__stridebrainPrisma;
  await prisma?.$disconnect();
}
export function workerRun(): DatabaseRun | undefined {
  const encoded = process.env.STRIDEBRAIN_TEST_DATABASE_RUN;
  if (!encoded) return undefined;
  return JSON.parse(encoded) as DatabaseRun;
}
export function workerDatabaseName(run: DatabaseRun): string {
  return workerName(run, process.env.VITEST_POOL_ID ?? "");
}
export async function resetWorkerDatabase(empty = false): Promise<void> {
  const run = workerRun();
  if (!run) throw new Error("MANAGED_TEST_DATABASE_REQUIRED");
  await disconnectWorkerPrisma();
  const name = workerDatabaseName(run);
  await cloneDatabase(run, name, empty ? "template0" : run.template);
  process.env.DATABASE_URL = databaseUrl(run, name);
}
/** Only nested synthetic scenarios need snapshots; test SQL always uses the same worker name. */
const scopes: { sql: Client; snapshot: string | undefined }[] = [];
export async function openWorkerScope() {
  const run = workerRun();
  if (!run) return undefined;
  const parent = scopes.at(-1),
    name = workerDatabaseName(run);
  await disconnectWorkerPrisma();
  let snapshot: string | undefined;
  if (parent) {
    await parent.sql.end();
    snapshot = `${run.prefix}snapshot_${process.env.VITEST_POOL_ID}_${randomBytes(4).toString("hex")}`;
    ownedName(run, snapshot);
    await cloneDatabase(run, snapshot, name);
  }
  await resetWorkerDatabase();
  const frame = { sql: new Client({ connectionString: databaseUrl(run, name) }), snapshot };
  await frame.sql.connect();
  scopes.push(frame);
  return {
    get sql() {
      return frame.sql;
    },
    async close() {
      if (scopes.at(-1) !== frame) throw new Error("TEST_DATABASE_SCOPE_ORDER");
      await disconnectWorkerPrisma();
      await frame.sql.end();
      scopes.pop();
      if (snapshot && parent) {
        await cloneDatabase(run, name, snapshot);
        await removeDatabase(run, snapshot);
        parent.sql = new Client({ connectionString: databaseUrl(run, name) });
        await parent.sql.connect();
      }
    },
  };
}
