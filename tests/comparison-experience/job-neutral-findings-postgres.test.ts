import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { getPrismaClient } from "@/lib/server/prisma";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import { buildComparisonExperience } from "@/modules/comparison-experience/build-comparison-experience";
import { buildHomeIntelligence } from "@/modules/home-intelligence/home-intelligence";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
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
suite("job-specific findings from PostgreSQL", () => {
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
    const source = await services.getHomeComparison.execute(context, "prj_riverside_044");
    expect(source?.economics?.run.id).toBe(economics.result.run.id);
    for (const locale of ["en", "zh-TW"] as const) {
      const loaded = await createProjectWorkspaceService().execute(
        { ...context, locale },
        "J-2611-R7K3",
      );
      if (loaded.kind !== "AVAILABLE") throw new Error(loaded.kind);
      const home = buildHomeIntelligence(locale, {
        projects: [],
        workspace: loaded.workspace,
        intelligence: source,
      });
      const view = buildComparisonExperience({
        locale,
        stage4: comparison.result,
        economics: economics.result,
      });
      expect(home.findings.map((f) => f.title)).toEqual(
        [...view.synthesis.history, ...view.synthesis.differences, ...view.synthesis.gaps]
          .filter((f) => f.claimKey)
          .map((f) => f.body),
      );
      expect(home.memory.map((m) => m.score)).toEqual(
        comparison.result.matches.map((m) => m.displayScore),
      );
      expect(JSON.stringify(home.findings)).not.toMatch(/stone|lighting|石材|照明/i);
      expect(
        view.table.sections
          .flatMap((s) => s.rows)
          .filter((r) => r.key.endsWith("-QUOTE"))
          .map((r) => r.key),
      ).toEqual(["CUSTOM_MILLWORK-QUOTE", "SIGNAGE-QUOTE"]);
      for (const finding of home.findings) {
        expect(finding.href).toContain(`economics=${economics.result.run.id}`);
        const panel = await services.getEvidencePanel.execute(
          context,
          {
            mode: "CLAIM",
            comparisonRunId: comparison.result.run.id,
            enrichmentRunId: economics.result.run.id,
            claimKey: finding.claimKey,
          },
          locale,
        );
        expect(panel.kind).toBe("READY");
      }
    }
    const outsider = await actor("membership_northern_owner");
    expect(await services.getHomeComparison.execute(outsider, "prj_riverside_044")).toBeNull();
    const viewer = await actor("membership_horizon_viewer");
    const limited = await services.getHomeComparison.execute(viewer, "prj_riverside_044");
    expect(limited?.economics).toBeUndefined();
    expect(
      await services.getHomeComparison.execute(
        { ...context, capabilities: new Set() },
        "prj_riverside_044",
      ),
    ).toBeNull();
  }, 20000);
});
