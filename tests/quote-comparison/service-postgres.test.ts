import { randomUUID } from "node:crypto";
import { Client } from "pg";
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
import type { GetHomeComparison } from "@/modules/home-intelligence/application/get-home-comparison";
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
  function services(saved?: Pick<GetHomeComparison, "execute">) {
    const comparison = createComparisonServices(),
      repo = new PrismaQuoteDraftRepository(getPrismaClient());
    return new QuoteComparisonService(
      new GetQuoteDraft(repo),
      saved ?? comparison.getHomeComparison,
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
    expect(result.jobs).toHaveLength(3);
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
    expect(await services().execute(owner, job.projectKey, "RUN")).toEqual({
      kind: "CONTEXT_INCOMPLETE",
      missingFields: ["COMMERCIAL_CATEGORIES"],
    });
    if (first.kind !== "SAVED") throw Error(first.kind);
    expect((await save(first.versionId)).kind).toBe("SAVED");
    expect(await client.comparisonRun.count()).toBe(before + 1);
  });
  it("keeps a selected broader match in the panel's source-job list", async () => {
    const owner = await db.actor();
    expect((await services().execute(owner, "PRJ-XINYI-026", "RUN")).kind).toBe("CURRENT");
    const saved = await createComparisonServices().getHomeComparison.execute(
      owner,
      "PRJ-XINYI-026",
    );
    if (saved?.kind !== "AVAILABLE" || !saved.economics) throw Error("SAVED_REQUIRED");
    const key = saved.economics.selectedProjectKeys[0]!;
    const match = saved.comparison.matches.find((m) => m.project.projectKey === key)!;
    // The selection contract also permits broader matches. Move the same authorized
    // selected match to that tier to exercise DTO projection independently of ranking.
    const result = await services({
      execute: async () => ({
        ...saved,
        comparison: {
          ...saved.comparison,
          matches: saved.comparison.matches.filter((m) => m !== match),
          broaderMatches: [...saved.comparison.broaderMatches, match],
        },
      }),
    }).execute(owner, "PRJ-XINYI-026", "READ");
    expect(result.kind === "CURRENT" && result.jobs.map((job) => job.projectKey).sort()).toEqual(
      [...saved.economics.selectedProjectKeys].sort(),
    );
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
      expect(result.jobs.map((job) => job.projectKey).sort()).toEqual(
        [...saved.economics!.selectedProjectKeys].sort(),
      );
      expect(saved.comparison.matches.length).toBeGreaterThan(result.jobs.length);
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

suite("panel read timing breakdown", () => {
  it("measures authorized quote, saved findings and optional preparation reads without writing", async () => {
    const db = await assistantDatabase();
    try {
      const context = await db.actor();
      const comparisons = createComparisonServices();
      const repo = new PrismaQuoteDraftRepository(getPrismaClient());
      const quote = new GetQuoteDraft(repo);
      const prepare = new PrepareQuoteDraft(
        repo,
        new SignedDraftPreparationCodec("synthetic-panel-read-timing-secret-32-bytes"),
      );
      const timings: Record<string, number> = {};
      const queries = vi.spyOn(Client.prototype, "query");
      async function measure<T>(name: string, read: () => Promise<T>): Promise<T> {
        const start = performance.now(),
          count = queries.mock.calls.length;
        try {
          return await read();
        } finally {
          timings[name] = Number((performance.now() - start).toFixed(2));
          timings[name.replace("Ms", "Queries")] = queries.mock.calls.length - count;
        }
      }
      const service = new QuoteComparisonService(
        { execute: (c, key) => measure("quoteViewMs", () => quote.execute(c, key)) },
        {
          execute: (c, key) =>
            measure("savedFindingsMs", () => comparisons.getHomeComparison.execute(c, key)),
        },
        comparisons.runComparison,
        comparisons.runEconomics,
        { execute: (c, key) => measure("preparationMs", () => prepare.execute(c, key)) },
      );
      const job = await priceJob(context);
      expect(
        (
          await priceServices().save.execute(context, {
            projectKey: job.projectKey,
            baseVersionId: null,
            preparationToken: null,
            idempotencyKey: randomUUID(),
            sections: [
              { title: "Ceilings", categoryId: "DEMOLITION_CEILING", lines: [priceItem()] },
            ],
            discount: { label: "", amount: "0" },
          })
        ).kind,
      ).toBe("SAVED");
      for (const [scenario, key] of [
        ["read-only quote", "PRJ-XINYI-026"],
        ["editable manual draft", job.projectKey],
      ]) {
        expect(
          (await service.execute({ ...context, requestId: randomUUID() }, key!, "RUN")).kind,
        ).toBe("CURRENT");
        const before = await getPrismaClient().comparisonRun.count();
        for (const name of Object.keys(timings)) delete timings[name];
        const result = await measure("totalMs", () => service.execute(context, key!, "READ"));
        expect(result.kind).toBe("CURRENT");
        if (scenario === "editable manual draft")
          expect(result.kind === "CURRENT" && result.preparation?.kind).toBe("PREPARED");
        expect(await getPrismaClient().comparisonRun.count()).toBe(before);
        console.info("QUOTE_PANEL_LOCAL_READ_TIMING", scenario, JSON.stringify(timings));
      }
      queries.mockRestore();
    } finally {
      await db.close();
    }
  });
});
