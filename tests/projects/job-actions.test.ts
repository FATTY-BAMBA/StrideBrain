import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectAction } from "@/app/[locale]/projects/new/actions";
import NewProjectPage from "@/app/[locale]/projects/new/page";
import { CreateProject } from "@/modules/projects/application/create-project";
import { jobsCopy } from "@/modules/localization/jobs";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import { jobContext, jobInput } from "./job-fixture";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  create: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.context }));
vi.mock("@/lib/server/project-write-services", () => ({
  createProjectWriteServices: () => ({ create: { execute: mocks.create } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

function form(locale = "en", values: Record<string, unknown> = jobInput()) {
  const data = new FormData();
  data.set("locale", locale);
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) for (const entry of value) data.append(key, String(entry));
    else if (value != null) data.set(key, String(value));
  }
  return data;
}
beforeEach(() => {
  mocks.context.mockResolvedValue(jobContext());
  mocks.create.mockResolvedValue({ kind: "CREATED", businessKey: "JOB" });
  mocks.redirect.mockImplementation(() => {
    throw new Error("REDIRECT");
  });
});

describe("Create job screen and direct server action", () => {
  it.each(["en", "zh-TW"] as const)(
    "renders a labeled form with canonical options in %s",
    async (locale) => {
      const page = await NewProjectPage({ params: Promise.resolve({ locale }) });
      const html = renderToStaticMarkup(page);
      const copy = jobsCopy(locale);
      expect(html).toContain(copy.newJob);
      expect(html).toContain('name="scopeCategoryIds"');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('name="commercialCategoryIds"');
      expect(html).toContain('for="businessKey"');
      expect(html).not.toContain('name="organizationId"');
      expect(html).not.toContain("RESIDENTIAL");
    },
  );
  it.each(["en", "zh-TW"] as const)(
    "reports missing fields with translated copy in %s",
    async (locale) => {
      const createWithAudit = vi.fn();
      mocks.create.mockImplementation((context, input) =>
        new CreateProject({ createWithAudit, updateStageWithAudit: vi.fn() }).execute(
          context,
          input,
        ),
      );
      const input = form(locale, { idempotencyKey: randomUUID(), clientMode: "new" });
      const state = await createProjectAction({}, input);
      expect(state).toMatchObject({
        message: "validation",
        errors: {
          name: "required",
          areaQuantity: "required",
          locationCity: "required",
          scopeCategoryIds: "required",
          commercialCategoryIds: "required",
        },
      });
      expect(jobsCopy(locale)[state.errors!.name!]).toBe(
        locale === "en" ? "This field is required." : "此欄位為必填。",
      );
      expect(createWithAudit).not.toHaveBeenCalled();
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
  it("denies the Viewer screen and direct action even with forged browser authority", async () => {
    mocks.context.mockResolvedValue(
      jobContext({ role: "VIEWER", capabilities: roleBundle("VIEWER") }),
    );
    const html = renderToStaticMarkup(
      await NewProjectPage({ params: Promise.resolve({ locale: "en" }) }),
    );
    expect(html).toContain(jobsCopy("en").unavailable);
    expect(html).not.toContain("<form");
    expect(
      await createProjectAction(
        {},
        form("en", { ...jobInput(), organizationId: "org_horizon", role: "ORGANIZATION_ADMIN" }),
      ),
    ).toEqual({ message: "unavailable" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("uses only the trusted organization and membership on a direct request", async () => {
    const trusted = jobContext({
      organizationId: "org_northern",
      membershipId: "membership_northern_owner",
      role: "ORGANIZATION_ADMIN",
    });
    mocks.context.mockResolvedValue(trusted);
    await expect(
      createProjectAction(
        {},
        form("zh-TW", {
          ...jobInput(),
          organizationId: "org_horizon",
          membershipId: "membership_horizon_admin",
          stage: "COMPLETE",
        }),
      ),
    ).rejects.toThrow("REDIRECT");
    expect(mocks.create.mock.calls[0]![0]).toEqual({ ...trusted, locale: "zh-TW" });
    expect(mocks.create.mock.calls[0]![1]).not.toHaveProperty("organizationId");
    expect(mocks.create.mock.calls[0]![1]).not.toHaveProperty("membershipId");
    expect(mocks.create.mock.calls[0]![1]).not.toHaveProperty("stage");
    expect(mocks.revalidate).toHaveBeenCalledWith("/zh-TW/projects", "layout");
    expect(mocks.redirect).toHaveBeenCalledWith("/zh-TW/projects");
  });
  it.each([
    ["DUPLICATE", "businessKey", "duplicate"],
    ["CLIENT_DUPLICATE", "clientBusinessKey", "duplicate"],
    ["CLIENT_UNAVAILABLE", "clientBusinessKey", "clientUnavailable"],
  ])("maps %s to a safe field error", async (kind, field, code) => {
    mocks.create.mockResolvedValue({ kind });
    expect(await createProjectAction({}, form())).toEqual({
      message: "validation",
      errors: { [field!]: code },
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("contains identity/storage failures and unauthenticated requests", async () => {
    mocks.context.mockResolvedValue(null);
    expect(await createProjectAction({}, form())).toEqual({ message: "unavailable" });
    mocks.context.mockRejectedValue(new Error("private error"));
    expect(await createProjectAction({}, form())).toEqual({ message: "failed" });
    expect(await createProjectAction({}, form("invalid"))).toEqual({ message: "unavailable" });
  });
  it("keeps translated job catalog keys in parity", () => {
    expect(Object.keys(jobsCopy("zh-TW")).sort()).toEqual(Object.keys(jobsCopy("en")).sort());
    expect(renderToStaticMarkup(createElement("span", null, jobsCopy("zh-TW").required))).toContain(
      "此欄位為必填。",
    );
  });
});
