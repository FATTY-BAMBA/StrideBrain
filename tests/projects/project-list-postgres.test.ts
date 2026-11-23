import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/prisma/client";
import { ListAuthorizedProjects } from "@/modules/projects/application/list-authorized-projects";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import type { Locale } from "@/modules/localization/config";
import {
  PrismaProjectListRepository,
  type PrismaProjectListReader,
} from "@/repositories/prisma/prisma-project-list-repository";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";

const originalURL = process.env.DATABASE_URL;
const databaseName = `stridebrain_s9_entry_${randomUUID().replaceAll("-", "")}`;
const safeName = /^stridebrain_s9_entry_[a-f0-9]{32}$/;
const secret = "synthetic-project-entry-test-signing-secret-only";
let administrator: PrismaClient | undefined;
let database: PrismaClient<"query">;
let projectQueryCount = 0;
const postgres = originalURL ? describe.sequential : describe.skip;

postgres("Projects entry with real PostgreSQL and signed fixture identities", () => {
  beforeAll(async () => {
    if (!originalURL || !safeName.test(databaseName))
      throw new Error("ISOLATED_TEST_DATABASE_REQUIRED");
    administrator = new PrismaClient({ adapter: new PrismaPg({ connectionString: originalURL }) });
    await administrator.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(originalURL);
    url.pathname = `/${databaseName}`;
    for (const script of ["db:migrate", "db:seed"])
      execFileSync("npm", ["run", script], {
        env: { ...process.env, DATABASE_URL: url.toString() },
        stdio: "pipe",
        timeout: 90_000,
      });
    database = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url.toString() }),
      log: [{ emit: "event", level: "query" }],
    });
    database.$on("query", () => {
      projectQueryCount += 1;
    });
  }, 180_000);
  afterAll(async () => {
    await database?.$disconnect();
    if (administrator && safeName.test(databaseName)) {
      await administrator.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
      );
      await administrator.$disconnect();
    }
  });
  async function actor(membership: string, locale: Locale = "en") {
    const repository = new PrismaDemoSessionRepository(
      database as unknown as PrismaDemoSessionDatabase,
    );
    const issued = await new DemoSessionService(repository, secret).issueForMembership(membership, {
      locale,
    });
    if (!issued) throw new Error("TEST_SESSION_REQUIRED");
    const context = await new SignedDemoIdentityContext(repository, secret).resolve(
      new Request(
        "https://stridebrain.test/en/projects?organizationId=org_horizon&role=ORGANIZATION_ADMIN",
        { headers: { cookie: issued.setCookie.split(";")[0]! } },
      ),
    );
    if (!context) throw new Error("TEST_CONTEXT_REQUIRED");
    return context;
  }
  function useCase() {
    return new ListAuthorizedProjects(
      new PrismaProjectListRepository(database as unknown as PrismaProjectListReader),
    );
  }
  it.each(["mei", "finance", "admin", "viewer"])(
    "shows Xinyi to the authorized %s fixture without commercial data",
    async (persona) => {
      const context = await actor(`membership_horizon_${persona}`);
      projectQueryCount = 0;
      const result = await useCase().execute(context);
      expect(result.kind).toBe("AVAILABLE");
      if (result.kind !== "AVAILABLE") throw new Error("LIST_REQUIRED");
      expect(result.projects).toContainEqual({
        businessKey: "PRJ-XINYI-026",
        nameEn: "Xinyi Flagship Renovation",
        nameZhTw: "信義旗艦店裝修",
        name: "Xinyi Flagship Renovation",
        active: true,
        stage: "QUOTE_REVIEW" as const,
      });
      for (const row of result.projects)
        expect(Object.keys(row).sort()).toEqual([
          "active",
          "businessKey",
          "name",
          "nameEn",
          "nameZhTw",
          "stage",
        ]);
      expect(projectQueryCount).toBe(1);
      expect(JSON.stringify(result)).not.toMatch(
        /PRJ-NORTH|Northern|amount|actualCost|evidenceCount/,
      );
    },
  );
  it("localizes the same authorized record using its stored Traditional Chinese name", async () => {
    const result = await useCase().execute(await actor("membership_horizon_mei", "zh-TW"));
    expect(result.kind === "AVAILABLE" && result.projects).toContainEqual({
      businessKey: "PRJ-XINYI-026",
      nameEn: "Xinyi Flagship Renovation",
      nameZhTw: "信義旗艦店裝修",
      name: "信義旗艦店裝修",
      active: true,
      stage: "QUOTE_REVIEW" as const,
    });
  });
  it("never exposes Horizon records to Northern despite browser tenant/role selectors", async () => {
    const context = await actor("membership_northern_owner");
    expect(context.organizationId).toBe("org_northern");
    const result = await useCase().execute(context);
    expect(result.kind).toBe("AVAILABLE");
    expect(JSON.stringify(result)).not.toMatch(/Xinyi|信義|Horizon|PRJ-XINYI|org_horizon/);
  });
});
