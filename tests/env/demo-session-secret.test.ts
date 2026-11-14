import { describe, expect, it } from "vitest";

import { parseDemoSessionSecret } from "@/lib/env/demo-session-secret";

describe("demo session secret environment", () => {
  it("accepts a server-only secret with sufficient entropy length", () => {
    const secret = "a-stage2-demo-session-secret-that-is-long-enough";
    expect(parseDemoSessionSecret({ STRIDEBRAIN_DEMO_SESSION_SECRET: secret })).toBe(secret);
  });

  it("rejects missing, weak, and NEXT_PUBLIC secret configuration", () => {
    expect(() => parseDemoSessionSecret({})).toThrow(/is required/);
    expect(() => parseDemoSessionSecret({ STRIDEBRAIN_DEMO_SESSION_SECRET: "short" })).toThrow(
      /at least 32 bytes/,
    );
    expect(() =>
      parseDemoSessionSecret({
        STRIDEBRAIN_DEMO_SESSION_SECRET: "a-stage2-demo-session-secret-that-is-long-enough",
        NEXT_PUBLIC_STRIDEBRAIN_DEMO_SESSION_SECRET: "never-public",
      }),
    ).toThrow(/never use NEXT_PUBLIC/);
  });
});
