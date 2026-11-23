import { afterEach, beforeEach, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ enabled: vi.fn() }));
vi.mock("@/lib/server/prisma", () => ({ getPrismaClient: () => ({}) }));
vi.mock("@/repositories/prisma/prisma-assistant-repository", () => ({
  PrismaAssistantRepository: class {
    enabled = boundary.enabled;
  },
}));
import { jobDraftAvailable } from "@/lib/server/job-draft-services";
import { jobContext } from "../projects/job-fixture";
import { roleBundle } from "@/modules/runtime-context/capabilities";
beforeEach(() => {
  vi.stubEnv("STRIDEBRAIN_AI_ENABLED", "true");
  vi.stubEnv("STRIDEBRAIN_AI_PAID_TIER_CONFIRMED", "true");
  vi.stubEnv("STRIDEBRAIN_GEMINI_API_KEY", "synthetic-test-key");
  boundary.enabled.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());
it("shows controls for owner/manager only when the paid service and firm switch are enabled", async () => {
  for (const role of ["ORGANIZATION_ADMIN", "PROJECT_MANAGER_ESTIMATOR"] as const)
    expect(await jobDraftAvailable(jobContext({ role, capabilities: roleBundle(role) }))).toBe(
      true,
    );
  for (const role of ["VIEWER", "FINANCIAL_REVIEWER"] as const)
    expect(await jobDraftAvailable(jobContext({ role, capabilities: roleBundle(role) }))).toBe(
      false,
    );
  boundary.enabled.mockResolvedValue(false);
  expect(await jobDraftAvailable(jobContext())).toBe(false);
  boundary.enabled.mockResolvedValue(true);
  for (const env of [
    "STRIDEBRAIN_AI_ENABLED",
    "STRIDEBRAIN_AI_PAID_TIER_CONFIRMED",
    "STRIDEBRAIN_GEMINI_API_KEY",
  ]) {
    const previous = process.env[env];
    vi.stubEnv(env, "");
    expect(await jobDraftAvailable(jobContext())).toBe(false);
    vi.stubEnv(env, previous);
  }
});
