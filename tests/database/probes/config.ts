import { defineConfig } from "vitest/config";
import base from "../../../vitest.config";
const mode = process.env.SB_TEST_PROBE_MODE;
if (!["parallel", "shared", "reset", "sticky"].includes(mode ?? ""))
  throw new Error("PROBE_MODE_REQUIRED");
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["tests/database/probes/*.fixture.ts"],
    globalSetup: ["./tests/database/probes/global-setup.ts"],
    setupFiles:
      mode === "shared" || mode === "sticky"
        ? ["./tests/database/probes/shared-setup.ts"]
        : ["./tests/database/setup.ts"],
    maxWorkers: mode === "reset" || mode === "sticky" ? 1 : 2,
    fileParallelism: true,
    sequence: { ...base.test?.sequence, shuffle: false },
  },
});
