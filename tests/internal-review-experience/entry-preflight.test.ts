import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  comparison: vi.fn(),
  economics: vi.fn(),
  canPrepare: vi.fn(),
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.resolve }));
vi.mock("@/lib/server/comparison-services", () => ({
  createComparisonServices: () => ({
    getComparison: { execute: mocks.comparison },
    getEconomics: { execute: mocks.economics },
  }),
}));
vi.mock("@/lib/server/internal-review-services", () => ({
  createInternalReviewServices: () => ({ canPrepare: mocks.canPrepare }),
}));
vi.mock("@/modules/comparison-experience/build-comparison-experience", () => ({
  buildComparisonExperience: () => ({ version: "test-view" }),
}));
import ComparisonPage from "@/app/[locale]/projects/[projectKey]/compare/page";

describe("Stage 8 comparison entry eligibility", () => {
  const context = { requestId: "request-1", organizationId: "trusted-org" };
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolve.mockResolvedValue(context);
    mocks.comparison.mockResolvedValue({
      kind: "COMPLETE",
      result: { run: { id: "cmprun_1" }, activeContext: { projectKey: "PRJ-A" } },
    });
    mocks.economics.mockResolvedValue({ run: { id: "econrun_1", comparisonRunId: "cmprun_1" } });
    mocks.canPrepare.mockResolvedValue(true);
  });
  it("binds the server-owned sufficiency preflight to the reopened immutable pair", async () => {
    await ComparisonPage({
      params: Promise.resolve({ locale: "en", projectKey: "PRJ-A" }),
      searchParams: Promise.resolve({ run: "cmprun_1", economics: "econrun_1" }),
    });
    expect(mocks.canPrepare).toHaveBeenCalledWith(context, "PRJ-A", {
      comparisonRunId: "cmprun_1",
      enrichmentRunId: "econrun_1",
    });
  });
  it("does not offer preparation without an authorized economics result", async () => {
    mocks.economics.mockResolvedValue(null);
    await ComparisonPage({
      params: Promise.resolve({ locale: "en", projectKey: "PRJ-A" }),
      searchParams: Promise.resolve({ run: "cmprun_1", economics: "econrun_foreign" }),
    });
    expect(mocks.canPrepare).not.toHaveBeenCalled();
  });
});
