import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "../assistant/database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { QuoteComparisonService } from "@/modules/quote-comparison/application/quote-comparison";
import { GetQuoteDraft } from "@/modules/quote-draft/application/get-quote-draft";
import { PrepareQuoteDraft } from "@/modules/quote-draft/application/prepare-quote-draft";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { taiwanCityKey } from "@/modules/projects/domain/taiwan-cities";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("SB-073 kept-data city migration and saved comparisons", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  it("preserves saved snapshots, full freshness, quote-panel Current and Home's absence of a hint", async () => {
    const client = getPrismaClient(),
      context = await db.actor(),
      app = createComparisonServices(),
      key = "PRJ-XINYI-026";
    // Start with the exact old stored city values. The nullable compatibility column is
    // unused while generating pre-upgrade snapshots, then dropped before applying SQL.
    await db.sql.query(
      `UPDATE "Project" SET "locationCity"=coalesce("locationCityBeforeCanonicalization","locationCity"), "locationCityBeforeCanonicalization"=NULL`,
    );
    await db.sql.query(
      `UPDATE "Project" SET "locationCity"='Unmapped old text' WHERE "organizationId"='org_northern'`,
    );
    await db.sql.query(`UPDATE "QuoteVersion" SET status='DRAFT' WHERE id='qv_xinyi_026_v3'`);
    const structural = await app.runComparison.execute(context, key);
    if (structural.kind !== "COMPLETE") throw Error(structural.kind);
    const enriched = await app.runEconomics.execute(
      context,
      structural.result.run.id,
      structural.result.defaultSelectedProjectKeys,
    );
    if (!("result" in enriched)) throw Error(enriched.kind);
    const repo = new PrismaQuoteDraftRepository(client);
    const panel = new QuoteComparisonService(
      new GetQuoteDraft(repo),
      app.getHomeComparison,
      app.runComparison,
      app.runEconomics,
      new PrepareQuoteDraft(
        repo,
        new SignedDraftPreparationCodec("synthetic-city-migration-secret-at-least-32"),
      ),
    );
    const beforePanel = await panel.execute(context, key, "READ");
    expect(beforePanel.kind).toBe("CURRENT");
    expect((await app.getFreshness.check(context, structural.result, enriched.result)).state).toBe(
      "CURRENT",
    );
    const beforeHome = await createHomeDeskService().execute(context);
    if (beforeHome.kind !== "AVAILABLE") throw Error(beforeHome.kind);
    const row = beforeHome.decisions.find(
      (row) => row.kind === "ISSUE_QUOTE" && row.project.businessKey === key,
    );
    expect(row).toBeDefined();
    expect(row?.comparisonHint).toBeUndefined();
    const projects = (
      await db.sql.query('SELECT id,"locationCity","updatedAt" FROM "Project" ORDER BY id')
    ).rows;
    const counts = async () => [
      await client.comparisonRun.count(),
      await client.economicsEnrichmentRun.count(),
    ];
    const beforeCounts = await counts();
    const snapshots = (
      await db.sql.query('SELECT id,"resultSnapshot" FROM "ComparisonRun" ORDER BY id')
    ).rows;
    await db.sql.query('ALTER TABLE "Project" DROP COLUMN "locationCityBeforeCanonicalization"');
    await db.sql.query(
      readFileSync("prisma/migrations/20261125151000_project_cities/migration.sql", "utf8"),
    );
    const after = (
      await db.sql.query(
        'SELECT id,"locationCity","locationCityBeforeCanonicalization","updatedAt" FROM "Project" ORDER BY id',
      )
    ).rows;
    expect(after).toHaveLength(projects.length);
    for (const [index, previous] of projects.entries()) {
      const canonical = taiwanCityKey(previous.locationCity);
      expect(after[index]).toEqual({
        ...previous,
        locationCity: canonical ?? previous.locationCity,
        locationCityBeforeCanonicalization:
          canonical && canonical !== previous.locationCity ? previous.locationCity : null,
      });
    }
    expect((await app.getHomeComparison.execute(context, key))?.kind).toBe("AVAILABLE");
    expect((await panel.execute(context, key, "READ")).kind).toBe("CURRENT");
    expect((await app.getFreshness.check(context, structural.result, enriched.result)).state).toBe(
      "CURRENT",
    );
    const home = await createHomeDeskService().execute(context);
    if (home.kind !== "AVAILABLE") throw Error(home.kind);
    expect(
      home.decisions.find((row) => row.kind === "ISSUE_QUOTE" && row.project.businessKey === key)
        ?.comparisonHint,
    ).toBeUndefined();
    expect(await counts()).toEqual(beforeCounts);
    expect(
      (await db.sql.query('SELECT id,"resultSnapshot" FROM "ComparisonRun" ORDER BY id')).rows,
    ).toEqual(snapshots);
    // Future material changes still fail the original checks; no fallback accepts stale sources.
    await client.project.updateMany({
      where: { organizationId: context.organizationId, businessKey: key },
      data: { locationCity: "TAICHUNG_CITY" },
    });
    expect((await app.getHomeComparison.execute(context, key))?.kind).toBe("OUT_OF_DATE");
    expect(await panel.execute(context, key, "READ")).toEqual({ kind: "OUT_OF_DATE" });
    const stale = await createHomeDeskService().execute({ ...context, requestId: randomUUID() });
    expect(
      stale.kind === "AVAILABLE" &&
        stale.decisions.find((row) => row.kind === "ISSUE_QUOTE" && row.project.businessKey === key)
          ?.comparisonHint,
    ).toBe("OUT_OF_DATE");
  }, 30000);
});
