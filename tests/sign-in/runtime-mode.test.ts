import { beforeEach, expect, it, vi } from "vitest";
const f = vi.hoisted(() => ({ real: vi.fn(), demo: vi.fn(), headers: vi.fn() }));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next/headers", () => ({ headers: f.headers }));
vi.mock("@/lib/server/real-identity", () => ({ realIdentityState: f.real }));
vi.mock("@/modules/runtime-context/signed-demo-identity-context", () => ({
  SignedDemoIdentityContext: class {
    constructor() {
      f.demo();
    }
  },
}));
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
beforeEach(() => {
  vi.unstubAllEnvs();
  f.real.mockResolvedValue(null);
  f.headers.mockResolvedValue(new Headers());
});
it("production real mode never constructs the demo adapter, even with a cookie", async () => {
  vi.stubEnv("NEXT_PUBLIC_STRIDEBRAIN_ENV", "production");
  vi.stubEnv("STRIDEBRAIN_SIGN_IN_MODE", "real");
  f.headers.mockResolvedValue(new Headers({ cookie: "stridebrain-demo=synthetic" }));
  expect(await resolveServerRuntimeContext()).toBeNull();
  expect(f.demo).not.toHaveBeenCalled();
});
it("default demo never constructs real auth", async () => {
  vi.stubEnv("NEXT_PUBLIC_STRIDEBRAIN_ENV", "development");
  vi.stubEnv("STRIDEBRAIN_SIGN_IN_MODE", "demo");
  expect(await resolveServerRuntimeContext()).toBeNull();
  expect(f.real).not.toHaveBeenCalled();
});
