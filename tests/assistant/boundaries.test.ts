import { readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
describe("assistant architecture", () => {
  it("keeps credentials and the live provider behind a server-only adapter", () => {
    const adapter = readFileSync("src/modules/assistant/infrastructure/gemini-model.ts", "utf8");
    expect(adapter).toContain('import "server-only"');
    expect(adapter).not.toMatch(/repositories|Prisma|process\.env/);
    const root = readFileSync("src/lib/server/assistant-services.ts", "utf8");
    expect(root).not.toContain("FakeAssistantModel");
  });
  it("keeps domain pure and has no feature-level data-mode gate", () => {
    for (const file of readdirSync("src/modules/assistant/domain")) {
      const text = readFileSync(`src/modules/assistant/domain/${file}`, "utf8");
      expect(text).not.toMatch(/from ["'](?:next|@prisma|@google|ai)[/'"]|process\.env|fetch\(/);
    }
  });
  it("keeps paid evaluation separate from ordinary CI", () => {
    const workflow = readFileSync(".github/workflows/ai-evaluation.yml", "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toContain("pull_request:");
    expect(readFileSync(".github/workflows/ci.yml", "utf8")).not.toContain("ai:eval");
  });
});
