vi.mock("@/lib/server/project-workspace-services", () => ({
  createProjectWorkspaceService: () => ({
    execute: async () => ({ kind: "AVAILABLE", workspace: { project: { stage: "QUOTE_REVIEW" } } }),
  }),
}));
import { seededFirmLists } from "@/fixtures/firm-lists";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  comparison: vi.fn(),
  economics: vi.fn(),
  availability: vi.fn(),
  freshness: vi.fn(),
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.resolve }));
vi.mock("@/lib/server/comparison-services", () => ({
  createComparisonServices: () => ({
    getComparison: { execute: mocks.comparison },
    getEconomics: { execute: mocks.economics },
    getFreshness: { check: mocks.freshness },
  }),
}));
vi.mock("@/lib/server/internal-review-services", () => ({
  createInternalReviewServices: () => ({ availability: mocks.availability }),
}));
vi.mock("@/modules/comparison-experience/build-comparison-experience", () => ({
  buildComparisonExperience: () => ({ version: "test-view" }),
}));
import ComparisonPage from "@/app/[locale]/projects/[projectKey]/compare/page";

describe("Stage 8 comparison entry eligibility", () => {
  const context = {
    firmLists: seededFirmLists,
    requestId: "request-1",
    organizationId: "trusted-org",
  };
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolve.mockResolvedValue(context);
    mocks.comparison.mockResolvedValue({
      kind: "COMPLETE",
      result: { run: { id: "cmprun_1" }, activeContext: { projectKey: "PRJ-A" } },
    });
    mocks.economics.mockResolvedValue({ run: { id: "econrun_1", comparisonRunId: "cmprun_1" } });
    mocks.availability.mockResolvedValue("READY");
    mocks.freshness.mockResolvedValue({
      comparisonRunId: "cmprun_1",
      enrichmentRunId: "econrun_1",
      state: "CURRENT",
      changedSources: [],
    });
  });
  it("binds the server-owned sufficiency preflight to the reopened immutable pair", async () => {
    await ComparisonPage({
      params: Promise.resolve({ locale: "en", projectKey: "PRJ-A" }),
      searchParams: Promise.resolve({ run: "cmprun_1", economics: "econrun_1" }),
    });
    expect(mocks.availability).toHaveBeenCalledWith(context, "PRJ-A", {
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
    expect(mocks.availability).not.toHaveBeenCalled();
  });
  it.each(["STALE", "UNVERIFIED"])("does not offer preparation from a %s result", async (state) => {
    mocks.freshness.mockResolvedValue({
      comparisonRunId: "cmprun_1",
      enrichmentRunId: "econrun_1",
      state,
      changedSources: [],
    });
    await ComparisonPage({
      params: Promise.resolve({ locale: "zh-TW", projectKey: "PRJ-A" }),
      searchParams: Promise.resolve({ run: "cmprun_1", economics: "econrun_1" }),
    });
    expect(mocks.availability).not.toHaveBeenCalled();
  });
});
