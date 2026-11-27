import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    pool: "forks",
    retry: 0,
    sequence: { hooks: "stack" },
    globalSetup: ["./tests/database/global-setup.ts"],
    setupFiles: ["./tests/database/setup.ts", "./tests/browser/setup.ts"],
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
});
