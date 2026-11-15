import { describe, expect, it } from "vitest";

import { createComparisonServices } from "@/lib/server/comparison-services";
import { getPrismaClient } from "@/lib/server/prisma";
import { buildComparisonExperience } from "@/modules/comparison-experience/build-comparison-experience";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";

const DATABASE_AVAILABLE = Boolean(process.env.DATABASE_URL);
const describeDatabase = DATABASE_AVAILABLE ? describe : describe.skip;
const SIGNING_SECRET = "stage6-integration-session-secret-at-least-32-bytes";
const HERO_PIPELINE_BUDGET_MS = 5_000;

describeDatabase("Stage 6 PostgreSQL hero flow", () => {
  it("runs the authorized structural and economics pipeline and composes the real UI DTO", async () => {
    const database = getPrismaClient();
    const sessions = new PrismaDemoSessionRepository(
      database as unknown as PrismaDemoSessionDatabase,
    );
    const issued = await new DemoSessionService(sessions, SIGNING_SECRET).issueForMembership(
      "membership_horizon_mei",
      { locale: "en", ttlSeconds: 300 },
    );
    expect(issued).not.toBeNull();

    const cookie = issued!.setCookie.split(";")[0]!;
    const identity = new SignedDemoIdentityContext(sessions, SIGNING_SECRET);
    const context = await identity.resolve(
      new Request("https://stridebrain.test/en/projects/PRJ-XINYI-026/compare", {
        headers: { cookie },
      }),
    );
    expect(context).not.toBeNull();

    const startedAt = performance.now();
    const services = createComparisonServices();
    const structural = await services.runComparison.execute(context!, "PRJ-XINYI-026");
    expect(structural.kind).toBe("COMPLETE");
    if (structural.kind !== "COMPLETE") throw new Error("STRUCTURAL_RESULT_REQUIRED");

    expect(
      structural.result.matches.map((match) => [match.project.projectKey, match.displayScore]),
    ).toEqual([
      ["PRJ-NEIHU-021", 88],
      ["PRJ-ZHONGSHAN-018", 81],
      ["PRJ-NANJING-023", 79],
      ["PRJ-DAAN-016", 71],
      ["PRJ-SONGSHAN-020", 69],
      ["PRJ-BANQIAO-015", 63],
    ]);

    const economics = await services.runEconomics.execute(
      context!,
      structural.result.run.id,
      structural.result.defaultSelectedProjectKeys,
    );
    expect("result" in economics).toBe(true);
    if (!("result" in economics)) throw new Error("ECONOMICS_RESULT_REQUIRED");

    const view = buildComparisonExperience({
      stage4: structural.result,
      economics: economics.result,
      locale: "en",
    });
    const durationMs = performance.now() - startedAt;
    console.info(`STAGE6_HERO_PIPELINE_MS=${durationMs.toFixed(2)}`);

    expect(durationMs).toBeLessThan(HERO_PIPELINE_BUDGET_MS);
    expect(view.cards).toHaveLength(6);
    expect(view.initialSelectedProjectKeys).toEqual([
      "PRJ-NEIHU-021",
      "PRJ-ZHONGSHAN-018",
      "PRJ-NANJING-023",
    ]);
    expect(view.synthesis.history.some((item) => item.body.includes("+18.4%"))).toBe(true);
    expect(
      view.table.sections
        .flatMap((section) => section.rows)
        .find((row) => row.key === "LIGHTING_ELECTRICAL-ACTUAL")?.cells.__ACTIVE_PROJECT__?.state,
    ).toBe("INSUFFICIENT");
    expect(view.notices.some((notice) => notice.key === "stale")).toBe(true);
  }, 20_000);
});
