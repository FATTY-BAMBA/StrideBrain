import { Client } from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { getPrismaClient, disconnectPrismaClientForTests } from "@/lib/server/prisma";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
export async function assistantDatabase() {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("LOCAL_DATABASE_REQUIRED");
  const url = new URL(base);
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname))
    throw new Error("DISPOSABLE_LOCAL_DATABASE_ONLY");
  const name = `sb039_${randomUUID().replaceAll("-", "")}`;
  const admin = new Client({ connectionString: base });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${name}"`);
  url.pathname = `/${name}`;
  process.env.DATABASE_URL = url.toString();
  await disconnectPrismaClientForTests();
  const sql = new Client({ connectionString: url.toString() });
  await sql.connect();
  for (const migration of readdirSync("prisma/migrations")
    .filter((n) => n !== "migration_lock.toml")
    .sort())
    await sql.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  for (const fixture of [
    "horizon-atelier",
    "stage2-authorization",
    "stage4-comparison",
    "stage5-economics",
    "job-neutral-findings",
    "quote-draft",
    "quote-issue",
    "assistant",
    "verify-assistant",
  ])
    await sql.query(readFileSync(`prisma/fixtures/${fixture}.sql`, "utf8"));
  return {
    sql,
    async actor(membership = "membership_horizon_admin") {
      const sessions = new PrismaDemoSessionRepository(
          getPrismaClient() as unknown as PrismaDemoSessionDatabase,
        ),
        secret = "assistant-synthetic-integration-secret-32-bytes";
      const session = await new DemoSessionService(sessions, secret).issueForMembership(
        membership,
        { locale: "en", ttlSeconds: 3600 },
      );
      const context = await new SignedDemoIdentityContext(sessions, secret).resolve(
        new Request("https://stridebrain.test/en", {
          headers: { cookie: session!.setCookie.split(";")[0]! },
        }),
      );
      if (!context) throw new Error("CONTEXT_REQUIRED");
      return context;
    },
    async close() {
      await disconnectPrismaClientForTests();
      await sql.end();
      process.env.DATABASE_URL = base;
      await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
      await admin.end();
    },
  };
}
