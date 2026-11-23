// @vitest-environment jsdom
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NewJobForm } from "@/components/projects/new-job-form";
import { DraftableNewJob } from "@/components/projects/draftable-new-job";
import { HomeChat } from "@/components/demo-value/home-chat";
import type { JobDraft } from "@/modules/assistant/domain/job-draft";
const mocks = vi.hoisted(() => ({ create: vi.fn(), draft: vi.fn(), home: vi.fn(), ask: vi.fn() }));
vi.mock("@/app/[locale]/projects/new/actions", () => ({ createProjectAction: mocks.create }));
vi.mock("@/app/[locale]/job-draft-actions", () => ({
  draftJobFromNewPage: mocks.draft,
  draftJobFromHome: mocks.home,
}));
vi.mock("@/app/[locale]/home-chat-actions", () => ({ askHomeAction: mocks.ask }));
const seed = {
  businessKey: "J-2611-A7K3",
  idempotencyKey: "2c95e995-e35c-489f-8703-d956f227324a",
  clients: [{ businessKey: "CLIENT-01", name: "星序零售台灣" }],
};
const draft: JobDraft = {
  values: {
    name: "旗艦店裝修",
    locationDistrict: "信義區",
    areaQuantity: "396.694",
    subtype: "RETAIL_FLAGSHIP",
    clientName: "星序零售台灣",
  },
  scopeCategoryIds: ["CUSTOM_MILLWORK"],
  clientMode: "existing",
  clientBusinessKey: "CLIENT-01",
  area: { digits: "120", unit: "坪", squareMetres: "396.694" },
  kept: ["name", "area"],
  dropped: ["locationCity"],
};
let host: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
function type(name: string, value: string) {
  const field = host.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}
it("fills the existing form, marks fields until edited, keeps missing city required and reference editable", async () => {
  await act(() =>
    root.render(
      createElement(NewJobForm, {
        locale: "zh-TW",
        ...seed,
        initialDraft: draft,
        confirmDraft: true,
      }),
    ),
  );
  expect(host.textContent).toContain("120 坪 = 396.694 m²");
  expect(host.textContent).toContain("確認建立");
  expect(host.querySelector<HTMLInputElement>('[name="locationCity"]')?.required).toBe(true);
  expect(host.querySelector<HTMLInputElement>('[name="locationCity"]')?.value).toBe("");
  expect(host.querySelector<HTMLSelectElement>('[name="clientBusinessKey"]')?.value).toBe(
    "CLIENT-01",
  );
  const name = host.querySelector('[name="name"]')!.parentElement!;
  expect(name.textContent).toContain("AI 填入，請確認");
  await act(() => type("name", "已確認名稱"));
  expect(name.textContent).not.toContain("AI 填入，請確認");
  expect(host.querySelector<HTMLInputElement>('[name="businessKey"]')?.readOnly).toBe(false);
  expect(mocks.create).not.toHaveBeenCalled();
});
it("uses unique labels/IDs for two forms in the same thread", async () => {
  await act(() =>
    root.render(
      createElement(
        "div",
        {},
        createElement(NewJobForm, { locale: "en", ...seed }),
        createElement(NewJobForm, { locale: "en", ...seed }),
      ),
    ),
  );
  const ids = [...host.querySelectorAll("[id]")].map((el) => el.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const label of host.querySelectorAll("label[for]"))
    expect(document.getElementById(label.getAttribute("for")!)).not.toBeNull();
});
it("hides drafting when off and retains the ordinary form; Home exposes an explicit second button only when allowed", async () => {
  await act(() =>
    root.render(
      createElement(DraftableNewJob, { locale: "en", initialForm: seed, enabled: false }),
    ),
  );
  expect(host.querySelector("textarea")).toBeNull();
  expect(host.querySelector('[name="name"]')).not.toBeNull();
  await act(() => root.render(createElement(HomeChat, { locale: "en" })));
  expect(host.textContent).not.toContain("Create a job");
  await act(() => root.render(createElement(HomeChat, { locale: "en", canDraftJob: true })));
  expect(host.textContent).toContain("Create a job");
  expect(host.querySelector("textarea")?.maxLength).toBe(280);
});
