import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "../assistant/database-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { modelFacts } from "@/modules/assistant/domain/redaction";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("client personal details stay outside assistant answers and model input", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  it("excludes every client contact field from all tools, even for the owner", async () => {
    const privateValues = [
      "Private Synthetic Contact",
      "02-8765-4321",
      "private-contact@example.invalid",
      "999 Private Synthetic Road",
      "87654321",
      "Private Synthetic Client Note",
    ];
    await db.sql.query(
      'UPDATE "Client" SET "contactPerson"=$1,phone=$2,email=$3,address=$4,"taxId"=$5,note=$6 WHERE "organizationId"=$7',
      [...privateValues, "org_horizon"],
    );
    const c = await db.actor(),
      comparison = createComparisonServices(),
      run = await comparison.runComparison.execute(c, "PRJ-XINYI-026");
    if (run.kind !== "COMPLETE") throw Error("RUN_REQUIRED");
    await comparison.runEconomics.execute(
      c,
      run.result.run.id,
      run.result.defaultSelectedProjectKeys,
    );
    const tools = createAssistantServices().tools;
    for (const locale of ["en", "zh-TW"] as const) {
      for (const call of [
        { name: "list_jobs", arguments: {} },
        { name: "get_job", arguments: { projectKey: "PRJ-XINYI-026" } },
        { name: "get_quote_status", arguments: { projectKey: "PRJ-XINYI-026" } },
        { name: "get_saved_comparison", arguments: { projectKey: "PRJ-XINYI-026" } },
        {
          name: "get_past_prices",
          arguments: { projectKey: "PRJ-XINYI-026", categoryId: "IMPORTED_STONE" },
        },
        { name: "list_awaiting_client", arguments: {} },
        { name: "get_closed_job_lessons", arguments: {} },
      ] as const) {
        const out = await tools.execute({ ...c, locale }, call);
        expect(out.status).toBe("OK");
        const input = JSON.stringify(out.sources.map((source) => modelFacts(source.facts)));
        for (const value of privateValues) {
          expect(JSON.stringify(out)).not.toContain(value);
          expect(input).not.toContain(value);
        }
      }
    }
  });
});
