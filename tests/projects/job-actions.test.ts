vi.mock("@/app/[locale]/job-draft-actions", () => ({
  draftJobFromNewPage: vi.fn(),
  draftJobFromHome: vi.fn(),
}));
vi.mock("@/lib/server/job-draft-services", () => ({
  jobDraftAvailable: vi.fn().mockResolvedValue(false),
}));
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
  listClients: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.context }));
vi.mock("@/lib/server/project-write-services", () => ({
  createProjectWriteServices: () => ({
    create: { execute: mocks.create },
    listClients: { execute: mocks.listClients },
  }),
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
  mocks.listClients.mockResolvedValue({
    kind: "AVAILABLE",
    clients: [{ businessKey: "CLIENT-01", name: "Aster Retail Taiwan" }],
  });
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
      expect(html).not.toContain('name="commercialCategoryIds"');
      for (const key of ["comparisonClass", "areaUnit", "currency"]) {
        expect(html).toContain(`type="hidden" name="${key}"`);
        expect(html).not.toContain(`<select id="${key}"`);
      }
      const referenceInput = html.match(/<input[^>]*name="businessKey"[^>]*>/)?.[0];
      expect(referenceInput).toMatch(/value="J-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}"/);
      expect(referenceInput).not.toMatch(/readOnly|disabled/i);
      expect(html).toMatch(/<select id="[^"]+-clientBusinessKey"/);
      expect(html).toContain("Aster Retail Taiwan (CLIENT-01)");
      expect(html).toMatch(/for="[^"]+-businessKey"/);
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
    await expect(NewProjectPage({ params: Promise.resolve({ locale: "en" }) })).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(mocks.listClients).not.toHaveBeenCalled();
    expect(
      await createProjectAction(
        {},
        form("en", { ...jobInput(), organizationId: "org_horizon", role: "ORGANIZATION_ADMIN" }),
      ),
    ).toEqual({ message: "unavailable" });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.listClients).not.toHaveBeenCalled();
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
  it("preserves an edited short reference and the existing collision error", async () => {
    const createWithAudit = vi.fn().mockResolvedValue({ kind: "DUPLICATE" });
    mocks.create.mockImplementation((context, input) =>
      new CreateProject({ createWithAudit, updateStageWithAudit: vi.fn() }).execute(context, input),
    );
    const input = { ...jobInput(), businessKey: "J-2611-A7K3" };
    expect(await createProjectAction({}, form("en", input))).toEqual({
      message: "validation",
      errors: { businessKey: "duplicate" },
    });
    expect(createWithAudit.mock.calls[0]![1].businessKey).toBe("J-2611-A7K3");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("surfaces changed-input retries as a conflict", async () => {
    mocks.create.mockResolvedValue({ kind: "CONFLICT" });
    expect(await createProjectAction({}, form())).toEqual({ message: "conflict" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("loads client choices using the trusted tenant and locale without a feature data-mode gate", async () => {
    const trusted = jobContext({ organizationId: "org_northern", dataMode: "TENANT_PRIVATE" });
    mocks.context.mockResolvedValue(trusted);
    const html = renderToStaticMarkup(
      await NewProjectPage({ params: Promise.resolve({ locale: "zh-TW" }) }),
    );
    expect(html).toContain("<form");
    expect(mocks.listClients).toHaveBeenCalledWith({ ...trusted, locale: "zh-TW" });
  });
  it("shows a visible client-list failure without a misleading empty form", async () => {
    mocks.listClients.mockResolvedValue({ kind: "UNAVAILABLE" });
    const html = renderToStaticMarkup(
      await NewProjectPage({ params: Promise.resolve({ locale: "en" }) }),
    );
    expect(html).toContain(jobsCopy("en").clientsUnavailable);
    expect(html).not.toContain("<form");
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
