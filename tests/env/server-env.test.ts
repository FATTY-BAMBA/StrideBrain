import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/lib/env/server-env";

describe("server environment", () => {
  it("uses safe synthetic defaults", () => {
    const environment = parseServerEnvironment({});

    expect(environment.dataMode).toBe("DEMO_SYNTHETIC");
    expect(environment.publicEnvironment).toBe("development");
    expect(environment.appOrigin.toString()).toBe("http://localhost:3000/");
  });

  it("rejects any real/private data mode in Stage 0", () => {
    expect(() =>
      parseServerEnvironment({ STRIDEBRAIN_DATA_MODE: "TENANT_PRIVATE" }),
    ).toThrow(/DEMO_SYNTHETIC/);
  });

  it("rejects invalid deployment labels", () => {
    expect(() =>
      parseServerEnvironment({ NEXT_PUBLIC_STRIDEBRAIN_ENV: "customer" }),
    ).toThrow(/development, preview, or production/);
  });

  it("rejects non-http origins", () => {
    expect(() =>
      parseServerEnvironment({ STRIDEBRAIN_APP_ORIGIN: "file:///tmp/stridebrain" }),
    ).toThrow(/http or https/);
  });
});
