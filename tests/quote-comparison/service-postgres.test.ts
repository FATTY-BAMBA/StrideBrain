import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "../assistant/database-fixture";
import { priceJob, priceServices, priceItem } from "../price-list/fixtures";
import { getPrismaClient } from "@/lib/server/prisma";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { GetQuoteDraft } from "@/modules/quote-draft/application/get-quote-draft";
import { PrepareQuoteDraft } from "@/modules/quote-draft/application/prepare-quote-draft";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { QuoteComparisonService } from "@/modules/quote-comparison/application/quote-comparison";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
const suite = process.env.DATABASE_URL ? describe.sequential : describe.skip;
suite("independent quote comparison and Home action", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  });
  afterAll(async () => {
    await db?.close();
  });
  function services() {
    const comparison = createComparisonServices(),
      repo = new PrismaQuoteDraftRepository(getPrismaClient());
    return new QuoteComparisonService(
      new GetQuoteDraft(repo),
      comparison.getHomeComparison,
      comparison.runComparison,
      comparison.runEconomics,
      new PrepareQuoteDraft(
        repo,
        new SignedDraftPreparationCodec("synthetic-comparison-panel-secret-more-than-32-bytes"),
      ),
    );
  }
  it("a no-comparison job offers Draft quote, reads without writing, runs explicitly with audit, and saves while stale", async () => {
    const owner = await db.actor(),
      job = await priceJob(owner),
      client = getPrismaClient();
    const before = await client.comparisonRun.count();
    expect(await services().execute(owner, job.projectKey, "READ")).toEqual({ kind: "NOT_RUN" });
    expect(await client.comparisonRun.count()).toBe(before);
    const home = await createHomeDeskService().execute(owner);
    expect(
      home.kind === "AVAILABLE" &&
        home.decisions.filter((d) => d.project.businessKey === job.projectKey).map((d) => d.kind),
    ).toEqual(["DRAFT_QUOTE"]);
    const result = await services().execute(
      { ...owner, requestId: randomUUID() },
      job.projectKey,
      "RUN",
    );
    expect(result.kind).toBe("CURRENT");
    if (result.kind !== "CURRENT") throw Error(result.kind);
    expect(result.jobs.length).toBeGreaterThan(0);
    expect(result.preparation?.preparation.suggestions.length).toBeGreaterThan(0);
    expect(await client.comparisonRun.count()).toBe(before + 1);
    expect(
      await client.auditEvent.count({
        where: {
          comparisonRunId: {
            in: (
              await client.comparisonRun.findMany({
                where: { activeProjectId: job.projectId },
                select: { id: true },
              })
            ).map((r) => r.id),
          },
        },
      }),
    ).toBeGreaterThan(0);
    const save = (baseVersionId: string | null) =>
      priceServices().save.execute(
        { ...owner, requestId: randomUUID() },
        {
          projectKey: job.projectKey,
          baseVersionId,
          idempotencyKey: randomUUID(),
          preparationToken: null,
          sections: [{ title: "Manual work", categoryId: null, lines: [priceItem()] }],
          discount: { label: "", amount: "0" },
        },
      );
    const first = await save(null);
    expect(first.kind).toBe("SAVED");
    expect(await services().execute(owner, job.projectKey, "READ")).toEqual({
      kind: "OUT_OF_DATE",
    });
    if (first.kind !== "SAVED") throw Error(first.kind);
    expect((await save(first.versionId)).kind).toBe("SAVED");
    expect(await client.comparisonRun.count()).toBe(before + 1);
  });
  it.each(["READ", "RUN"] as const)(
    "denies Viewer, another organization and an unassigned manager before creating runs (%s)",
    async (action) => {
      const owner = await db.actor(),
        job = await priceJob(owner),
        before = await getPrismaClient().comparisonRun.count();
      for (const membership of [
        "membership_horizon_viewer",
        "membership_northern_owner",
        "membership_horizon_mei",
      ])
        expect(
          await services().execute(await db.actor(membership), job.projectKey, action),
        ).toEqual({ kind: "UNAVAILABLE" });
      expect(await getPrismaClient().comparisonRun.count()).toBe(before);
    },
  );
  it("uses the exact saved bilingual findings, linked sources and current viewer/source fingerprints", async () => {
    const owner = await db.actor();
    expect((await services().execute(owner, "PRJ-XINYI-026", "RUN")).kind).toBe("CURRENT");
    const comparisons = createComparisonServices();
    for (const locale of ["en", "zh-TW"] as const) {
      const context = { ...owner, locale },
        saved = await comparisons.getHomeComparison.execute(context, "PRJ-XINYI-026");
      const result = await services().execute(context, "PRJ-XINYI-026", "READ");
      if (saved?.kind !== "AVAILABLE" || result.kind !== "CURRENT") throw Error("CURRENT_REQUIRED");
      expect(result.findings.map((f) => f.sentence)).toEqual(
        saved.economics!.claims.flatMap(
          (c) => claimFindingText(c, locale, owner.firmLists!.workCategories) ?? [],
        ),
      );
      expect(result.findings.length).toBeGreaterThan(0);
      expect(
        result.findings.every(
          (f) => f.href.startsWith(`/${locale}/`) && f.href.includes("evidenceClaim="),
        ),
      ).toBe(true);
    }
    const manager = await db.actor("membership_horizon_mei");
    expect(await services().execute(manager, "PRJ-XINYI-026", "READ")).toEqual({
      kind: "OUT_OF_DATE",
    });
  });
});
