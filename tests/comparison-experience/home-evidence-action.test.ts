import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  runComparison: vi.fn(),
  runEconomics: vi.fn(),
}));

vi.mock("@/lib/server/runtime-context", () => ({
  resolveServerRuntimeContext: mocks.context,
}));

vi.mock("@/lib/server/comparison-services", () => ({
  createComparisonServices: () => ({
    runComparison: { execute: mocks.runComparison },
    runEconomics: { execute: mocks.runEconomics },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(url);
  },
}));

import { runComparisonAction } from "@/app/[locale]/projects/[projectKey]/compare/actions";

beforeEach(() => {
  mocks.context.mockResolvedValue({ requestId: "request-1" });
  mocks.runComparison.mockResolvedValue({
    kind: "COMPLETE",
    result: {
      run: { id: "comparison-home" },
      defaultSelectedProjectKeys: ["PRJ-NEIHU-021", "PRJ-ZHONGSHAN-018", "PRJ-NANJING-014"],
    },
  });
  mocks.runEconomics.mockResolvedValue({
    kind: "COMPLETE",
    result: {
      run: { id: "economics-home" },
      selectedProjectKeys: ["PRJ-NEIHU-021", "PRJ-ZHONGSHAN-018", "PRJ-NANJING-014"],
    },
  });
});

function form(claim: string) {
  const data = new FormData();
  data.set("locale", "en");
  data.set("projectKey", "PRJ-XINYI-026");
  data.set("evidenceClaim", claim);
  return data;
}

describe("Home finding evidence deep link", () => {
  it("creates the governed comparison/economics runs and opens the requested claim panel", async () => {
    await expect(
      runComparisonAction(form("XINYI_IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE")),
    ).rejects.toThrow(
      "/en/projects/PRJ-XINYI-026/compare?run=comparison-home&economics=economics-home&selected=PRJ-NEIHU-021%2CPRJ-ZHONGSHAN-018%2CPRJ-NANJING-014&evidenceMode=claim&evidenceClaim=XINYI_IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
    );

    expect(mocks.runComparison).toHaveBeenCalledWith(
      { requestId: "request-1" },
      "PRJ-XINYI-026",
    );
    expect(mocks.runEconomics).toHaveBeenCalledWith(
      { requestId: "request-1" },
      "comparison-home",
      ["PRJ-NEIHU-021", "PRJ-ZHONGSHAN-018", "PRJ-NANJING-014"],
    );
  });

  it("drops an unsafe claim selector rather than reflecting it into the route", async () => {
    let href = "";
    try {
      await runComparisonAction(form("../private"));
    } catch (error) {
      href = (error as Error).message;
    }
    expect(href).toContain("run=comparison-home");
    expect(href).not.toContain("evidenceMode");
    expect(href).not.toContain("private");
  });
});
