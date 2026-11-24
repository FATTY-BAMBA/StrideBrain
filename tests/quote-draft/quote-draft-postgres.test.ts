import { withFirmLists } from "../firm-lists/with-firm-lists";
import { seededFirmLists } from "@/fixtures/firm-lists";
import { PreviewQuoteTotals } from "@/modules/quote-draft/application/preview-quote-totals";
import { GetQuoteDraftEvidence } from "@/modules/quote-draft/application/get-quote-draft-evidence";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Client } from "pg";
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
let sql: Client;
beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  sql = new Client({ connectionString: process.env.DATABASE_URL });
  await sql.connect();
});
afterAll(async () => {
  await disconnectPrismaClientForTests();
  await sql?.end();
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
  return withFirmLists(context);
}

import { PrepareQuoteDraft } from "@/modules/quote-draft/application/prepare-quote-draft";
import { SaveQuoteDraft } from "@/modules/quote-draft/application/save-quote-draft";
import { GetQuoteDraft } from "@/modules/quote-draft/application/get-quote-draft";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { CreateProject } from "@/modules/projects/application/create-project";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import { jobInput } from "../projects/job-fixture";
import { money } from "@/modules/finance/fixed-decimal";
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
async function newJob(scopeCategoryIds = ["IMPORTED_STONE", "CUSTOM_MILLWORK"]) {
  const context = await actor("membership_horizon_admin");
  const input = { ...jobInput(), scopeCategoryIds };
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
      description: categoryLabel("en", line.categoryId, seededFirmLists.workCategories),
      amount: line.basis.suggestedAmount ?? "1000.00",
    })),
  };
}
suite.sequential("SB-050 scoped quote drafting on real PostgreSQL", () => {
  it("saves a configured quote unit, rejects unknown units, and carries a retired unit on edit", async () => {
    const key = await newJob();
    await compare(key);
    const initial = await prepared(key),
      input = saveInput(key, initial);
    await sql.query(
      `INSERT INTO "FirmQuoteUnit" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder","updatedAt") VALUES ('test-unit','org_horizon','test-unit','Package','組',20,NOW())`,
    );
    const owner = await actor("membership_horizon_admin");
    const lines = input.lines.map((line) => ({ ...line, unit: "test-unit" }));
    expect(
      await services().save.execute(owner, {
        ...input,
        lines: lines.map((line) => ({ ...line, unit: "foreign-unit" })),
      }),
    ).toEqual({ kind: "INVALID" });
    const saved = await services().save.execute(owner, { ...input, lines });
    expect(saved.kind).toBe("SAVED");
    if (saved.kind !== "SAVED") return;
    expect(
      (
        await sql.query('SELECT DISTINCT unit FROM "QuoteItem" WHERE "quoteVersionId"=$1', [
          saved.versionId,
        ])
      ).rows,
    ).toEqual([{ unit: "test-unit" }]);
    await sql.query('UPDATE "FirmQuoteUnit" SET active=false WHERE id=$1', ["test-unit"]);
    const edited = await services().save.execute(await actor("membership_horizon_admin"), {
      ...input,
      lines,
      baseVersionId: saved.versionId,
      preparationToken: null,
      idempotencyKey: randomUUID(),
    });
    expect(edited.kind).toBe("SAVED");
  });

  it("prepares and saves one demolition/ceiling price, then compares it with past prices", async () => {
    const key = await newJob([
      "SELECTIVE_DEMOLITION",
      "PARTITIONS_CEILINGS",
      "CUSTOM_MILLWORK",
      "IMPORTED_STONE",
    ]);
    await compare(key);
    const initial = await prepared(key),
      input = saveInput(key, initial);
    expect(
      initial.preparation.suggestions.filter((line) => line.categoryId === "DEMOLITION_CEILING"),
    ).toHaveLength(1);
    const suggestion = initial.preparation.suggestions.find(
      (line) => line.categoryId === "DEMOLITION_CEILING",
    )!;
    expect(suggestion.categoryId).toBe("DEMOLITION_CEILING");
    expect(suggestion.basis.suggestedAmount).toBeDefined();
    const owner = await actor("membership_horizon_admin");
    expect(
      await services().save.execute(owner, {
        ...input,
        lines: [{ categoryId: "SIGNAGE", description: "wrong pricing category", amount: "1000" }],
      }),
    ).toEqual({ kind: "INVALID" });
    expect((await services().save.execute(owner, input)).kind).toBe("SAVED");
    const run = await compare(key);
    const economics = await createComparisonServices().runEconomics.execute(
      await actor("membership_horizon_admin"),
      run.run.id,
      run.defaultSelectedProjectKeys,
    );
    if (!("result" in economics)) throw new Error("ECONOMICS_REQUIRED");
    const category = economics.result.categories.find(
      (entry) => entry.categoryId === "DEMOLITION_CEILING",
    );
    expect(money(category!.quoteVariance.currentAmount!).atoms).toBe(
      money(suggestion.basis.suggestedAmount!).atoms,
    );
    expect(category?.quoteVariance.variancePercent).toBeDefined();
  });
  it("keeps the combined rate as a reference for partial coverage and detects a coverage-only change", async () => {
    const key = await newJob(["PARTITIONS_CEILINGS", "CUSTOM_MILLWORK", "IMPORTED_STONE"]);
    await compare(key);
    const initial = await prepared(key),
      input = saveInput(key, initial);
    expect(
      initial.preparation.suggestions.filter((line) => line.categoryId === "DEMOLITION_CEILING"),
    ).toHaveLength(1);
    const basis = initial.preparation.suggestions.find(
      (line) => line.categoryId === "DEMOLITION_CEILING",
    )!.basis;
    expect(basis.medianRate).toBeDefined();
    expect(basis.suggestedAmount).toBeUndefined();
    const owner = await actor("membership_horizon_admin");
    const saved = await services().save.execute(owner, input);
    if (saved.kind !== "SAVED") throw new Error(saved.kind);
    const job = await getPrismaClient().project.findFirstOrThrow({ where: { businessKey: key } });
    await getPrismaClient().projectScope.create({
      data: {
        id: randomUUID(),
        organizationId: job.organizationId,
        projectId: job.id,
        categoryId: "SELECTIVE_DEMOLITION",
        labelEn: "Selective demolition",
        labelZhTw: "選擇性拆除",
      },
    });
    const read = await services().read.execute(owner, key);
    if (read.kind !== "AVAILABLE" || !read.saved) throw new Error("READ_REQUIRED");
    expect(read.saved.lines.find((line) => line.categoryId === "DEMOLITION_CEILING")).toMatchObject(
      {
        amount: "1000.00",
        basisOutOfDate: true,
        recorded: { basis },
      },
    );
    expect(
      (
        await services().save.execute(
          { ...owner, requestId: randomUUID() },
          {
            ...input,
            baseVersionId: saved.versionId,
            preparationToken: null,
            idempotencyKey: randomUUID(),
          },
        )
      ).kind,
    ).toBe("SAVED");
  });
  it("stores both default category labels and edits only the viewed language across versions", async () => {
    const key = await newJob();
    await compare(key);
    const initial = await prepared(key),
      input = saveInput(key, initial);
    const owner = await actor("membership_horizon_admin");
    let saved = await services().save.execute(owner, input);
    if (saved.kind !== "SAVED") throw new Error(saved.kind);
    const db = getPrismaClient();
    for (const line of await db.quoteItem.findMany({
      where: { quoteVersionId: saved.versionId },
    })) {
      expect(line.descriptionEn).toBe(
        categoryLabel("en", line.categoryId, seededFirmLists.workCategories),
      );
      expect(line.descriptionZhTw).toBe(
        categoryLabel("zh-TW", line.categoryId, seededFirmLists.workCategories),
      );
    }
    const lines = input.lines.map((line) => ({
      ...line,
      description: categoryLabel("zh-TW", line.categoryId, seededFirmLists.workCategories),
    }));
    lines[0]!.description = "訂製木作說明";
    saved = await services().save.execute(
      { ...owner, locale: "zh-TW", requestId: randomUUID() },
      {
        ...input,
        lines,
        preparationToken: null,
        baseVersionId: saved.versionId,
        idempotencyKey: randomUUID(),
      },
    );
    if (saved.kind !== "SAVED") throw new Error(saved.kind);
    expect(
      await db.quoteItem.findFirstOrThrow({
        where: { quoteVersionId: saved.versionId, categoryId: lines[0]!.categoryId },
      }),
    ).toMatchObject({
      descriptionEn: categoryLabel("en", lines[0]!.categoryId, seededFirmLists.workCategories),
      descriptionZhTw: "訂製木作說明",
    });
    const enLines = input.lines.map((line, index) =>
      index ? line : { ...line, description: "Bespoke joinery" },
    );
    saved = await services().save.execute(
      { ...owner, requestId: randomUUID() },
      {
        ...input,
        lines: enLines,
        preparationToken: null,
        baseVersionId: saved.versionId,
        idempotencyKey: randomUUID(),
      },
    );
    if (saved.kind !== "SAVED") throw new Error(saved.kind);
    expect(
      await db.quoteItem.findFirstOrThrow({
        where: { quoteVersionId: saved.versionId, categoryId: lines[0]!.categoryId },
      }),
    ).toMatchObject({ descriptionEn: "Bespoke joinery", descriptionZhTw: "訂製木作說明" });
    const freshKey = await newJob();
    await compare(freshKey);
    const freshInput = saveInput(freshKey, await prepared(freshKey));
    const firstTyped = await services().save.execute(await actor("membership_horizon_admin"), {
      ...freshInput,
      lines: freshInput.lines.map((line) => ({
        ...line,
        description: "A typed first-save description",
      })),
    });
    if (firstTyped.kind !== "SAVED") throw new Error(firstTyped.kind);
    for (const line of await db.quoteItem.findMany({
      where: { quoteVersionId: firstTyped.versionId },
    }))
      expect(line.descriptionZhTw).toBe(
        categoryLabel("zh-TW", line.categoryId, seededFirmLists.workCategories),
      );
  });
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
      data: {
        areaQuantity: "750",
        commercialCategoryIds: [...job.commercialCategoryIds, "SIGNAGE"],
      },
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
