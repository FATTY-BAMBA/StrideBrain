import { readFileSync } from "node:fs";
import { withFirmLists } from "../firm-lists/with-firm-lists";
import { seededFirmLists } from "@/fixtures/firm-lists";
import { PreviewQuoteTotals } from "@/modules/quote-draft/application/preview-quote-totals";
import { GetQuoteDraftEvidence } from "@/modules/quote-draft/application/get-quote-draft-evidence";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { randomUUID, createHash } from "node:crypto";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { getPrismaClient, disconnectPrismaClientForTests } from "@/lib/server/prisma";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";

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
import { PrismaQuoteIssueRepository } from "@/repositories/prisma/prisma-quote-issue-repository";
import { SignedQuoteIssueCodec } from "@/modules/quote-issue/application/issue-codec";
import {
  PrepareQuoteIssue,
  IssueQuote,
  ReviseIssuedQuote,
  RecordQuoteAcceptance,
  ResolveQuoteConflict,
  GetQuoteIssue,
  GetQuoteDocument,
  GetFirmDetails,
  SaveFirmDetails,
} from "@/modules/quote-issue/application/issue-services";
import { emptyFirmDetails } from "@/modules/quote-issue/domain/contracts";
import { quoteIssueBlockerText } from "@/modules/localization/quote-issue";
function lifecycle(now = () => new Date()) {
  const repo = new PrismaQuoteIssueRepository(getPrismaClient()),
    codec = new SignedQuoteIssueCodec("synthetic-issue-signing-secret-32-bytes", now);
  return {
    prepare: new PrepareQuoteIssue(repo, codec, now),
    issue: new IssueQuote(repo, codec, now),
    revise: new ReviseIssuedQuote(repo),
    accept: new RecordQuoteAcceptance(repo, now),
    resolve: new ResolveQuoteConflict(repo, now),
    read: new GetQuoteIssue(repo, now),
    document: new GetQuoteDocument(repo, now),
    settings: new GetFirmDetails(repo),
    saveSettings: new SaveFirmDetails(repo),
  };
}
const options = { language: "zh-TW", attention: "王小姐" };
async function draft() {
  const key = await newJob();
  await compare(key);
  const input = saveInput(key, await prepared(key)),
    saved = await services().save.execute(await actor("membership_horizon_admin"), input);
  if (saved.kind !== "SAVED") throw Error(saved.kind);
  return { key, versionId: saved.versionId };
}
async function issuePreparation(key: string, versionId: string) {
  const result = await lifecycle().prepare.execute(await actor("membership_horizon_admin"), {
    projectKey: key,
    versionId,
    options,
  });
  if (result.kind !== "PREPARED") throw Error(result.kind);
  return result;
}
async function issueDraft(key: string, versionId: string) {
  const prepared = await issuePreparation(key, versionId),
    input = { projectKey: key, token: prepared.token, idempotencyKey: randomUUID() },
    result = await lifecycle().issue.execute(await actor("membership_horizon_admin"), input);
  expect(result.kind).toBe("ISSUED");
  return { prepared, input, result };
}
import { COMMERCIAL_CATEGORIES, SCOPE_CATEGORIES } from "@/fixtures/firm-lists";
import { validateSaveDraft } from "@/modules/quote-draft/domain/save-input";
import { renderQuotePdf } from "@/modules/quote-issue/infrastructure/render-quote-pdf";
import type { QuoteDocumentSnapshot } from "@/modules/quote-issue/domain/contracts";
// Pre-SB-054 fixture: alphabetical persisted lines, with no comparison run.
async function legacyQuote(status: "DRAFT" | "ISSUED") {
  const key = await newJob([...SCOPE_CATEGORIES]),
    owner = await actor("membership_horizon_admin"),
    db = getPrismaClient();
  const job = await db.project.findFirstOrThrow({ where: { businessKey: key } });
  const snapshot = {
    ...JSON.parse(readFileSync("tests/quote-issue/fixtures/before-sb054.json", "utf8")),
    projectKey: key,
    documentNumber: `${key}-Q1`,
  } as QuoteDocumentSnapshot;
  const quoteId = randomUUID(),
    versionId = randomUUID();
  await db.quote.create({
    data: {
      id: quoteId,
      organizationId: owner.organizationId,
      projectId: job.id,
      businessKey: `quote-${quoteId}`,
    },
  });
  await db.quoteVersion.create({
    data: {
      id: versionId,
      organizationId: owner.organizationId,
      quoteId,
      versionNumber: 1,
      status: "DRAFT",
      authorityState: status === "ISSUED" ? "APPROVED_COMMERCIAL" : "HUMAN_REVIEWED",
      currency: "TWD",
      ...snapshot.totals,
      items: {
        create: snapshot.lines.map((line, index) => ({
          id: randomUUID(),
          organizationId: owner.organizationId,
          lineNumber: index + 1,
          categoryId: line.categoryId,
          descriptionEn: categoryLabel("en", line.categoryId, seededFirmLists.workCategories),
          descriptionZhTw: line.description,
          quantity: "1",
          unit: "lot",
          unitPrice: line.amount,
          amount: line.amount,
          authorityState: status === "ISSUED" ? "APPROVED_COMMERCIAL" : "HUMAN_REVIEWED",
        })),
      },
    },
  });
  if (status === "ISSUED")
    await db.quoteVersion.update({
      where: { id: versionId },
      data: {
        status,
        approvedAt: new Date("2026-11-22T00:00:00Z"),
        issuedAt: new Date("2026-11-22T00:00:00Z"),
        issuedByMembershipId: owner.membershipId,
        documentNumber: snapshot.documentNumber,
        documentSnapshot: JSON.parse(JSON.stringify(snapshot)),
        validUntil: new Date(`${snapshot.validUntil}T00:00:00Z`),
      },
    });
  return { key, job, versionId, snapshot, owner };
}
suite.sequential("SB-052 issuance on real PostgreSQL", () => {
  it("snapshots authorized client details at issue and detects contact edits after preparation", async () => {
    const { key, versionId } = await draft(),
      owner = await actor("membership_horizon_admin"),
      db = getPrismaClient();
    const job = await db.project.findFirstOrThrow({
      where: { businessKey: key, organizationId: owner.organizationId },
    });
    const details = {
      contactPerson: "Synthetic contact",
      address: "Synthetic client address",
      taxId: "12345678",
    };
    await db.client.update({ where: { id: job.clientId }, data: details });
    const initial = await issuePreparation(key, versionId);
    expect(initial.preparation.snapshot.clientDetails).toEqual(details);
    await db.client.update({
      where: { id: job.clientId },
      data: { address: "Updated synthetic address" },
    });
    expect(
      await lifecycle().issue.execute(owner, {
        projectKey: key,
        token: initial.token,
        idempotencyKey: randomUUID(),
      }),
    ).toEqual({ kind: "CHANGED" });
    const withoutClientRead = {
      ...owner,
      capabilities: new Set(
        [...owner.capabilities].filter((capability) => capability !== "client:read"),
      ),
    };
    const deniedDetails = await lifecycle().prepare.execute(withoutClientRead, {
      projectKey: key,
      versionId,
      options,
    });
    expect(deniedDetails.kind).toBe("PREPARED");
    if (deniedDetails.kind === "PREPARED")
      expect(deniedDetails.preparation.snapshot.clientDetails).toBeUndefined();
    await issueDraft(key, versionId);
    const issued = await lifecycle().document.execute(owner, versionId);
    expect(issued.kind).toBe("DOCUMENT");
    if (issued.kind !== "DOCUMENT") return;
    expect(issued.snapshot.clientDetails).toEqual({
      ...details,
      address: "Updated synthetic address",
    });
    await db.client.update({
      where: { id: job.clientId },
      data: {
        contactPerson: "Later synthetic contact",
        address: "Later address",
        taxId: "87654321",
      },
    });
    expect(await lifecycle().document.execute(owner, versionId)).toEqual(issued);
  });
  it("prepares without writes, issues exactly once concurrently, and freezes bilingual snapshot independently of Settings", async () => {
    const { key, versionId } = await draft(),
      before = await getPrismaClient().auditEvent.count(),
      prepared = await issuePreparation(key, versionId);
    expect(await getPrismaClient().auditEvent.count()).toBe(before);
    expect(prepared.preparation.blockers).toEqual([]);
    expect(prepared.preparation.warnings).toContain("COMPARISON_OUT_OF_DATE");
    expect(prepared.preparation.snapshot).toMatchObject({
      language: "zh-TW",
      documentNumber: `${key}-Q1`,
      attention: "王小姐",
    });
    expect(prepared.preparation.snapshot.lines[0]?.description).toBe("客製木作");
    const input = { projectKey: key, token: prepared.token, idempotencyKey: randomUUID() },
      owner = await actor("membership_horizon_admin");
    const [a, b] = await Promise.all([
      lifecycle().issue.execute(owner, input),
      lifecycle().issue.execute({ ...owner, requestId: randomUUID() }, input),
    ]);
    expect(a).toEqual(b);
    expect(a.kind).toBe("ISSUED");
    expect(
      await getPrismaClient().auditEvent.count({ where: { idempotencyKey: input.idempotencyKey } }),
    ).toBe(1);
    const saved = await getPrismaClient().quoteVersion.findUniqueOrThrow({
      where: { id: versionId },
    });
    expect(saved).toMatchObject({
      status: "ISSUED",
      authorityState: "APPROVED_COMMERCIAL",
      documentNumber: `${key}-Q1`,
      issuedByMembershipId: owner.membershipId,
    });
    const settings = await lifecycle().settings.execute(owner);
    if (settings.kind !== "AVAILABLE") throw Error(settings.kind);
    const edited = { ...settings.details, addressZhTw: "已更新的合成地址" };
    expect(
      (
        await lifecycle().saveSettings.execute(
          { ...owner, requestId: randomUUID() },
          { details: edited, idempotencyKey: randomUUID() },
        )
      ).kind,
    ).toBe("SETTINGS_SAVED");
    const document = await lifecycle().document.execute(owner, versionId);
    expect(document.kind === "DOCUMENT" && document.snapshot).toEqual(saved.documentSnapshot);
    await lifecycle().saveSettings.execute(
      { ...owner, requestId: randomUUID() },
      { details: settings.details, idempotencyKey: randomUUID() },
    );
    expect(
      (
        await services().save.execute(owner, {
          projectKey: key,
          baseVersionId: versionId,
          preparationToken: null,
          idempotencyKey: randomUUID(),
          lines: prepared.preparation.snapshot.lines,
        })
      ).kind,
    ).toBe("CONFLICT");
    await expect(
      getPrismaClient().quoteVersion.update({
        where: { id: versionId },
        data: { totalAmount: "1" },
      }),
    ).rejects.toThrow(/IMMUTABLE/);
    await expect(
      getPrismaClient().quoteVersion.update({
        where: { id: versionId },
        data: { documentSnapshot: { changed: true } },
      }),
    ).rejects.toThrow(/IMMUTABLE/);
    const line = await getPrismaClient().quoteItem.findFirstOrThrow({
      where: { quoteVersionId: versionId },
    });
    await expect(
      getPrismaClient().quoteItem.update({
        where: { id: line.id },
        data: { descriptionEn: "Changed" },
      }),
    ).rejects.toThrow(/IMMUTABLE/);
    await expect(getPrismaClient().quoteItem.delete({ where: { id: line.id } })).rejects.toThrow(
      /IMMUTABLE/,
    );
    await expect(
      getPrismaClient().quoteItem.create({ data: { ...line, id: randomUUID(), lineNumber: 99 } }),
    ).rejects.toThrow(/IMMUTABLE/);
    await expect(
      getPrismaClient().quoteVersion.delete({ where: { id: versionId } }),
    ).rejects.toThrow(/IMMUTABLE/);
  });
  it("refuses zero lines, incomplete firm details, stale draft/settings and injected snapshot or tampered confirmation", async () => {
    const { key, versionId } = await draft(),
      owner = await actor("membership_horizon_admin"),
      first = await issuePreparation(key, versionId);
    const input = { projectKey: key, token: first.token, idempotencyKey: randomUUID() };
    expect((await lifecycle().issue.execute(owner, { ...input, snapshot: {} })).kind).toBe(
      "INVALID",
    );
    expect(
      (await lifecycle().issue.execute(owner, { ...input, token: `x${first.token}` })).kind,
    ).toBe("INVALID");
    const settings = await lifecycle().settings.execute(owner);
    if (settings.kind !== "AVAILABLE") throw Error(settings.kind);
    await lifecycle().saveSettings.execute(await actor("membership_horizon_admin"), {
      details: { ...settings.details, taxId: "" },
      idempotencyKey: randomUUID(),
    });
    expect((await issuePreparation(key, versionId)).preparation.blockers).toContain(
      "FIRM_INCOMPLETE",
    );
    expect(await lifecycle().issue.execute(owner, input)).toMatchObject({
      kind: "CHANGED",
      blockers: ["FIRM_INCOMPLETE"],
    });
    await lifecycle().saveSettings.execute(await actor("membership_horizon_admin"), {
      details: settings.details,
      idempotencyKey: randomUUID(),
    });
    const current = await services().read.execute(owner, key);
    if (current.kind !== "AVAILABLE" || !current.saved) throw Error("DRAFT_REQUIRED");
    const newVersion = await services().save.execute(await actor("membership_horizon_admin"), {
      projectKey: key,
      baseVersionId: versionId,
      preparationToken: null,
      idempotencyKey: randomUUID(),
      lines: current.saved.lines.map((line) => ({
        categoryId: line.categoryId,
        description: line.description,
        amount: "0",
      })),
    });
    if (newVersion.kind !== "SAVED") throw Error(newVersion.kind);
    expect((await issuePreparation(key, newVersion.versionId)).preparation.blockers).toContain(
      "ZERO_LINE",
    );
    expect((await issuePreparation(key, versionId)).preparation.blockers).toContain(
      "DRAFT_NOT_CURRENT",
    );
    expect((await lifecycle().issue.execute(owner, input)).kind).toBe("CHANGED");
  });
  it("revises without superseding Q1, carries provenance, issues Q2, accepts once even after expiry, and refuses future acceptance", async () => {
    const { key, versionId } = await draft();
    await issueDraft(key, versionId);
    const owner = await actor("membership_horizon_admin"),
      input = { projectKey: key, versionId, idempotencyKey: randomUUID() };
    const revision = await lifecycle().revise.execute(owner, input);
    expect(await lifecycle().revise.execute(owner, input)).toEqual(revision);
    if (revision.kind !== "REVISED" || !revision.versionId) throw Error(revision.kind);
    expect(
      await getPrismaClient().quoteVersion.findUniqueOrThrow({ where: { id: versionId } }),
    ).toMatchObject({ status: "ISSUED", supersededById: null });
    const prior = await services().read.execute(owner, key);
    if (prior.kind !== "AVAILABLE" || !prior.saved) throw Error("DRAFT_REQUIRED");
    expect(prior.saved.lines.every((line) => line.recorded)).toBe(true);
    const oldBasis = await getPrismaClient().evidenceReference.findMany({
      where: {
        claimKey: "quote-draft:line",
        subjectId: {
          in: (
            await getPrismaClient().quoteItem.findMany({ where: { quoteVersionId: versionId } })
          ).map((line) => line.id),
        },
      },
      orderBy: { subjectId: "asc" },
    });
    expect(prior.saved.lines.map((line) => JSON.stringify(line.recorded)).sort()).toEqual(
      oldBasis
        .map((ref) =>
          JSON.stringify(
            (ref.supportedValue as { quoteDraft: { recorded: unknown } }).quoteDraft.recorded,
          ),
        )
        .sort(),
    );
    const next = await issueDraft(key, revision.versionId);
    expect(next.result).toMatchObject({ documentNumber: `${key}-Q2` });
    expect(
      await getPrismaClient().quoteVersion.findUniqueOrThrow({ where: { id: versionId } }),
    ).toMatchObject({ status: "SUPERSEDED", supersededById: revision.versionId });
    const now = new Date("2030-01-01T00:00:00Z"),
      accept = {
        projectKey: key,
        versionId: revision.versionId,
        date: "2030-01-01",
        note: "Client accepted the expired quote",
        idempotencyKey: randomUUID(),
      };
    expect(
      (
        await lifecycle(() => now).accept.execute(await actor("membership_horizon_admin"), {
          ...accept,
          date: "2030-01-02",
        })
      ).kind,
    ).toBe("INVALID");
    const result = await lifecycle(() => now).accept.execute(
      await actor("membership_horizon_admin"),
      accept,
    );
    expect(result.kind).toBe("ACCEPTED");
    expect(
      await lifecycle(() => now).accept.execute(await actor("membership_horizon_admin"), accept),
    ).toEqual(result);
    expect(
      await getPrismaClient().project.findFirstOrThrow({ where: { businessKey: key } }),
    ).toMatchObject({ stage: "APPROVED" });
    expect(
      await getPrismaClient().auditEvent.count({
        where: { idempotencyKey: accept.idempotencyKey },
      }),
    ).toBe(1);
  });
  it("denies project-manager issue, Viewer PDF/actions and another tenant reads/writes; PM can accept", async () => {
    const { key, versionId } = await draft(),
      prepared = await issuePreparation(key, versionId),
      input = { projectKey: key, token: prepared.token, idempotencyKey: randomUUID() };
    const job = await getPrismaClient().project.findFirstOrThrow({ where: { businessKey: key } });
    for (const id of ["membership_horizon_mei", "membership_horizon_viewer"])
      await getPrismaClient().projectAssignment.create({
        data: {
          id: randomUUID(),
          organizationId: job.organizationId,
          projectId: job.id,
          membershipId: id,
          canReadActuals: false,
          canCreateAction: true,
        },
      });
    for (const id of [
      "membership_horizon_mei",
      "membership_horizon_viewer",
      "membership_northern_owner",
    ]) {
      const context = await actor(id);
      expect((await lifecycle().issue.execute(context, input)).kind).toBe("UNAVAILABLE");
      expect(
        (await lifecycle().prepare.execute(context, { projectKey: key, versionId, options })).kind,
      ).toBe("UNAVAILABLE");
      expect(
        (
          await lifecycle().saveSettings.execute(context, {
            details: {},
            idempotencyKey: randomUUID(),
          })
        ).kind,
      ).not.toBe("SETTINGS_SAVED");
    }
    for (const id of ["membership_horizon_viewer", "membership_northern_owner"]) {
      const context = await actor(id);
      expect((await lifecycle().document.execute(context, versionId, options)).kind).toBe(
        "UNAVAILABLE",
      );
      expect(
        (
          await lifecycle().revise.execute(context, {
            projectKey: key,
            versionId,
            idempotencyKey: randomUUID(),
          })
        ).kind,
      ).not.toBe("REVISED");
      expect(
        (
          await lifecycle().accept.execute(context, {
            projectKey: key,
            versionId,
            date: "2026-01-01",
            note: "",
            idempotencyKey: randomUUID(),
          })
        ).kind,
      ).not.toBe("ACCEPTED");
    }
    await issueDraft(key, versionId);
    expect(
      (await lifecycle().document.execute(await actor("membership_horizon_viewer"), versionId))
        .kind,
    ).toBe("UNAVAILABLE");
    expect(
      (
        await lifecycle().accept.execute(await actor("membership_horizon_mei"), {
          projectKey: key,
          versionId,
          date: "2026-01-01",
          note: "Client acceptance recorded by PM",
          idempotencyKey: randomUUID(),
        })
      ).kind,
    ).toBe("ACCEPTED");
  });
  it("blocks a newly open source conflict, requires a note and permission to resolve, then allows issue", async () => {
    const { key, versionId } = await draft(),
      owner = await actor("membership_horizon_admin"),
      db = getPrismaClient();
    const view = await services().read.execute(owner, key);
    if (view.kind !== "AVAILABLE" || !view.saved) throw Error("DRAFT_REQUIRED");
    const sourceId = view.saved.lines[0]!.recorded!.basis.evidenceReferenceIds[0]!,
      source = await db.evidenceReference.findUniqueOrThrow({ where: { id: sourceId } }),
      alt = randomUUID(),
      conflict = randomUUID();
    await db.evidenceReference.create({
      data: {
        ...source,
        id: alt,
        claimKey: conflict,
        locator: { kind: "structured-line", lineNumber: 1 },
        supportedValue: { amount: "1.00", currency: "TWD" },
      },
    });
    await db.evidenceConflict.create({
      data: {
        id: conflict,
        organizationId: owner.organizationId,
        conflictKey: conflict,
        primaryEvidenceId: sourceId,
        conflictingEvidenceId: alt,
        status: "OPEN",
      },
    });
    const preparation = await issuePreparation(key, versionId);
    expect(preparation.preparation.blockers).toContain("OPEN_CONFLICT");
    expect(
      (
        await lifecycle().issue.execute(owner, {
          projectKey: key,
          token: preparation.token,
          idempotencyKey: randomUUID(),
        })
      ).kind,
    ).toBe("CHANGED");
    const input = {
      projectKey: key,
      conflictKey: conflict,
      status: "RESOLVED",
      note: "The recorded source stands; synthetic duplicate was checked.",
      idempotencyKey: randomUUID(),
    };
    expect((await lifecycle().resolve.execute(owner, { ...input, note: " " })).kind).toBe(
      "INVALID",
    );
    for (const id of [
      "membership_horizon_mei",
      "membership_horizon_viewer",
      "membership_northern_owner",
    ])
      expect((await lifecycle().resolve.execute(await actor(id), input)).kind).toBe("UNAVAILABLE");
    const result = await lifecycle().resolve.execute(owner, input);
    expect(result.kind).toBe("RESOLVED");
    expect(await lifecycle().resolve.execute(owner, input)).toEqual(result);
    expect(await db.evidenceConflict.findUniqueOrThrow({ where: { id: conflict } })).toMatchObject({
      status: "RESOLVED",
      resolutionNote: input.note,
    });
    expect((await issuePreparation(key, versionId)).preparation.blockers).not.toContain(
      "OPEN_CONFLICT",
    );
    await issueDraft(key, versionId);
  });
  it("Home follows saved-draft, issued, revision and acceptance states through its scoped port", async () => {
    const { key, versionId } = await draft(),
      owner = await actor("membership_horizon_admin");
    const { createHomeDeskService } = await import("@/lib/server/home-desk-services");
    const decision = async () => {
      const home = await createHomeDeskService().execute(owner);
      if (home.kind !== "AVAILABLE") throw Error(home.kind);
      return home.decisions.filter((row) => row.project.businessKey === key);
    };
    expect(await decision()).toMatchObject([{ kind: "ISSUE_QUOTE" }]);
    await issueDraft(key, versionId);
    expect(await decision()).toMatchObject([
      { kind: "AWAITING_CLIENT", documentNumber: `${key}-Q1`, canAccept: true },
    ]);
    const revision = await lifecycle().revise.execute(owner, {
      projectKey: key,
      versionId,
      idempotencyKey: randomUUID(),
    });
    if (revision.kind !== "REVISED" || !revision.versionId) throw Error(revision.kind);
    expect(await decision()).toMatchObject([{ kind: "ISSUE_QUOTE" }]);
    await issueDraft(key, revision.versionId);
    expect(await decision()).toMatchObject([
      { kind: "AWAITING_CLIENT", documentNumber: `${key}-Q2` },
    ]);
    expect(
      (
        await lifecycle().accept.execute(owner, {
          projectKey: key,
          versionId: revision.versionId,
          date: "2026-01-01",
          note: "",
          idempotencyKey: randomUUID(),
        })
      ).kind,
    ).toBe("ACCEPTED");
    expect((await decision()).some((row) => row.kind === "AWAITING_CLIENT")).toBe(false);
    expect(
      (await lifecycle().document.execute(await actor("membership_northern_owner"), versionId))
        .kind,
    ).toBe("UNAVAILABLE");
    expect((await lifecycle().document.execute(owner, "missing-quote-version")).kind).toBe(
      "UNAVAILABLE",
    );
  });
  it.each([
    ["CONSTRUCTION", "CONSTRUCTION"],
    ["QUOTE_REVIEW", "APPROVED"],
  ] as const)(
    "accepts a quote in %s with the actual %s stage recorded in the audit",
    async (previousStage, newStage) => {
      const { key, versionId } = await draft();
      await issueDraft(key, versionId);
      const owner = await actor("membership_horizon_admin"),
        db = getPrismaClient();
      const job = await db.project.findFirstOrThrow({ where: { businessKey: key } });
      await db.project.update({ where: { id: job.id }, data: { stage: previousStage } });
      const input = {
        projectKey: key,
        versionId,
        date: "2026-01-01",
        note: "Client accepted",
        idempotencyKey: randomUUID(),
      };
      const result = await lifecycle().accept.execute(owner, input);
      expect(result.kind).toBe("ACCEPTED");
      expect((await db.project.findUniqueOrThrow({ where: { id: job.id } })).stage).toBe(newStage);
      expect(await db.quoteVersion.findUniqueOrThrow({ where: { id: versionId } })).toMatchObject({
        status: "ACCEPTED",
        acceptedByMembershipId: owner.membershipId,
      });
      expect(
        await db.auditEvent.findFirstOrThrow({ where: { idempotencyKey: input.idempotencyKey } }),
      ).toMatchObject({
        eventType: "QUOTE_ACCEPTED",
        payload: { previousStage, newStage },
      });
      expect(await lifecycle().accept.execute(owner, input)).toEqual(result);
      expect(await db.auditEvent.count({ where: { idempotencyKey: input.idempotencyKey } })).toBe(
        1,
      );
    },
  );
  it("saves partial firm details and issues zh-TW with all English fields, email and terms empty", async () => {
    const { key, versionId } = await draft(),
      owner = await actor("membership_horizon_admin");
    const settings = await lifecycle().settings.execute(owner);
    if (settings.kind !== "AVAILABLE") throw Error(settings.kind);
    try {
      expect(
        await lifecycle().saveSettings.execute(owner, {
          details: {
            ...emptyFirmDetails,
            legalNameZhTw: "合成公司",
            addressZhTw: "合成地址",
            taxId: "00000000",
            phone: "02-0000-0000",
          },
          idempotencyKey: randomUUID(),
        }),
      ).toEqual({ kind: "SETTINGS_SAVED" });
      const issued = await issueDraft(key, versionId);
      expect(issued.prepared.preparation.blockers).not.toContain("FIRM_INCOMPLETE");
      expect(issued.prepared.preparation.missingFirmFields).toEqual([]);
      const document = await lifecycle().document.execute(owner, versionId);
      expect(document).toMatchObject({
        kind: "DOCUMENT",
        snapshot: {
          language: "zh-TW",
          firm: { legalName: "合成公司", address: "合成地址", email: "" },
          terms: "",
        },
      });
    } finally {
      await lifecycle().saveSettings.execute(await actor("membership_horizon_admin"), {
        details: settings.details,
        idempotencyKey: randomUUID(),
      });
    }
  });
  it("blocks an English document without its English legal name and names the field in the reader's language", async () => {
    const { key, versionId } = await draft(),
      owner = await actor("membership_horizon_admin");
    const settings = await lifecycle().settings.execute(owner);
    if (settings.kind !== "AVAILABLE") throw Error(settings.kind);
    try {
      expect(
        await lifecycle().saveSettings.execute(owner, {
          details: { ...settings.details, legalNameEn: "", email: "", termsEn: "", termsZhTw: "" },
          idempotencyKey: randomUUID(),
        }),
      ).toEqual({ kind: "SETTINGS_SAVED" });
      const prepared = await lifecycle().prepare.execute(owner, {
        projectKey: key,
        versionId,
        options: { language: "en", attention: "" },
      });
      if (prepared.kind !== "PREPARED") throw Error(prepared.kind);
      expect(prepared.preparation.blockers).toEqual(["FIRM_INCOMPLETE"]);
      expect(prepared.preparation.missingFirmFields).toEqual(["legalNameEn"]);
      expect(
        quoteIssueBlockerText("en", "FIRM_INCOMPLETE", prepared.preparation.missingFirmFields),
      ).toBe("Complete these document details in Settings: Legal name (English).");
      expect(
        quoteIssueBlockerText("zh-TW", "FIRM_INCOMPLETE", prepared.preparation.missingFirmFields),
      ).toBe("請至設定補齊以下報價文件資料：公司法定名稱（英文）。");
      expect(
        await lifecycle().issue.execute(owner, {
          projectKey: key,
          token: prepared.token,
          idempotencyKey: randomUUID(),
        }),
      ).toMatchObject({
        kind: "CHANGED",
        blockers: ["FIRM_INCOMPLETE"],
        missingFirmFields: ["legalNameEn"],
      });
      expect(
        (await getPrismaClient().quoteVersion.findUniqueOrThrow({ where: { id: versionId } }))
          .status,
      ).toBe("DRAFT");
    } finally {
      await lifecycle().saveSettings.execute(await actor("membership_horizon_admin"), {
        details: settings.details,
        idempotencyKey: randomUUID(),
      });
    }
  });
  it("opens a pre-change draft in work order, persists that order on save and preserves canonical retry receipts", async () => {
    const { key, versionId, owner, snapshot } = await legacyQuote("DRAFT"),
      db = getPrismaClient();
    const read = await services().read.execute(owner, key);
    if (read.kind !== "AVAILABLE" || !read.saved) throw Error("DRAFT_REQUIRED");
    expect(read.saved.lines.map((line) => line.categoryId)).toEqual(COMMERCIAL_CATEGORIES);
    const original = await db.quoteItem.findMany({
      where: { quoteVersionId: versionId },
      orderBy: { lineNumber: "asc" },
    });
    expect(original.map((line) => line.categoryId)).toEqual(
      snapshot.lines.map((line) => line.categoryId),
    );
    const input = {
      projectKey: key,
      idempotencyKey: randomUUID(),
      baseVersionId: versionId,
      preparationToken: null,
      lines: [...read.saved.lines]
        .reverse()
        .map(({ categoryId, description, amount }) => ({ categoryId, description, amount })),
    };
    const saved = await services().save.execute(owner, input);
    if (saved.kind !== "SAVED") throw Error(saved.kind);
    const persisted = await db.quoteItem.findMany({
      where: { quoteVersionId: saved.versionId },
      orderBy: { lineNumber: "asc" },
    });
    expect(persisted.map((line) => line.categoryId)).toEqual(COMMERCIAL_CATEGORIES);
    expect(persisted.map((line) => line.lineNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(saved.totals).toEqual(snapshot.totals);
    const normalized = validateSaveDraft(input, seededFirmLists.workCategories)!;
    const priorFingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          ...normalized,
          lines: [...normalized.lines].sort((a, b) => a.categoryId.localeCompare(b.categoryId)),
        }),
      )
      .digest("hex");
    expect(
      await db.auditEvent.findFirstOrThrow({ where: { idempotencyKey: input.idempotencyKey } }),
    ).toMatchObject({ payload: { fingerprint: priorFingerprint } });
    expect(
      await services().save.execute(owner, { ...input, lines: [...input.lines].reverse() }),
    ).toEqual(saved);
    const prepared = await issuePreparation(key, saved.versionId);
    expect(prepared.preparation.snapshot.lines.map((line) => line.categoryId)).toEqual(
      COMMERCIAL_CATEGORIES,
    );
    const preview = await lifecycle().document.execute(owner, saved.versionId, options);
    expect(preview).toMatchObject({
      kind: "DOCUMENT",
      draft: true,
      snapshot: { lines: prepared.preparation.snapshot.lines },
    });
    await issueDraft(key, saved.versionId);
    expect(await lifecycle().document.execute(owner, saved.versionId)).toMatchObject({
      kind: "DOCUMENT",
      draft: false,
      snapshot: { lines: prepared.preparation.snapshot.lines },
    });
  });
  it("issues a revision without another save in work order while preserving the original issued snapshot and PDF bytes", async () => {
    const { key, versionId, owner, snapshot } = await legacyQuote("ISSUED");
    const original = await lifecycle().document.execute(owner, versionId);
    if (original.kind !== "DOCUMENT") throw Error(original.kind);
    expect(original.snapshot).toEqual(snapshot);
    const before = await renderQuotePdf(original.snapshot);
    const revision = await lifecycle().revise.execute(owner, {
      projectKey: key,
      versionId,
      idempotencyKey: randomUUID(),
    });
    if (revision.kind !== "REVISED" || !revision.versionId) throw Error(revision.kind);
    const revised = await services().read.execute(owner, key);
    expect(
      revised.kind === "AVAILABLE" && revised.saved?.lines.map((line) => line.categoryId),
    ).toEqual(COMMERCIAL_CATEGORIES);
    const persisted = await getPrismaClient().quoteItem.findMany({
      where: { quoteVersionId: revision.versionId },
      orderBy: { lineNumber: "asc" },
    });
    expect(persisted.map((line) => line.categoryId)).toEqual(COMMERCIAL_CATEGORIES);
    expect(persisted.map((line) => line.lineNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    const next = await issueDraft(key, revision.versionId);
    expect(next.prepared.preparation.snapshot.lines.map((line) => line.categoryId)).toEqual(
      COMMERCIAL_CATEGORIES,
    );
    const issuedView = await services().read.execute(owner, key);
    expect(
      issuedView.kind === "AVAILABLE" && issuedView.saved?.lines.map((line) => line.categoryId),
    ).toEqual(COMMERCIAL_CATEGORIES);
    const after = await lifecycle().document.execute(owner, versionId);
    if (after.kind !== "DOCUMENT") throw Error(after.kind);
    expect(after.snapshot).toEqual(snapshot);
    expect((await renderQuotePdf(after.snapshot)).equals(before)).toBe(true);
    expect(
      await getPrismaClient().auditEvent.count({
        where: {
          eventType: "QUOTE_DRAFT_SAVED",
          payload: {
            path: ["projectId"],
            equals: revised.kind === "AVAILABLE" ? revised.job.id : "missing",
          },
        },
      }),
    ).toBe(0);
  });
  it("does not return an accepted never-compared job to the Home compare suggestion", async () => {
    const { key, versionId, job, owner } = await legacyQuote("ISSUED"),
      db = getPrismaClient();
    await db.project.update({ where: { id: job.id }, data: { stage: "QUOTE_REVIEW" } });
    expect(await db.comparisonRun.count({ where: { activeProjectId: job.id } })).toBe(0);
    const { createHomeDeskService } = await import("@/lib/server/home-desk-services");
    const rows = async () => {
      const result = await createHomeDeskService().execute(owner);
      if (result.kind !== "AVAILABLE") throw Error(result.kind);
      return result.decisions.filter((row) => row.project.businessKey === key);
    };
    expect(await rows()).toMatchObject([{ kind: "AWAITING_CLIENT" }]);
    expect(
      (
        await lifecycle().accept.execute(owner, {
          projectKey: key,
          versionId,
          date: "2026-11-22",
          note: "",
          idempotencyKey: randomUUID(),
        })
      ).kind,
    ).toBe("ACCEPTED");
    expect((await db.project.findUniqueOrThrow({ where: { id: job.id } })).stage).toBe("APPROVED");
    expect(await rows()).toEqual([]);
  });
  it("keeps the synthetic reset usable after issue and acceptance while restoring all immutable triggers", async () => {
    for (const fixture of [
      "horizon-atelier",
      "stage2-authorization",
      "stage4-comparison",
      "stage5-economics",
      "job-neutral-findings",
      "quote-draft",
      "quote-issue",
      "verify-quote-issue",
      "firm-job-types-and-units",
      "firm-work-categories",
    ])
      await sql.query(readFileSync(`prisma/fixtures/${fixture}.sql`, "utf8"));
    const count = await sql.query(
      `SELECT count(*) FROM pg_trigger WHERE tgname IN ('AuditEvent_append_only','Action_stage8_immutable','ProposedAction_stage8_immutable','InternalReviewReceipt_immutable','QuoteVersion_issued_immutable','QuoteItem_issued_immutable') AND tgenabled='O'`,
    );
    expect(count.rows[0].count).toBe("6");
  });
});
