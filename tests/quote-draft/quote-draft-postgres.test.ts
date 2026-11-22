import { PreviewQuoteTotals } from "@/modules/quote-draft/application/preview-quote-totals";
import { GetQuoteDraftEvidence } from "@/modules/quote-draft/application/get-quote-draft-evidence";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
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

import { roleBundle } from "@/modules/runtime-context/capabilities";

const suite = process.env.DATABASE_URL ? describe : describe.skip;
const baseUrl = process.env.DATABASE_URL;
let admin: Client;
let sql: Client;
const databaseName = `sb050_quote_${randomUUID().replaceAll("-", "")}`;
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
    "quote-draft",
    "verify-quote-draft",
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

import { PrepareQuoteDraft } from "@/modules/quote-draft/application/prepare-quote-draft";
import { SaveQuoteDraft } from "@/modules/quote-draft/application/save-quote-draft";
import { GetQuoteDraft } from "@/modules/quote-draft/application/get-quote-draft";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { CreateProject } from "@/modules/projects/application/create-project";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import { jobInput } from "../projects/job-fixture";
import { categoryLabel } from "@/modules/localization/jobs";
import type { SaveDraftInput } from "@/modules/quote-draft/domain/save-input";

function services() {
  const repo = new PrismaQuoteDraftRepository(getPrismaClient());
  const codec = new SignedDraftPreparationCodec("synthetic-quote-draft-signing-secret-32-bytes");
  return {
    prepare: new PrepareQuoteDraft(repo, codec),
    save: new SaveQuoteDraft(repo, codec),
    read: new GetQuoteDraft(repo),
    evidence: new GetQuoteDraftEvidence(repo, codec),
    totals: new PreviewQuoteTotals(repo),
  };
}
async function newJob() {
  const context = await actor("membership_horizon_admin");
  const input = { ...jobInput(), scopeCategoryIds: ["IMPORTED_STONE", "CUSTOM_MILLWORK"] };
  expect(
    (
      await new CreateProject(new PrismaProjectWriteRepository(getPrismaClient())).execute(
        context,
        input,
      )
    ).kind,
  ).toBe("CREATED");
  return input.businessKey;
}
async function compare(projectKey: string, membership = "membership_horizon_admin") {
  const context = await actor(membership);
  const outcome = await createComparisonServices().runComparison.execute(context, projectKey);
  if (outcome.kind !== "COMPLETE") throw new Error(outcome.kind);
  return outcome.result;
}
async function prepared(projectKey: string) {
  const outcome = await services().prepare.execute(
    await actor("membership_horizon_admin"),
    projectKey,
  );
  if (outcome.kind !== "PREPARED") throw new Error(outcome.kind);
  return outcome;
}
function saveInput(
  projectKey: string,
  value: Awaited<ReturnType<typeof prepared>>,
): SaveDraftInput {
  return {
    projectKey,
    idempotencyKey: randomUUID(),
    baseVersionId: value.preparation.baseVersionId,
    preparationToken: value.token,
    lines: value.preparation.suggestions.map((line) => ({
      categoryId: line.categoryId,
      description: categoryLabel("en", line.categoryId),
      amount: line.basis.suggestedAmount ?? "1000.00",
    })),
  };
}
suite.sequential("SB-050 scoped quote drafting on real PostgreSQL", () => {
  it("prepares only a current own comparison, saves nothing, exposes exact suggestions and source lines", async () => {
    const key = await newJob();
    const owner = await actor("membership_horizon_admin");
    expect(await services().prepare.execute(owner, key)).toEqual({ kind: "NO_COMPARISON" });
    await compare(key);
    const before = await getPrismaClient().quoteVersion.count();
    const result = await prepared(key);
    expect(result.preparation.suggestions).toHaveLength(2);
    expect(await services().totals.execute(owner, saveInput(key, result))).toHaveProperty(
      "amountBeforeTax",
    );
    const home = await createHomeDeskService().execute(owner);
    expect(
      home.kind === "AVAILABLE" &&
        home.decisions.some(
          (decision) => decision.kind === "DRAFT_QUOTE" && decision.project.businessKey === key,
        ),
    ).toBe(true);
    const evidence = await services().evidence.execute(owner, {
      projectKey: key,
      categoryId: result.preparation.suggestions[0]!.categoryId,
      preparationToken: result.token,
    });
    expect(
      evidence.kind === "READY" &&
        evidence.view.sources.every((source) => source.preview.state === "STRUCTURED"),
    ).toBe(true);
    expect(
      result.preparation.suggestions.every(
        (line) => line.basis.suggestedAmount && line.basis.count >= 3,
      ),
    ).toBe(true);
    expect(await getPrismaClient().quoteVersion.count()).toBe(before);
    for (const line of result.preparation.suggestions)
      expect(line.basis.evidenceReferenceIds.length).toBeGreaterThan(0);
  });
  it("saves once on concurrent retries, carries basis through two edits, supersedes and audits", async () => {
    const key = await newJob();
    await compare(key);
    const initial = await prepared(key),
      input = saveInput(key, initial);
    const changed = {
      ...input,
      lines: input.lines.map((line, index) => (index ? line : { ...line, amount: "123456.78" })),
    };
    const owner = await actor("membership_horizon_admin");
    const [a, b] = await Promise.all([
      services().save.execute(owner, changed),
      services().save.execute({ ...owner, requestId: randomUUID() }, changed),
    ]);
    expect(a).toEqual(b);
    expect(a.kind).toBe("SAVED");
    if (a.kind !== "SAVED") throw new Error(a.kind);
    expect(a.versionNumber).toBe(1);
    const home = await createHomeDeskService().execute(owner);
    expect(
      home.kind === "AVAILABLE" &&
        home.decisions.some(
          (decision) => decision.kind === "DRAFT_QUOTE" && decision.project.businessKey === key,
        ),
    ).toBe(false);
    expect(
      await getPrismaClient().auditEvent.count({ where: { idempotencyKey: input.idempotencyKey } }),
    ).toBe(1);
    const audit = await getPrismaClient().auditEvent.findFirstOrThrow({
      where: { idempotencyKey: input.idempotencyKey },
    });
    expect(audit.payload).toMatchObject({
      basisMode: "REFRESHED",
      changedCategoryIds: [changed.lines[0]!.categoryId],
    });
    expect(await services().save.execute(owner, { ...changed, lines: input.lines })).toEqual({
      kind: "CONFLICT",
    });
    let previousId = a.versionId;
    for (const number of [2, 3]) {
      const result = await services().save.execute(await actor("membership_horizon_admin"), {
        ...changed,
        preparationToken: null,
        baseVersionId: previousId,
        idempotencyKey: randomUUID(),
      });
      expect(result.kind).toBe("SAVED");
      if (result.kind !== "SAVED") throw new Error(result.kind);
      expect(result.versionNumber).toBe(number);
      expect(
        await getPrismaClient().quoteVersion.findUniqueOrThrow({ where: { id: previousId } }),
      ).toMatchObject({ supersededById: result.versionId, authorityState: "SUPERSEDED" });
      previousId = result.versionId;
    }
    const read = await services().read.execute(owner, key);
    if (read.kind !== "AVAILABLE" || !read.saved) throw new Error("READ_REQUIRED");
    expect(read.saved.lines.map((line) => line.recorded?.basis)).toEqual(
      initial.preparation.suggestions.map((line) => line.basis),
    );
    expect(await services().prepare.execute(owner, key)).toEqual({ kind: "OUT_OF_DATE" });
    expect(await createComparisonServices().getHomeComparison.execute(owner, key)).toEqual({
      kind: "OUT_OF_DATE",
    });
    const run = await compare(key);
    const economics = await createComparisonServices().runEconomics.execute(
      await actor("membership_horizon_admin"),
      run.run.id,
      run.defaultSelectedProjectKeys,
    );
    expect(
      "result" in economics &&
        economics.result.categories.some(
          (category) => category.quoteVariance.currentAmount === "123456.78",
        ),
    ).toBe(true);
  });
  it("retains typed amounts after area/scope changes, flags the affected basis, and refresh needs current comparison", async () => {
    const key = await newJob();
    await compare(key);
    const initial = await prepared(key);
    const input = saveInput(key, initial),
      owner = await actor("membership_horizon_admin");
    const first = await services().save.execute(owner, input);
    if (first.kind !== "SAVED") throw new Error(first.kind);
    const job = await getPrismaClient().project.findFirstOrThrow({ where: { businessKey: key } });
    await getPrismaClient().project.update({
      where: { id: job.id },
      data: { areaQuantity: "750" },
    });
    await getPrismaClient().projectScope.create({
      data: {
        id: randomUUID(),
        organizationId: "org_horizon",
        projectId: job.id,
        categoryId: "SIGNAGE",
        labelEn: "Signage",
        labelZhTw: "標示",
      },
    });
    const read = await services().read.execute(owner, key);
    if (read.kind !== "AVAILABLE" || !read.saved) throw new Error("READ_REQUIRED");
    expect(read.saved.lines.every((line) => line.basisOutOfDate)).toBe(true);
    expect(read.saved.lines.map((line) => line.amount)).toEqual(
      input.lines.map((line) => line.amount),
    );
    expect(await services().prepare.execute(owner, key)).toEqual({ kind: "OUT_OF_DATE" });
    const edit = {
      ...input,
      baseVersionId: first.versionId,
      preparationToken: null,
      idempotencyKey: randomUUID(),
      lines: [...input.lines, { categoryId: "SIGNAGE", description: "Signage", amount: "5000" }],
    };
    expect(
      (await services().save.execute(await actor("membership_horizon_admin"), edit)).kind,
    ).toBe("SAVED");
    await compare(key);
    const refreshed = await prepared(key);
    expect(
      refreshed.preparation.suggestions.find((line) => line.categoryId === "SIGNAGE"),
    ).toBeDefined();
    const after = await services().read.execute(owner, key);
    expect(
      after.kind === "AVAILABLE" &&
        after.saved?.lines.find((line) => line.categoryId === "SIGNAGE")?.amount,
    ).toBe("5000.00");
  });
  it("refuses Viewer, finance, another tenant, and stale or tampered preparation before writes", async () => {
    const key = await newJob();
    await compare(key);
    const initial = await prepared(key),
      input = saveInput(key, initial);
    for (const name of [
      "membership_horizon_viewer",
      "membership_horizon_finance",
      "membership_northern_owner",
    ]) {
      const context = await actor(name);
      expect((await services().save.execute(context, input)).kind).toBe("UNAVAILABLE");
      expect((await services().prepare.execute(context, key)).kind).toBe("UNAVAILABLE");
    }
    expect(
      (await services().read.execute(await actor("membership_northern_owner"), key)).kind,
    ).toBe("UNAVAILABLE");
    expect(
      (
        await services().save.execute(await actor("membership_horizon_admin"), {
          ...input,
          preparationToken: `x${input.preparationToken}`,
        })
      ).kind,
    ).toBe("INVALID");
    await getPrismaClient().project.updateMany({
      where: { businessKey: key },
      data: { areaQuantity: "999" },
    });
    expect(
      (await services().save.execute(await actor("membership_horizon_admin"), input)).kind,
    ).toBe("OUT_OF_DATE");
    expect(
      await getPrismaClient().auditEvent.count({ where: { idempotencyKey: input.idempotencyKey } }),
    ).toBe(0);
  });
  it("does not expose amounts for structural access or basis when any source is unreadable", async () => {
    const key = await newJob();
    await compare(key);
    const initial = await prepared(key);
    const owner = await actor("membership_horizon_admin");
    expect((await services().save.execute(owner, saveInput(key, initial))).kind).toBe("SAVED");
    const db = getPrismaClient(),
      spy = vi.spyOn(db.quoteVersion, "findFirst");
    const structural = await services().read.execute(
      { ...owner, capabilities: roleBundle("VIEWER") },
      key,
    );
    expect(structural.kind === "AVAILABLE" && structural.canReadAmounts).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    const restricted = {
      ...owner,
      capabilities: new Set(
        [...owner.capabilities].filter((capability) => capability !== "evidence:read"),
      ),
    };
    const read = await services().read.execute(restricted, key);
    if (read.kind !== "AVAILABLE" || !read.saved) throw new Error("READ_REQUIRED");
    expect(read.saved.lines.every((line) => line.recorded === null && line.basisUnavailable)).toBe(
      true,
    );
    expect(read.saved.lines[0]?.amount).toBeDefined();
    expect(JSON.stringify(read)).not.toContain("medianRate");
    // Even the owner loses the entire basis when just one underlying source is restricted.
    const sourceId = initial.preparation.suggestions[0]!.basis.evidenceReferenceIds[0]!;
    await db.evidenceReference.update({
      where: { id: sourceId },
      data: { dataClassification: "TENANT_RESTRICTED" },
    });
    try {
      const changed = await services().read.execute(owner, key);
      expect(changed.kind === "AVAILABLE" && changed.saved?.lines[0]?.basisUnavailable).toBe(true);
      const panel = await services().evidence.execute(owner, {
        projectKey: key,
        categoryId: initial.preparation.suggestions[0]!.categoryId,
        preparationToken: null,
      });
      expect(panel.kind).toBe("ACCESS_CHANGED");
    } finally {
      await db.evidenceReference.update({
        where: { id: sourceId },
        data: { dataClassification: "DEMO_SYNTHETIC" },
      });
    }
  });
  it("uses only the viewing member's comparison", async () => {
    await compare("PRJ-XINYI-026", "membership_horizon_mei");
    expect(
      await services().prepare.execute(await actor("membership_horizon_admin"), "PRJ-XINYI-026"),
    ).toEqual({ kind: "OUT_OF_DATE" });
  });
  it("shows a selected source conflict, abstains below the shared threshold, and opens the existing panel", async () => {
    const key = await newJob();
    await compare(key);
    const first = await prepared(key);
    const owner = await actor("membership_horizon_admin"),
      db = getPrismaClient();
    const category = first.preparation.suggestions[0]!;
    const sourceId = category.basis.evidenceReferenceIds[0]!;
    const source = await db.evidenceReference.findUniqueOrThrow({ where: { id: sourceId } });
    const alternateId = randomUUID(),
      conflictId = randomUUID(),
      conflictKey = `quote-test-${randomUUID()}`;
    await db.evidenceReference.create({
      data: {
        ...source,
        locator: { kind: "structured-line", lineNumber: 1 },
        id: alternateId,
        claimKey: "quote-draft-test-conflict",
        supportedValue: { amount: "1.00", currency: "TWD" },
      },
    });
    await db.evidenceConflict.create({
      data: {
        id: conflictId,
        organizationId: owner.organizationId,
        conflictKey,
        primaryEvidenceId: sourceId,
        conflictingEvidenceId: alternateId,
        status: "OPEN",
      },
    });
    try {
      const changed = await prepared(key),
        line = changed.preparation.suggestions.find(
          (entry) => entry.categoryId === category.categoryId,
        )!;
      expect(line.basis.suggestedAmount).toBeUndefined();
      expect(line.basis.count).toBe(2);
      expect(line.basis.conflictEvidenceIds).toContain(sourceId);
      const panel = await services().evidence.execute(owner, {
        projectKey: key,
        categoryId: category.categoryId,
        preparationToken: changed.token,
        selection: {
          mode: "CONFLICT",
          comparisonRunId: changed.preparation.comparisonRunId,
          conflictKey,
        },
      });
      expect(panel.kind === "READY" && panel.view.conflict?.records.length).toBe(2);
    } finally {
      await db.evidenceConflict.delete({ where: { id: conflictId } });
      await db.evidenceReference.delete({ where: { id: alternateId } });
    }
  });
  it("actual-cost flags are absent when preparing without actual-cost access and hidden when that access is revoked", async () => {
    const owner = await actor("membership_horizon_admin"),
      input = { ...jobInput(), scopeCategoryIds: ["COORDINATION", "CUSTOM_MILLWORK"] };
    expect(
      (
        await new CreateProject(new PrismaProjectWriteRepository(getPrismaClient())).execute(
          owner,
          input,
        )
      ).kind,
    ).toBe("CREATED");
    await compare(input.businessKey);
    const value = await prepared(input.businessKey);
    expect(value.preparation.suggestions.some((line) => line.basis.actualExceeded)).toBe(true);
    expect(
      (
        await services().save.execute(
          await actor("membership_horizon_admin"),
          saveInput(input.businessKey, value),
        )
      ).kind,
    ).toBe("SAVED");
    const restricted = {
      ...owner,
      requestId: randomUUID(),
      capabilities: new Set(
        [...owner.capabilities].filter((capability) => capability !== "commercial:actual-read"),
      ),
    };
    const read = await services().read.execute(restricted, input.businessKey);
    expect(JSON.stringify(read)).not.toContain("actualExceeded");
    const compared = await createComparisonServices().runComparison.execute(
      restricted,
      input.businessKey,
    );
    expect(compared.kind).toBe("COMPLETE");
    const preparedRestricted = await services().prepare.execute(restricted, input.businessKey);
    expect(preparedRestricted.kind).toBe("PREPARED");
    expect(JSON.stringify(preparedRestricted)).not.toContain("actualExceeded");
  });
});
