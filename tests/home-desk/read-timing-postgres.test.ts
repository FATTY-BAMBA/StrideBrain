import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { assistantDatabase } from "../assistant/database-fixture";
import { priceItem, priceJob, priceServices } from "../price-list/fixtures";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrepareQuoteDraft } from "@/modules/quote-draft/application/prepare-quote-draft";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("Home read timing with the seeded firm", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  });
  afterAll(async () => {
    await db?.close();
  });
  it("reads saved state and findings without preparing references or writing runs", async () => {
    const owner = await db.actor();
    const measure = async (scenario: string) => {
      const app = createHomeDeskService();
      const expected = await app.execute(owner);
      if (expected.kind !== "AVAILABLE") throw Error(expected.kind);
      const before = await getPrismaClient().comparisonRun.count();
      const preparation = vi.spyOn(PrepareQuoteDraft.prototype, "execute");
      const query = vi.spyOn(Client.prototype, "query");
      const samples = [];
      for (let i = 0; i < 5; i++) {
        query.mockClear();
        const start = performance.now();
        const result = await app.execute(owner);
        samples.push({
          ms: +(performance.now() - start).toFixed(2),
          queries: query.mock.calls.length,
        });
        expect(result).toEqual(expected);
      }
      query.mockRestore();
      expect(preparation).not.toHaveBeenCalled();
      preparation.mockRestore();
      expect(await getPrismaClient().comparisonRun.count()).toBe(before);
      console.info(
        "HOME_READ_TIMING",
        JSON.stringify({
          scenario,
          projects: expected.projects.length,
          decisions: expected.decisions.length,
          samples,
        }),
      );
    };
    await measure("seeded firm, no saved comparison");
    const job = await priceJob(owner);
    expect(
      (
        await priceServices().save.execute(
          { ...owner, requestId: randomUUID() },
          {
            projectKey: job.projectKey,
            baseVersionId: null,
            idempotencyKey: randomUUID(),
            preparationToken: null,
            sections: [
              { title: "Ceilings", categoryId: "DEMOLITION_CEILING", lines: [priceItem()] },
            ],
            discount: { label: "", amount: "0" },
          },
        )
      ).kind,
    ).toBe("SAVED");
    const services = createComparisonServices();
    for (const key of ["PRJ-XINYI-026", "J-2611-R7K3", job.projectKey]) {
      const run = await services.runComparison.execute({ ...owner, requestId: randomUUID() }, key);
      if (run.kind !== "COMPLETE") throw Error(run.kind);
      const economics = await services.runEconomics.execute(
        { ...owner, requestId: randomUUID() },
        run.result.run.id,
        run.result.defaultSelectedProjectKeys,
      );
      expect("result" in economics).toBe(true);
    }
    await measure("seeded firm plus ready-to-issue draft, three saved comparisons");
  });
  it("matches the panel's strict same-person/source state for an issue row without preparing references", async () => {
    const owner = await db.actor(),
      job = await priceJob(owner),
      client = getPrismaClient();
    const save = (baseVersionId: string | null) =>
      priceServices().save.execute(
        { ...owner, requestId: randomUUID() },
        {
          projectKey: job.projectKey,
          baseVersionId,
          preparationToken: null,
          idempotencyKey: randomUUID(),
          sections: [{ title: "Ceilings", categoryId: "DEMOLITION_CEILING", lines: [priceItem()] }],
          discount: { label: "", amount: "0" },
        },
      );
    const first = await save(null);
    if (first.kind !== "SAVED") throw Error(first.kind);
    const hint = async () => {
      const home = await createHomeDeskService().execute(owner);
      if (home.kind !== "AVAILABLE") throw Error(home.kind);
      const rows = home.decisions.filter((d) => d.project.businessKey === job.projectKey);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.kind).toBe("ISSUE_QUOTE");
      expect(home.stageCounts.reduce((n, g) => n + g.count, 0)).toBe(home.projects.length);
      return rows[0]?.comparisonHint;
    };
    expect(await hint()).toBe("NOT_RUN");
    await client.projectAssignment.create({
      data: {
        id: randomUUID(),
        organizationId: owner.organizationId,
        projectId: job.projectId,
        membershipId: "membership_horizon_mei",
        canReadActuals: true,
        canCreateAction: true,
      },
    });
    const services = createComparisonServices();
    const manager = await db.actor("membership_horizon_mei");
    const compare = async (context: typeof owner) => {
      const run = await services.runComparison.execute(
        { ...context, requestId: randomUUID() },
        job.projectKey,
      );
      if (run.kind !== "COMPLETE") throw Error(run.kind);
      expect(
        "result" in
          (await services.runEconomics.execute(
            { ...context, requestId: randomUUID() },
            run.result.run.id,
            run.result.defaultSelectedProjectKeys,
          )),
      ).toBe(true);
    };
    await compare(manager);
    expect(await hint()).toBe("OUT_OF_DATE");
    await compare(owner);
    expect(await hint()).toBeUndefined();
    const before = await client.comparisonRun.count();
    const prepared = vi.spyOn(PrepareQuoteDraft.prototype, "execute");
    expect(await hint()).toBeUndefined();
    expect(await hint()).toBeUndefined();
    expect(prepared).not.toHaveBeenCalled();
    expect(await client.comparisonRun.count()).toBe(before);
    expect((await save(first.versionId)).kind).toBe("SAVED");
    expect(await hint()).toBe("OUT_OF_DATE");
    prepared.mockRestore();
  });
});
