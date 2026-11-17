import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  execute: vi.fn(),
  list: vi.fn(),
  receipt: vi.fn(),
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.resolve }));
vi.mock("@/lib/server/project-workspace-services", () => ({
  createProjectWorkspaceService: () => ({ execute: mocks.execute }),
}));
vi.mock("@/lib/server/internal-review-services", () => ({
  createInternalReviewServices: () => ({
    listProjectActions: mocks.list,
    getReceipt: mocks.receipt,
  }),
}));

import ProjectWorkspacePage from "@/app/[locale]/projects/[projectKey]/[[...surface]]/page";

describe("Stage 8 workspace locale restoration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolve.mockResolvedValue({
      locale: "zh-TW",
      organizationId: "trusted-org",
      membershipId: "trusted-member",
      requestId: "request-1",
    });
    mocks.execute.mockResolvedValue({ kind: "AVAILABLE", workspace: { openActions: [] } });
  });

  it("uses validated route locale for overview action titles without changing trusted identity", async () => {
    await ProjectWorkspacePage({
      params: Promise.resolve({ locale: "en", projectKey: "PRJ-A" }),
      searchParams: Promise.resolve({}),
    });
    expect(mocks.execute).toHaveBeenCalledWith(
      {
        locale: "en",
        organizationId: "trusted-org",
        membershipId: "trusted-member",
        requestId: "request-1",
      },
      "PRJ-A",
    );
    mocks.resolve.mockResolvedValue({
      locale: "en",
      organizationId: "trusted-org",
      membershipId: "trusted-member",
      requestId: "request-2",
    });
    await ProjectWorkspacePage({
      params: Promise.resolve({ locale: "zh-TW", projectKey: "PRJ-A" }),
      searchParams: Promise.resolve({}),
    });
    expect(mocks.execute).toHaveBeenLastCalledWith(
      expect.objectContaining({
        locale: "zh-TW",
        organizationId: "trusted-org",
        membershipId: "trusted-member",
      }),
      "PRJ-A",
    );
  });
});
