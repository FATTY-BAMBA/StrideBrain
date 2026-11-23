import { beforeEach, describe, it, expect, vi } from "vitest";
import { jobContext } from "../projects/job-fixture";
import { roleBundle } from "@/modules/runtime-context/capabilities";
const boundary = vi.hoisted(() => ({ context: vi.fn(), execute: vi.fn(), clients: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: boundary.context }));
vi.mock("@/lib/server/job-draft-services", () => ({
  createJobDraftService: () => ({ execute: boundary.execute }),
}));
vi.mock("@/lib/server/project-write-services", () => ({
  createProjectWriteServices: () => ({ listClients: { execute: boundary.clients } }),
}));
import { draftJobFromHome, draftJobFromNewPage } from "@/app/[locale]/job-draft-actions";
beforeEach(() => {
  boundary.context.mockResolvedValue(jobContext());
  boundary.clients.mockResolvedValue({ kind: "AVAILABLE", clients: [] });
  boundary.execute.mockResolvedValue({
    kind: "EMPTY",
    draft: {
      values: {},
      scopeCategoryIds: [],
      kept: [],
      dropped: [],
      clientMode: "new",
      clientBusinessKey: "",
    },
  });
});
describe("job draft server action", () => {
  it.each(["VIEWER", "FINANCIAL_REVIEWER"] as const)(
    "refuses direct %s calls before the model or client read",
    async (role) => {
      boundary.context.mockResolvedValue(jobContext({ role, capabilities: roleBundle(role) }));
      expect(await draftJobFromHome("en", "retail job")).toMatchObject({
        outcome: { kind: "UNAVAILABLE" },
      });
      expect(boundary.execute).not.toHaveBeenCalled();
      expect(boundary.clients).not.toHaveBeenCalled();
    },
  );
  it("bounds each entry point and generates references outside the draft", async () => {
    expect(await draftJobFromHome("en", "a".repeat(281))).toMatchObject({
      outcome: { reason: "INVALID_OUTPUT" },
    });
    expect(await draftJobFromNewPage("en", "a".repeat(1001))).toMatchObject({
      outcome: { reason: "INVALID_OUTPUT" },
    });
    expect(boundary.execute).not.toHaveBeenCalled();
    const out = await draftJobFromNewPage("zh-TW", "a".repeat(600));
    expect(out.form?.businessKey).toMatch(/^J-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    expect(out.form?.idempotencyKey).toMatch(/^[a-f0-9-]{36}$/);
    expect(boundary.execute).toHaveBeenCalledTimes(1);
    expect(boundary.execute.mock.calls[0]![0].locale).toBe("zh-TW");
    expect(JSON.stringify(out.outcome)).not.toContain("businessKey");
  });
  it("keeps an ordinary form available after a draft failure", async () => {
    boundary.execute.mockRejectedValue(new Error("provider private failure"));
    const out = await draftJobFromHome("en", "retail job");
    expect(out).toMatchObject({ outcome: { kind: "UNAVAILABLE" }, form: { clients: [] } });
    expect(JSON.stringify(out)).not.toContain("private");
  });
});
