import { describe, it, expect } from "vitest";
import evaluationConfig from "../../vitest.ai-eval.config";
describe("paid evaluation isolation", () => {
  it("configures only the paid runner, retaining shared aliases but replacing include", () => {
    expect(evaluationConfig.test?.include).toEqual([
      "tests/assistant/provider-evaluation.runner.ts",
    ]);
    expect(evaluationConfig.resolve?.alias).toHaveProperty("@");
    expect(evaluationConfig.test?.fileParallelism).toBe(false);
  });
});
