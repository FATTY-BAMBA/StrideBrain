import { seededFirmLists } from "@/fixtures/firm-lists";
import { withFirmLists } from "../firm-lists/with-firm-lists";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { getPrismaClient, disconnectPrismaClientForTests } from "@/lib/server/prisma";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import { buildComparisonExperience } from "@/modules/comparison-experience/build-comparison-experience";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { decisionPresentation } from "@/modules/home-desk/presentation";
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
suite("job-specific findings from PostgreSQL", () => {
  it("requires the saving member and the current quote version for Home", async () => {
    const context = await actor("membership_horizon_mei");
    const services = createComparisonServices();
    const comparison = await services.runComparison.execute(context, "J-2611-R7K3");
    if (comparison.kind !== "COMPLETE") throw new Error(comparison.kind);
    expect((await services.getHomeComparison.execute(context, "J-2611-R7K3"))?.kind).toBe(
      "AVAILABLE",
    );
    const anotherMember = await actor("membership_horizon_admin");
    expect(await services.getHomeComparison.execute(anotherMember, "J-2611-R7K3")).toEqual({
      kind: "OUT_OF_DATE",
    });
    const versionId = `quote-review-${randomUUID()}`;
    try {
      await sql.query(
        `INSERT INTO "QuoteVersion" SELECT (jsonb_populate_record(NULL::"QuoteVersion", to_jsonb(v) || jsonb_build_object('id', $1::text, 'versionNumber', v."versionNumber"+1))).* FROM "QuoteVersion" v WHERE id='qv_riverside_044_v1'`,
        [versionId],
      );
      // Database-generated price identities are recomputed, never copied as inputs.
      const columns = (
        await sql.query(
          `SELECT quote_ident(attname) AS name FROM pg_attribute WHERE attrelid='"QuoteItem"'::regclass AND attnum>0 AND NOT attisdropped AND attgenerated='' ORDER BY attnum`,
        )
      ).rows.map((row) => row.name);
      await sql.query(
        `INSERT INTO "QuoteItem" (${columns.join(",")}) SELECT ${columns.map((column) => `copy.${column}`).join(",")} FROM "QuoteItem" i CROSS JOIN LATERAL jsonb_populate_record(NULL::"QuoteItem", to_jsonb(i) || jsonb_build_object('id', $1::text || i.id, 'quoteVersionId', $1::text)) copy WHERE i."quoteVersionId"='qv_riverside_044_v1'`,
        [versionId],
      );
      expect(await services.getHomeComparison.execute(context, "J-2611-R7K3")).toEqual({
        kind: "OUT_OF_DATE",
      });
    } finally {
      await sql.query('DELETE FROM "QuoteItem" WHERE "quoteVersionId"=$1', [versionId]);
      await sql.query('DELETE FROM "QuoteVersion" WHERE id=$1', [versionId]);
    }
    expect((await services.getHomeComparison.execute(context, "J-2611-R7K3"))?.kind).toBe(
      "AVAILABLE",
    );
  });
  it("uses the second job's categories and the same stored findings/scores on Home and comparison in both languages", async () => {
    const context = await actor("membership_horizon_mei");
    const services = createComparisonServices();
    const comparison = await services.runComparison.execute(context, "J-2611-R7K3");
    if (comparison.kind !== "COMPLETE") throw new Error(comparison.kind);
    const economics = await services.runEconomics.execute(
      { ...context, requestId: randomUUID() },
      comparison.result.run.id,
      comparison.result.defaultSelectedProjectKeys,
    );
    if (!("result" in economics)) throw new Error(economics.kind);
    expect(economics.result.categories.map((c) => c.categoryId)).toEqual([
      "CUSTOM_MILLWORK",
      "SIGNAGE",
    ]);
    expect(
      economics.result.claims.some(
        (c) => c.categoryId === "CUSTOM_MILLWORK" && c.value.direction === "ABOVE",
      ),
    ).toBe(true);
    expect(
      economics.result.claims.some(
        (c) => c.categoryId === "SIGNAGE" && c.value.direction === "BELOW",
      ),
    ).toBe(true);
    const source = await services.getHomeComparison.execute(context, "J-2611-R7K3");
    expect(source?.kind).toBe("AVAILABLE");
    if (source?.kind !== "AVAILABLE") throw new Error("HOME_RESULT_NOT_CURRENT");
    expect(source.economics?.run.id).toBe(economics.result.run.id);
    for (const locale of ["en", "zh-TW"] as const) {
      const loaded = await createProjectWorkspaceService().execute(
        { ...context, locale },
        "J-2611-R7K3",
      );
      if (loaded.kind !== "AVAILABLE") throw new Error(loaded.kind);
      const home = await createHomeDeskService().execute({ ...context, locale });
      if (home.kind !== "AVAILABLE") throw new Error("HOME_REQUIRED");
      const decision = home.decisions.find(
        (item) => item.project.businessKey === "J-2611-R7K3" && item.kind === "REVIEW_QUOTE",
      );
      if (!decision) throw new Error("DECISION_REQUIRED");
      const view = buildComparisonExperience({
        catalog: seededFirmLists,
        locale,
        stage4: comparison.result,
        economics: economics.result,
      });
      const sentences = [
        ...view.synthesis.history,
        ...view.synthesis.differences,
        ...view.synthesis.gaps,
      ]
        .filter((finding) => finding.claimKey)
        .map((finding) => finding.body);
      expect(sentences).toContain(
        decisionPresentation(decision, locale, seededFirmLists.workCategories).sentence,
      );
      expect(JSON.stringify(decision.claim)).not.toMatch(/stone|lighting|石材|照明/i);
      expect(
        view.table.sections
          .flatMap((s) => s.rows)
          .filter((r) => r.key.endsWith("-QUOTE"))
          .map((r) => r.key),
      ).toEqual(["CUSTOM_MILLWORK-QUOTE", "SIGNAGE-QUOTE"]);
      for (const finding of [
        ...view.synthesis.history,
        ...view.synthesis.differences,
        ...view.synthesis.gaps,
      ].filter((item) => item.claimKey)) {
        expect(
          decisionPresentation(decision, locale, seededFirmLists.workCategories).href,
        ).toContain(`economics=${economics.result.run.id}`);
        const panel = await services.getEvidencePanel.execute(
          context,
          {
            mode: "CLAIM",
            comparisonRunId: comparison.result.run.id,
            enrichmentRunId: economics.result.run.id,
            claimKey: finding.claimKey!,
          },
          locale,
        );
        expect(panel.kind).toBe("READY");
      }
    }
    const outsider = await actor("membership_northern_owner");
    expect(await services.getHomeComparison.execute(outsider, "J-2611-R7K3")).toBeNull();
    const viewer = await actor("membership_horizon_viewer");
    const limited = await services.getHomeComparison.execute(viewer, "J-2611-R7K3");
    expect(limited?.kind === "AVAILABLE" ? limited.economics : undefined).toBeUndefined();
    expect(
      await services.getHomeComparison.execute(
        { ...context, capabilities: new Set() },
        "J-2611-R7K3",
      ),
    ).toBeNull();
  }, 20000);
});

import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { jobInput } from "../projects/job-fixture";

suite("job-neutral review outcomes", () => {
  it.each(["en", "zh-TW"] as const)(
    "prepares and confirms millwork/signage findings in %s",
    async (locale) => {
      const context = await actor("membership_horizon_mei");
      const services = createComparisonServices();
      const comparison = await services.runComparison.execute(context, "J-2611-R7K3");
      if (comparison.kind !== "COMPLETE") throw new Error(comparison.kind);
      const economics = await services.runEconomics.execute(
        { ...context, requestId: randomUUID() },
        comparison.result.run.id,
        comparison.result.defaultSelectedProjectKeys,
      );
      if (!("result" in economics)) throw new Error(economics.kind);
      const review = createInternalReviewServices();
      const prepared = await review.prepare(
        { ...context, requestId: randomUUID() },
        {
          projectKey: "J-2611-R7K3",
          comparisonRunId: comparison.result.run.id,
          enrichmentRunId: economics.result.run.id,
          locale,
        },
      );
      expect(prepared.kind).toBe("PREPARED");
      if (prepared.kind !== "PREPARED") throw new Error(prepared.kind);
      const p = prepared.proposal;
      expect(JSON.stringify(p)).not.toMatch(
        /IMPORTED_STONE|LIGHTING_ELECTRICAL|imported.stone|lighting|石材|照明/i,
      );
      expect(p.title).toContain(locale === "en" ? "Custom millwork" : "客製木作");
      expect(p.title).toContain(locale === "en" ? "Signage" : "標示");
      const confirmed = await review.confirm(
        { ...context, requestId: randomUUID() },
        {
          version: "internal-review-command.v1",
          proposalKey: p.businessKey,
          title: p.title,
          rationale: p.rationale,
          assigneeKey: p.suggestedAssigneeKey,
          dueDate: p.suggestedDueDate,
          confirmation: true,
          idempotencyKey: p.idempotencyKey,
          locale,
        },
      );
      expect(confirmed.kind).toBe("CREATED");
    },
    20000,
  );
  it("returns NO_QUOTE_VERSION for a newly created job and still ranks actual history", async () => {
    let context = await actor("membership_horizon_mei");
    const input = {
      ...jobInput(),
      businessKey: `J-NQ-${randomUUID()}`,
      name: "Synthetic no-quote signage job",
      scopeCategoryIds: ["CUSTOM_MILLWORK", "SIGNAGE"],
      clientMode: "existing",
      clientBusinessKey: "CLIENT-01",
    };
    const created = await createProjectWriteServices().create.execute(context, input);
    expect(created.kind).toBe("CREATED");
    // An admin has the unchanged actual-read authority required to propose reviews.
    context = await actor("membership_horizon_admin");
    const services = createComparisonServices();
    const comparison = await services.runComparison.execute(context, input.businessKey);
    if (comparison.kind !== "COMPLETE") throw new Error(comparison.kind);
    expect(comparison.result.matches.length).toBeGreaterThan(0);
    const economics = await services.runEconomics.execute(
      { ...context, requestId: randomUUID() },
      comparison.result.run.id,
      comparison.result.defaultSelectedProjectKeys,
    );
    if (!("result" in economics)) throw new Error(economics.kind);
    expect(economics.result.categories).toEqual([]);
    const pair = {
      comparisonRunId: comparison.result.run.id,
      enrichmentRunId: economics.result.run.id,
    };
    const review = createInternalReviewServices();
    expect(await review.availability(context, input.businessKey, pair)).toBe("NO_QUOTE_VERSION");
    expect(
      (await review.prepare(context, { projectKey: input.businessKey, ...pair, locale: "en" }))
        .kind,
    ).toBe("NO_QUOTE_VERSION");
    for (const locale of ["en", "zh-TW"] as const) {
      const view = buildComparisonExperience({
        catalog: seededFirmLists,
        stage4: comparison.result,
        economics: economics.result,
        locale,
      });
      expect(view.synthesis.history).toEqual([]);
      expect(view.synthesis.recommendation).toBeUndefined();
      expect(JSON.stringify(view.table)).not.toMatch(
        /NT\$|[+-]\d+\.\d+%|IMPORTED_STONE|LIGHTING_ELECTRICAL/,
      );
    }
  }, 20000);
});
