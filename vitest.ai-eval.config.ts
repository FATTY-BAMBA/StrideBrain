import { defineConfig } from "vitest/config";
import base from "./vitest.config";
// mergeConfig concatenates include arrays, which would also run the ordinary suite.
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    // Paid evaluation retains its own disposable database lifecycle.
    globalSetup: [],
    setupFiles: [],
    sequence: {},
    include: ["tests/assistant/provider-evaluation.runner.ts"],
    fileParallelism: false,
  },
});
