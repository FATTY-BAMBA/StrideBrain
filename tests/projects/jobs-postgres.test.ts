import { withFirmLists } from "../firm-lists/with-firm-lists";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../../.generated/prisma/client";
import { ListProjectClients } from "@/modules/projects/application/list-project-clients";
import type { UpdateStageInput } from "@/modules/projects/domain/job-input";
import { CreateProject } from "@/modules/projects/application/create-project";
import { UpdateProjectStage } from "@/modules/projects/application/update-project-stage";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import {
  PrismaProjectRepository,
  type PrismaProjectReader,
} from "@/repositories/prisma/prisma-project-repository";
import {
  PrismaComparableProjectRepository,
  type PrismaComparableProjectDatabase,
} from "@/repositories/prisma/prisma-comparable-project-repository";
import {
  PrismaComparisonRunRepository,
  type PrismaComparisonRunDatabase,
} from "@/repositories/prisma/prisma-comparison-run-repository";
import { RunComparableProjectAnalysis } from "@/modules/comparisons/application/run-comparable-project-analysis";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import { jobContext, jobInput } from "./job-fixture";
import { ListAuthorizedProjects } from "@/modules/projects/application/list-authorized-projects";
import {
  PrismaProjectListRepository,
  type PrismaProjectListReader,
} from "@/repositories/prisma/prisma-project-list-repository";

const originalURL = process.env.DATABASE_URL;
const databaseName = `stridebrain_sb041_${randomUUID().replaceAll("-", "")}`;
let admin: PrismaClient;
let database: PrismaClient;
const postgres = originalURL ? describe.sequential : describe.skip;
const secret = "synthetic-sb041-test-signing-secret-only";

postgres("SB-041 real PostgreSQL transactions and tenant boundaries", () => {
  beforeAll(async () => {
    if (!originalURL || !/^stridebrain_sb041_[a-f0-9]{32}$/.test(databaseName))
      throw new Error("ISOLATED_DATABASE_REQUIRED");
    admin = new PrismaClient({ adapter: new PrismaPg({ connectionString: originalURL }) });
    await admin.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(originalURL);
    url.pathname = `/${databaseName}`;
    for (const script of ["db:reset-fixture"])
      execFileSync("npm", ["run", script], {
        env: { ...process.env, DATABASE_URL: url.toString() },
        stdio: "pipe",
        timeout: 180_000,
      });
    database = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
  }, 240_000);
  afterAll(async () => {
    await database?.$disconnect();
    if (admin) {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
      await admin.$disconnect();
    }
  });
  function services() {
    const repo = new PrismaProjectWriteRepository(database);
    return { create: new CreateProject(repo), update: new UpdateProjectStage(repo), repo };
  }
  async function actor(membership = "membership_horizon_mei") {
    const repo = new PrismaDemoSessionRepository(database as unknown as PrismaDemoSessionDatabase);
    const issued = await new DemoSessionService(repo, secret).issueForMembership(membership, {
      locale: "en",
    });
    if (!issued) throw new Error("SESSION_REQUIRED");
    const context = await new SignedDemoIdentityContext(repo, secret).resolve(
      new Request("https://stridebrain.test", {
        headers: { cookie: issued.setCookie.split(";")[0]! },
      }),
    );
    if (!context) throw new Error("CONTEXT_REQUIRED");
    return withFirmLists(context, database);
  }
  async function project(key: string) {
    return database.project.findUniqueOrThrow({
      where: { organizationId_businessKey: { organizationId: "org_horizon", businessKey: key } },
      include: { scopes: true, assignments: true },
    });
  }
  async function create() {
    const input = jobInput();
    expect(await services().create.execute(await actor(), input)).toEqual({
      kind: "CREATED",
      businessKey: input.businessKey,
    });
    return input;
  }
  it("creates reviewed context, client, scope, creator assignment and audit; ranks history without a quote", async () => {
    const input = await create();
    const stored = await project(input.businessKey);
    expect(stored).toMatchObject({
      stage: "QUOTE_REVIEW",
      status: "ACTIVE",
      metadataAuthority: "HUMAN_REVIEWED",
      commercialCategoryIds: [...input.commercialCategoryIds].sort(),
    });
    expect(stored.scopes).toHaveLength(input.scopeCategoryIds.length);
    expect(stored.assignments).toHaveLength(1);
    expect(stored.assignments[0]).toMatchObject({
      membershipId: "membership_horizon_mei",
      canReadActuals: false,
    });
    expect(
      await database.auditEvent.count({
        where: { organizationId: "org_horizon", idempotencyKey: input.idempotencyKey },
      }),
    ).toBe(1);
    expect(await database.quote.count({ where: { projectId: stored.id } })).toBe(0);
    const context = await actor();
    expect(context.assignedProjectIds?.has(stored.id)).toBe(true);
    const list = new ListAuthorizedProjects(
      new PrismaProjectListRepository(database as unknown as PrismaProjectListReader),
    );
    const own = await list.execute(context);
    expect(own.kind === "AVAILABLE" && own.projects).toContainEqual({
      businessKey: input.businessKey,
      name: input.name,
      nameEn: input.name,
      nameZhTw: input.name,
      active: true,
      stage: "QUOTE_REVIEW",
    });
    expect(
      JSON.stringify(await list.execute(await actor("membership_northern_owner"))),
    ).not.toContain(input.businessKey);
    const comparison = new RunComparableProjectAnalysis(
      new PrismaProjectRepository(database as unknown as PrismaProjectReader),
      new PrismaComparableProjectRepository(database as unknown as PrismaComparableProjectDatabase),
      new PrismaComparisonRunRepository(database as unknown as PrismaComparisonRunDatabase),
    );
    const result = await comparison.execute(context, input.businessKey);
    expect(result.kind).toBe("COMPLETE");
    if (result.kind === "COMPLETE") expect(result.result.matches.length).toBeGreaterThan(0);
  });
  it("reuses only an existing client in the current organization", async () => {
    const input = { ...jobInput(), clientMode: "existing", clientBusinessKey: "CLIENT-01" };
    expect((await services().create.execute(await actor(), input)).kind).toBe("CREATED");
    expect((await project(input.businessKey)).clientId).toBe("client_horizon_01");
    for (const clientBusinessKey of ["CLIENT-NORTH-01", "MISSING"])
      expect(
        await services().create.execute(await actor(), {
          ...jobInput(),
          clientMode: "existing",
          clientBusinessKey,
        }),
      ).toEqual({ kind: "CLIENT_UNAVAILABLE" });
  });
  it("rejects a duplicate new-client key without modifying the existing client", async () => {
    expect(
      await services().create.execute(await actor(), {
        ...jobInput(),
        clientBusinessKey: "CLIENT-01",
      }),
    ).toEqual({ kind: "CLIENT_DUPLICATE" });
    expect(
      (await database.client.findUniqueOrThrow({ where: { id: "client_horizon_01" } })).nameEn,
    ).toBe("Aster Retail Taiwan");
  });
  it("rejects sequential and concurrent duplicate business keys and creates no orphan clients", async () => {
    const input = jobInput();
    const context = await actor();
    const results = await Promise.all([
      services().create.execute(context, input),
      services().create.execute(
        { ...context, requestId: randomUUID() },
        { ...input, idempotencyKey: randomUUID(), clientBusinessKey: `CLIENT-${randomUUID()}` },
      ),
    ]);
    expect(results.map((r) => r.kind).sort()).toEqual(["CREATED", "DUPLICATE"]);
    expect(
      await services().create.execute(await actor(), { ...input, idempotencyKey: randomUUID() }),
    ).toEqual({ kind: "DUPLICATE" });
    const row = await project(input.businessKey);
    expect(
      await database.auditEvent.count({
        where: {
          organizationId: "org_horizon",
          eventType: "PROJECT_CREATED",
          payload: { path: ["projectId"], equals: row.id },
        },
      }),
    ).toBe(1);
  });
  it("returns the original success for sequential and concurrent matching create retries", async () => {
    const input = jobInput();
    const context = await actor();
    const expected = { kind: "CREATED", businessKey: input.businessKey };
    expect(
      await Promise.all([
        services().create.execute(context, input),
        services().create.execute({ ...context, requestId: randomUUID() }, input),
      ]),
    ).toEqual([expected, expected]);
    expect(
      await services().create.execute(await actor(), {
        ...input,
        scopeCategoryIds: [...input.scopeCategoryIds].reverse(),
      }),
    ).toEqual(expected);
    const row = await project(input.businessKey);
    expect(row.scopes).toHaveLength(input.scopeCategoryIds.length);
    expect(row.assignments).toHaveLength(1);
    expect(await database.project.count({ where: { businessKey: input.businessKey } })).toBe(1);
    expect(await database.client.count({ where: { businessKey: input.clientBusinessKey } })).toBe(
      1,
    );
    expect(
      await database.auditEvent.count({
        where: { organizationId: context.organizationId, idempotencyKey: input.idempotencyKey },
      }),
    ).toBe(1);
    expect(await services().create.execute(context, { ...input, name: "Changed input" })).toEqual({
      kind: "CONFLICT",
    });
    expect(await services().create.execute(await actor("membership_horizon_admin"), input)).toEqual(
      { kind: "CONFLICT" },
    );
    expect(
      await services().create.execute(await actor("membership_horizon_viewer"), input),
    ).toEqual({ kind: "UNAVAILABLE" });
    await database.projectAssignment.deleteMany({ where: { projectId: row.id } });
    expect(await services().create.execute(await actor(), input)).toEqual({ kind: "UNAVAILABLE" });
  });
  it("preserves context classification through the same adapter path", async () => {
    const input = jobInput();
    const context = { ...(await actor()), dataMode: "TENANT_PRIVATE" as const };
    expect((await services().create.execute(context, input)).kind).toBe("CREATED");
    expect((await project(input.businessKey)).dataClassification).toBe("TENANT_PRIVATE");
    expect(
      await services().update.execute(context, {
        ...input,
        stage: "DESIGN",
        expectedStage: "QUOTE_REVIEW",
        idempotencyKey: randomUUID(),
      }),
    ).toEqual({ kind: "UPDATED" });
  });
  it("lists only active clients from the trusted organization and denies a Viewer", async () => {
    const input = await create();
    await database.client.update({
      where: {
        organizationId_businessKey: {
          organizationId: "org_horizon",
          businessKey: input.clientBusinessKey,
        },
      },
      data: { active: false },
    });
    const list = new ListProjectClients(services().repo);
    const own = await list.execute(await actor());
    expect(own.kind).toBe("AVAILABLE");
    expect(JSON.stringify(own)).toContain("CLIENT-01");
    expect(JSON.stringify(own)).not.toContain("CLIENT-NORTH-01");
    expect(JSON.stringify(own)).not.toContain(input.clientBusinessKey);
    const foreign = await list.execute(await actor("membership_northern_owner"));
    expect(JSON.stringify(foreign)).toContain("CLIENT-NORTH-01");
    expect(JSON.stringify(foreign)).not.toContain('"CLIENT-01"');
    const viewer = await actor("membership_horizon_viewer");
    expect(await list.execute(viewer)).toEqual({ kind: "UNAVAILABLE" });
    expect(await services().repo.listActiveClients(viewer)).toEqual([]);
  });
  it("rejects COMPLETE through both application and adapter without changing a row or audit", async () => {
    const input = await create();
    const context = await actor();
    const command = {
      ...input,
      stage: "COMPLETE",
      expectedStage: "QUOTE_REVIEW",
      idempotencyKey: randomUUID(),
    };
    expect(await services().update.execute(context, command)).toEqual({ kind: "INVALID" });
    expect(
      await services().repo.updateStageWithAudit(context, command as unknown as UpdateStageInput),
    ).toEqual({ kind: "INVALID" });
    expect((await project(input.businessKey)).stage).toBe("QUOTE_REVIEW");
    expect(
      await database.auditEvent.count({ where: { idempotencyKey: command.idempotencyKey } }),
    ).toBe(0);
  });
  it("rejects Viewer writes by both application and adapter", async () => {
    const viewer = await actor("membership_horizon_viewer");
    const input = jobInput();
    const stage = {
      businessKey: "PRJ-XINYI-026",
      stage: "DESIGN" as const,
      expectedStage: "QUOTE_REVIEW" as const,
      idempotencyKey: randomUUID(),
    };
    expect(await services().create.execute(viewer, input)).toEqual({ kind: "UNAVAILABLE" });
    expect(await services().repo.createWithAudit(viewer, input)).toEqual({ kind: "UNAVAILABLE" });
    expect(await services().update.execute(viewer, stage)).toEqual({ kind: "UNAVAILABLE" });
    expect(await services().repo.updateStageWithAudit(viewer, stage)).toEqual({
      kind: "UNAVAILABLE",
    });
  });
  it("hides and refuses updates to foreign, unassigned, deleted, and missing jobs", async () => {
    const input = await create();
    const foreign = await actor("membership_northern_owner");
    const reader = new PrismaProjectRepository(database as unknown as PrismaProjectReader);
    expect(await reader.getAuthorizedByBusinessKey(foreign, input.businessKey)).toBeNull();
    for (const businessKey of [input.businessKey, "MISSING"])
      expect(
        await services().update.execute(foreign, {
          businessKey,
          stage: "DESIGN",
          expectedStage: "QUOTE_REVIEW",
          idempotencyKey: randomUUID(),
        }),
      ).toEqual({ kind: "UNAVAILABLE" });
    const row = await project(input.businessKey);
    await database.projectAssignment.deleteMany({ where: { projectId: row.id } });
    expect(
      await services().update.execute(await actor(), {
        businessKey: input.businessKey,
        stage: "DESIGN",
        expectedStage: "QUOTE_REVIEW",
        idempotencyKey: randomUUID(),
      }),
    ).toEqual({ kind: "UNAVAILABLE" });
    await database.project.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
    expect(
      await services().update.execute(await actor("membership_horizon_admin"), {
        businessKey: input.businessKey,
        stage: "DESIGN",
        expectedStage: "QUOTE_REVIEW",
        idempotencyKey: randomUUID(),
      }),
    ).toEqual({ kind: "UNAVAILABLE" });
  });
  it("updates stage once with audit, safely replays, rejects changed keys and stale forms, and leaves completion status alone", async () => {
    const input = await create();
    const command = {
      businessKey: input.businessKey,
      stage: "HANDOVER",
      expectedStage: "QUOTE_REVIEW",
      idempotencyKey: randomUUID(),
    };
    expect(await services().update.execute(await actor(), command)).toEqual({ kind: "UPDATED" });
    expect(await services().update.execute(await actor(), command)).toEqual({ kind: "UPDATED" });
    expect(await services().update.execute(await actor(), { ...command, stage: "DESIGN" })).toEqual(
      { kind: "CONFLICT" },
    );
    expect(
      await services().update.execute(await actor(), { ...command, idempotencyKey: randomUUID() }),
    ).toEqual({ kind: "CONFLICT" });
    expect(
      await database.auditEvent.count({ where: { idempotencyKey: command.idempotencyKey } }),
    ).toBe(1);
    expect(await project(input.businessKey)).toMatchObject({
      stage: "HANDOVER",
      status: "ACTIVE",
      completedAt: null,
    });
  });
  it("serializes conflicting concurrent stage changes", async () => {
    const input = await create();
    const context = await actor();
    const results = await Promise.all(
      ["DESIGN", "APPROVED"].map((stage) =>
        services().update.execute(
          { ...context, requestId: randomUUID() },
          {
            businessKey: input.businessKey,
            stage,
            expectedStage: "QUOTE_REVIEW",
            idempotencyKey: randomUUID(),
          },
        ),
      ),
    );
    expect(results.map((r) => r.kind).sort()).toEqual(["CONFLICT", "UPDATED"]);
  });
  it("rolls back all creation rows and a stage change when its audit insert fails", async () => {
    const existing = await create();
    const input = jobInput();
    const before = await database.projectAssignment.count();
    await database.$executeRawUnsafe(
      `CREATE FUNCTION sb041_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."eventType" IN ('PROJECT_CREATED','PROJECT_STAGE_UPDATED') THEN RAISE EXCEPTION 'synthetic audit failure'; END IF; RETURN NEW; END $$`,
    );
    await database.$executeRawUnsafe(
      'CREATE TRIGGER sb041_fail_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION sb041_fail_audit()',
    );
    try {
      expect(await services().create.execute(jobContext(), input)).toEqual({ kind: "FAILED" });
      expect(await database.project.count({ where: { businessKey: input.businessKey } })).toBe(0);
      expect(await database.client.count({ where: { businessKey: input.clientBusinessKey } })).toBe(
        0,
      );
      expect(await database.projectAssignment.count()).toBe(before);
      expect(
        await services().update.execute(await actor(), {
          businessKey: existing.businessKey,
          stage: "DESIGN",
          expectedStage: "QUOTE_REVIEW",
          idempotencyKey: randomUUID(),
        }),
      ).toEqual({ kind: "FAILED" });
      expect((await project(existing.businessKey)).stage).toBe("QUOTE_REVIEW");
    } finally {
      await database.$executeRawUnsafe('DROP TRIGGER sb041_fail_audit ON "AuditEvent"');
      await database.$executeRawUnsafe("DROP FUNCTION sb041_fail_audit()");
    }
  });
});
