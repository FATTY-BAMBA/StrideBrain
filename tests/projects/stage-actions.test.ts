import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateProjectStageAction } from "@/app/[locale]/projects/actions";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import { UpdateProjectStage } from "@/modules/projects/application/update-project-stage";
import { jobContext } from "./job-fixture";
const mocks = vi.hoisted(() => ({ context: vi.fn(), update: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.context }));
vi.mock("@/lib/server/project-write-services", () => ({
  createProjectWriteServices: () => ({ updateStage: { execute: mocks.update } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    locale: "zh-TW",
    businessKey: "JOB",
    stage: "DESIGN",
    expectedStage: "QUOTE_REVIEW",
    idempotencyKey: randomUUID(),
    organizationId: "org_horizon",
    membershipId: "membership_horizon_admin",
    role: "ORGANIZATION_ADMIN",
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => {
  mocks.context.mockResolvedValue(jobContext());
  mocks.update.mockResolvedValue({ kind: "UPDATED" });
});
describe("Direct stage server-action boundary", () => {
  it("denies a Viewer regardless of browser authority fields", async () => {
    mocks.context.mockResolvedValue(
      jobContext({ role: "VIEWER", capabilities: roleBundle("VIEWER") }),
    );
    expect(await updateProjectStageAction({}, form())).toEqual({ message: "unavailable" });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("keeps foreign and missing projects non-disclosing and trusts only resolved context", async () => {
    const context = jobContext({
      organizationId: "org_northern",
      membershipId: "membership_northern_owner",
    });
    mocks.context.mockResolvedValue(context);
    mocks.update.mockResolvedValue({ kind: "UNAVAILABLE" });
    expect(await updateProjectStageAction({}, form())).toEqual({ message: "unavailable" });
    expect(mocks.update.mock.calls[0]![0]).toEqual({ ...context, locale: "zh-TW" });
    expect(mocks.update.mock.calls[0]![1]).not.toHaveProperty("organizationId");
    expect(mocks.update.mock.calls[0]![1]).not.toHaveProperty("membershipId");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("rejects malformed stage input before storage", async () => {
    const updateStageWithAudit = vi.fn();
    mocks.update.mockImplementation((context, input) =>
      new UpdateProjectStage({ createWithAudit: vi.fn(), updateStageWithAudit }).execute(
        context,
        input,
      ),
    );
    const data = form();
    data.set("stage", "FREE_TEXT");
    expect(await updateProjectStageAction({}, data)).toEqual({ message: "validation" });
    expect(updateStageWithAudit).not.toHaveBeenCalled();
  });
  it("revalidates the localized list and workspace only on success", async () => {
    expect(await updateProjectStageAction({}, form())).toEqual({ message: "updated" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/zh-TW/projects", "layout");
  });
  it.each([
    ["CONFLICT", "conflict"],
    ["FAILED", "failed"],
    ["INVALID", "validation"],
  ])("shows %s safely", async (kind, message) => {
    mocks.update.mockResolvedValue({ kind });
    expect(await updateProjectStageAction({}, form())).toEqual({ message });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("contains session failures", async () => {
    mocks.context.mockRejectedValue(new Error("private failure"));
    expect(await updateProjectStageAction({}, form())).toEqual({ message: "failed" });
  });
});
