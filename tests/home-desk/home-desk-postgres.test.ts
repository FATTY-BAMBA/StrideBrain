import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Client } from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { getPrismaClient, disconnectPrismaClientForTests } from "@/lib/server/prisma";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import {
  claimFindingText,
  recommendationText,
} from "@/modules/economics/presentation/claim-findings";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
const baseUrl = process.env.DATABASE_URL;
let admin: Client;
let sql: Client;
const databaseName = `sb046_home_${randomUUID().replaceAll("-", "")}`;
beforeAll(async () => {
  if (!baseUrl) return;
  admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  const url = new URL(baseUrl);
  url.pathname = `/${databaseName}`;
  process.env.DATABASE_URL = url.toString();
  await disconnectPrismaClientForTests();
  sql = new Client({ connectionString: url.toString() });
  await sql.connect();
  for (const migration of readdirSync("prisma/migrations")
    .filter((name) => name !== "migration_lock.toml")
    .sort())
    await sql.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  for (const fixture of [
    "horizon-atelier",
    "stage2-authorization",
    "stage4-comparison",
    "stage5-economics",
    "job-neutral-findings",
    "verify-job-neutral-findings",
  ])
    await sql.query(readFileSync(`prisma/fixtures/${fixture}.sql`, "utf8"));
}, 30000);
afterAll(async () => {
  if (!baseUrl) return;
  await disconnectPrismaClientForTests();
  await sql?.end();
  process.env.DATABASE_URL = baseUrl;
  if (admin) {
    await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    await admin.end();
  }
});

async function actor(membership: string) {
  const sessions = new PrismaDemoSessionRepository(
    getPrismaClient() as unknown as PrismaDemoSessionDatabase,
  );
  const secret = "sb044-job-neutral-integration-secret-32-bytes";
  const issued = await new DemoSessionService(sessions, secret).issueForMembership(membership, {
    locale: "en",
    ttlSeconds: 300,
  });
  const context = await new SignedDemoIdentityContext(sessions, secret).resolve(
    new Request("https://stridebrain.test/en", {
      headers: { cookie: issued!.setCookie.split(";")[0]! },
    }),
  );
  if (!context) throw new Error("CONTEXT_REQUIRED");
  return context;
}
suite("Home desk through the real scoped Prisma adapter", () => {
  it("reads Nanjing first and derives the exact price, cost, lesson and source references", async () => {
    const result = await createHomeDeskService().execute(await actor("membership_horizon_admin"));
    if (result.kind !== "AVAILABLE") throw new Error(result.kind);
    expect(result.closedJobs[0]?.project.name).toBe("Nanjing Brand Experience Center");
    expect(result.closedJobs[0]?.lesson).toMatchObject({
      quoteBeforeTax: "17300000.00",
      actualCost: "13420000.00",
      categoryId: "COORDINATION",
      difference: "1720000.00",
      exceeded: true,
    });
    expect(result.closedJobs[0]?.lesson?.evidenceReferenceIds.length).toBeGreaterThan(0);
    const refs = await getPrismaClient().evidenceReference.count({
      where: {
        organizationId: "org_horizon",
        id: { in: [...result.closedJobs[0]!.lesson!.evidenceReferenceIds] },
      },
    });
    expect(refs).toBe(result.closedJobs[0]!.lesson!.evidenceReferenceIds.length);
    expect(result.stageCounts.reduce((total, group) => total + group.count, 0)).toBe(
      result.projects.length,
    );
  });
  it("does not read financial relations for a structural reader, even with closed-job assignment", async () => {
    const adminContext = await actor("membership_horizon_admin");
    const structural = { ...adminContext, capabilities: roleBundle("VIEWER") };
    const db = getPrismaClient();
    const quoteRead = vi.spyOn(db.quoteVersion, "findFirst");
    const costRead = vi.spyOn(db.projectCostVersion, "findFirst");
    const result = await createHomeDeskService().execute(structural);
    if (result.kind !== "AVAILABLE") throw new Error(result.kind);
    expect(result.canCreate).toBe(false);
    expect(result.closedJobs[0]?.project.name).toBe("Nanjing Brand Experience Center");
    expect(
      result.closedJobs.every((job) => job.lesson === null && job.financialState === "RESTRICTED"),
    ).toBe(true);
    expect(quoteRead).not.toHaveBeenCalled();
    expect(costRead).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toMatch(/17300000|13420000|1720000|variancePercent/);
  });
  it("uses the same member's saved Xinyi and Riverside category findings without replay", async () => {
    const context = await actor("membership_horizon_mei");
    const services = createComparisonServices();
    for (const key of ["PRJ-XINYI-026", "J-2611-R7K3"]) {
      const comparison = await services.runComparison.execute(
        { ...context, requestId: randomUUID() },
        key,
      );
      if (comparison.kind !== "COMPLETE") throw new Error(comparison.kind);
      const economics = await services.runEconomics.execute(
        { ...context, requestId: randomUUID() },
        comparison.result.run.id,
        comparison.result.defaultSelectedProjectKeys,
      );
      if (!("result" in economics)) throw new Error(economics.kind);
      if (key === "J-2611-R7K3") {
        expect(recommendationText(economics.result, "zh-TW")).toBe(
          "請審查以下類別及其佐證紀錄：客製木作、標示與展示安裝。",
        );
        expect(recommendationText(economics.result, "en")).toMatch(/^Review.*: .*\.$/);
      }
    }
    const before = await getPrismaClient().comparisonRun.count();
    const result = await createHomeDeskService().execute(context);
    if (result.kind !== "AVAILABLE") throw new Error(result.kind);
    for (const key of ["PRJ-XINYI-026", "J-2611-R7K3"]) {
      const decision = result.decisions.find(
        (item) => item.project.businessKey === key && item.kind === "REVIEW_QUOTE",
      );
      expect(decision?.claim?.categoryId).toBeDefined();
      expect(claimFindingText(decision!.claim!, "zh-TW")).not.toContain(": ");
      if (key === "PRJ-XINYI-026") {
        expect(decision!.claim!.categoryId).toBe("IMPORTED_STONE");
        expect(claimFindingText(decision!.claim!, "en")).toBe(
          "Imported stone and hard finishes: quoted price is 43.0% above past quoted prices.",
        );
        expect(decision!.additionalFindingCount).toBeGreaterThan(0);
      }
      if (key === "J-2611-R7K3")
        expect(decision!.claim!.categoryId).toMatch(/CUSTOM_MILLWORK|SIGNAGE/);
    }
    expect(await getPrismaClient().comparisonRun.count()).toBe(before);
    const another = await createHomeDeskService().execute(await actor("membership_horizon_admin"));
    expect(
      another.kind === "AVAILABLE" &&
        another.findingsNotices.filter((item) => item.kind === "OUT_OF_DATE").length,
    ).toBe(2);
  });
  it("keeps Viewer assigned lists, isolates another tenant, and supports an empty firm", async () => {
    const viewer = await createHomeDeskService().execute(await actor("membership_horizon_viewer"));
    expect(viewer.kind === "AVAILABLE" && viewer.canCreate).toBe(false);
    expect(JSON.stringify(viewer)).not.toMatch(/quoteBeforeTax|actualCost|variancePercent/);
    const northern = await actor("membership_northern_owner");
    const other = await createHomeDeskService().execute(northern);
    expect(JSON.stringify(other)).not.toMatch(/Xinyi|Riverside|Nanjing|PRJ-XINYI|org_horizon/);
    const empty = await createHomeDeskService().execute({
      ...northern,
      organizationId: "empty-test-organization",
    });
    expect(empty.kind === "AVAILABLE" && empty.projects).toEqual([]);
  });
});
