import { seededFirmLists } from "@/fixtures/firm-lists";
// @vitest-environment jsdom
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NewJobForm } from "@/components/projects/new-job-form";
import { DraftableNewJob } from "@/components/projects/draftable-new-job";
import { HomeChat } from "@/components/assistant/home-chat";
import type { JobDraft } from "@/modules/assistant/domain/job-draft";
const mocks = vi.hoisted(() => ({ create: vi.fn(), draft: vi.fn(), home: vi.fn(), ask: vi.fn() }));
vi.mock("@/app/[locale]/projects/new/actions", () => ({ createProjectAction: mocks.create }));
vi.mock("@/app/[locale]/job-draft-actions", () => ({
  draftJobFromNewPage: mocks.draft,
  draftJobFromHome: mocks.home,
}));
vi.mock("@/app/[locale]/home-chat-actions", () => ({ askHomeAction: mocks.ask }));
const seed = {
  catalog: seededFirmLists,
  clientBusinessKey: "C-2611-7KQM",
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
  expect(host.textContent).toContain("120 坪 = 396.69 m²");
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

it.each([
  ["ping", "120", "坪", "396.694", "120", null],
  ["ping", "85", "m2", "85.000", "25.71", "85 m² = 25.71 坪"],
  ["m2", "85", "m2", "85.000", "85", null],
] as const)(
  "fills the firm area unit %s from %s %s and only explains a conversion",
  async (areaDisplayUnit, digits, unit, squareMetres, value, conversion) => {
    await act(() =>
      root.render(
        createElement(NewJobForm, {
          locale: "zh-TW",
          ...seed,
          catalog: { ...seed.catalog, areaDisplayUnit },
          initialDraft: {
            ...draft,
            clientMode: "new",
            clientBusinessKey: "",
            area: { digits, unit, squareMetres },
          },
          confirmDraft: true,
        }),
      ),
    );
    expect(host.querySelector<HTMLInputElement>('[name="areaQuantity"]')?.value).toBe(value);
    expect(host.querySelector<HTMLInputElement>('[name="areaUnit"]')?.value).toBe(areaDisplayUnit);
    if (conversion) expect(host.textContent).toContain(conversion);
    else expect(host.textContent).not.toContain(" = ");
    expect(host.querySelector<HTMLInputElement>('[name="clientBusinessKey"]')?.value).toBe(
      seed.clientBusinessKey,
    );
    expect(host.querySelector<HTMLInputElement>('[name="clientBusinessKey"]')?.readOnly).toBe(
      false,
    );
  },
);

it("collapses old draft cards to their original request, preserves edits and can still submit them", async () => {
  mocks.home.mockResolvedValue({ outcome: { kind: "DRAFT", draft }, form: seed });
  mocks.create.mockResolvedValue({ kind: "INVALID", message: "test submitted" });
  await act(() => root.render(createElement(HomeChat, { locale: "en", canDraftJob: true })));
  async function request(text: string) {
    host.querySelector<HTMLTextAreaElement>('textarea[name="message"]')!.value = text;
    const button = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.textContent === "Create a job",
    )!;
    await act(() => button.click());
  }
  await request("First original job request");
  const first = host.querySelector<HTMLButtonElement>("button[aria-expanded]")!;
  expect(first.textContent).toBe("First original job request");
  const firstPanel = document.getElementById(first.getAttribute("aria-controls")!)!;
  await act(() => type("name", "My edited first job"));
  await request("Second original job request");
  expect(first.getAttribute("aria-expanded")).toBe("false");
  expect(firstPanel.hidden).toBe(true);
  expect(firstPanel.querySelector<HTMLInputElement>('[name="name"]')!.value).toBe(
    "My edited first job",
  );
  first.focus();
  expect(document.activeElement).toBe(first);
  expect(first.tabIndex).toBe(0);
  await act(() => first.click());
  expect(firstPanel.hidden).toBe(false);
  expect(first.getAttribute("aria-expanded")).toBe("true");
  // Submit the same retained form, with validation disabled here to isolate card state.
  const form = firstPanel.querySelector("form")!;
  form.noValidate = true;
  await act(() => form.requestSubmit());
  expect(mocks.create).toHaveBeenCalled();
  const submitted = mocks.create.mock.calls.at(-1)!.find((v) => v instanceof FormData) as FormData;
  expect(submitted.get("name")).toBe("My edited first job");
  expect(mocks.home.mock.calls.slice(-2)).toEqual([
    ["en", "First original job request"],
    ["en", "Second original job request"],
  ]);
});
