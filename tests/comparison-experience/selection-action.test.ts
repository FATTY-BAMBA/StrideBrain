import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  submittedSelectedProjectKeys,
  comparisonHref,
} from "@/modules/comparison-experience/route-state";
const mocks = vi.hoisted(() => ({ context: vi.fn(), get: vi.fn(), run: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.context }));
vi.mock("@/lib/server/comparison-services", () => ({
  createComparisonServices: () => ({
    getComparison: { execute: mocks.get },
    runEconomics: { execute: mocks.run },
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(url);
  },
}));
import { updateComparisonSelectionAction } from "@/app/[locale]/projects/[projectKey]/compare/actions";
const keys = ["PRJ-A", "PRJ-B", "PRJ-C", "PRJ-D", "PRJ-E", "PRJ-F"];
function form(selected: readonly string[], locale = "en") {
  const f = new FormData();
  f.set("locale", locale);
  f.set("projectKey", "PROJECT");
  f.set("comparisonRunId", "comparison-1");
  for (const key of selected) f.append("selectedProjectKey", key);
  return f;
}
beforeEach(() => {
  mocks.context.mockResolvedValue({ requestId: "request-1" });
  mocks.get.mockResolvedValue({
    kind: "COMPLETE",
    result: {
      activeContext: { projectKey: "PROJECT" },
      matches: keys.map((projectKey) => ({ project: { projectKey } })),
      defaultSelectedProjectKeys: keys.slice(0, 3),
    },
  });
  mocks.run.mockImplementation(async (_context, _run, selected) => ({
    kind: "COMPLETE",
    result: { run: { id: "economics-new" }, selectedProjectKeys: selected },
  }));
});
describe("Strict selection command boundary", () => {
  it.each([1, 2, 3])("accepts %i candidates in structural-rank order", async (count) => {
    const selection = keys.slice(0, count).reverse();
    expect(submittedSelectedProjectKeys(form(selection), keys)).toEqual(keys.slice(0, count));
    await expect(updateComparisonSelectionAction(form(selection))).rejects.toThrow(
      comparisonHref("en", "PROJECT", {
        comparisonRunId: "comparison-1",
        economicsRunId: "economics-new",
        selectedProjectKeys: keys.slice(0, count),
      }),
    );
    expect(mocks.run).toHaveBeenCalledWith(
      { requestId: "request-1" },
      "comparison-1",
      keys.slice(0, count),
    );
  });
  it.each(
    [
      [],
      keys.slice(0, 4),
      ["PRJ-FOREIGN"],
      ["PRJ-A", "PRJ-FOREIGN"],
      ["../private"],
      ["PRJ-A,PRJ-B"],
    ].map((selected) => ({ selected })),
  )(
    "rejects invalid or unauthorized submission %j without fallback/writes",
    async ({ selected }) => {
      expect(submittedSelectedProjectKeys(form(selected), keys)).toBeNull();
      await expect(updateComparisonSelectionAction(form(selected))).rejects.toThrow(
        "outcome=UNAVAILABLE",
      );
      expect(mocks.run).not.toHaveBeenCalled();
    },
  );
  it("restores A after B using the newly returned economics ID and clears old panel/proposal selectors", async () => {
    mocks.run
      .mockResolvedValueOnce({
        result: { run: { id: "economics-B" }, selectedProjectKeys: keys.slice(0, 2) },
      })
      .mockResolvedValueOnce({
        result: { run: { id: "economics-A2" }, selectedProjectKeys: keys.slice(0, 3) },
      });
    await expect(updateComparisonSelectionAction(form(keys.slice(0, 2)))).rejects.toThrow(
      "economics=economics-B",
    );
    const f = form(keys.slice(0, 3), "zh-TW");
    f.set("evidenceClaim", "OLD_CLAIM");
    f.set("proposal", "OLD_PROPOSAL");
    let href = "";
    try {
      await updateComparisonSelectionAction(f);
    } catch (e) {
      href = (e as Error).message;
    }
    expect(href).toContain("/zh-TW/");
    expect(href).toContain("economics=economics-A2");
    expect(href).not.toMatch(/OLD_|proposal|evidenceClaim/);
  });
  it("does not call economics for an unsigned context or another project route", async () => {
    mocks.context.mockResolvedValueOnce(null);
    await expect(updateComparisonSelectionAction(form([keys[0]!]))).rejects.toThrow(
      "SESSION_REQUIRED",
    );
    expect(mocks.run).not.toHaveBeenCalled();
    mocks.get.mockResolvedValueOnce({
      kind: "COMPLETE",
      result: { activeContext: { projectKey: "OTHER" } },
    });
    await expect(updateComparisonSelectionAction(form([keys[0]!]))).rejects.toThrow("UNAVAILABLE");
    expect(mocks.run).not.toHaveBeenCalled();
  });
});
