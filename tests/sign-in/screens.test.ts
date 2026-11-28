// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  path: "/en/sign-in",
  push: vi.fn(),
  refresh: vi.fn(),
  change: vi.fn(async () => "SUCCESS"),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mocks.path,
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/[locale]/settings/people/actions", () => ({ changePerson: mocks.change }));
import { PeopleList, type PersonRow } from "@/components/sign-in/people-form";
import { SignInForm } from "@/components/sign-in/sign-in-form";
import { IdentityFrame } from "@/components/sign-in/identity-frame";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { getCatalog } from "@/modules/localization/catalog";
const person: PersonRow = {
  id: "member",
  name: "Synthetic Person",
  email: "sample@example.invalid",
  role: "VIEWER",
  active: true,
  invitationStatus: "JOINED",
  invitationEmailStatus: "SENT",
  assignments: [],
};
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});
async function mount(element: React.ReactNode) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return { host, root };
}
function button(host: ParentNode, text: string) {
  const result = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent === text,
  );
  if (!result) throw new Error(`Missing button ${text}`);
  return result;
}
it("People is a list, opens a dialog, saves name/role/access together and asks before deactivating", async () => {
  const { host, root } = await mount(
    createElement(PeopleList, {
      locale: "en",
      people: [person],
      jobs: [],
      actorMembershipId: "other",
    }),
  );
  try {
    expect(host.querySelector("ul li")?.textContent).toContain("Synthetic Person");
    expect(host.querySelector("dialog")).toBeNull();
    await act(async () => button(host, person.name).click());
    expect(host.querySelector("dialog")?.open).toBe(true);
    expect(host.querySelector('input[type="email"]')).toBeNull();
    const select = host.querySelector("select")!;
    await act(async () => {
      select.value = "FINANCIAL_REVIEWER";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(mocks.change).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "update",
        role: "FINANCIAL_REVIEWER",
        name: person.name,
        assignments: [],
        membershipId: person.id,
      }),
    );
    expect(host.querySelector("dialog")).toBeNull();
    await act(async () => button(host, person.name).click());
    const before = mocks.change.mock.calls.length;
    await act(async () => button(host, "Deactivate").click());
    expect(mocks.change.mock.calls).toHaveLength(before);
    expect(host.querySelector("h2")?.textContent).toBe(
      "Deactivate Synthetic Person? They lose access at once. What they created stays.",
    );
    await act(async () => button(host, "Cancel").click());
    expect(host.querySelector('input[name="name"]')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
  }
});
it("does not offer self-deactivation and confirms cancelling an invited person", async () => {
  const { host, root } = await mount(
    createElement(PeopleList, {
      locale: "en",
      people: [person],
      jobs: [],
      actorMembershipId: person.id,
    }),
  );
  try {
    await act(async () => button(host, person.name).click());
    expect([...host.querySelectorAll("button")].map((b) => b.textContent)).not.toContain(
      "Deactivate",
    );
    await act(async () =>
      root.render(
        createElement(PeopleList, {
          locale: "en",
          people: [{ ...person, invitationStatus: "INVITED" }],
          jobs: [],
          actorMembershipId: "other",
        }),
      ),
    );
    await act(async () => button(host, "Cancel invitation").click());
    expect(host.querySelector("h2")?.textContent).toBe(
      "Cancel the invitation to Synthetic Person?",
    );
  } finally {
    await act(async () => root.unmount());
  }
});
it("opens the invitation only from the header and names its controls", async () => {
  const { host, root } = await mount(
    createElement(PeopleList, {
      locale: "zh-TW",
      people: [],
      jobs: [],
      actorMembershipId: "owner",
    }),
  );
  try {
    await act(async () => button(host, "邀請成員").click());
    expect(host.querySelector("dialog")?.open).toBe(true);
    expect([...host.querySelectorAll("label")].map((x) => x.textContent)).toEqual([
      "姓名",
      "電子信箱",
      "角色",
    ]);
    expect(host.textContent).toContain("看不到報價與金額。");
  } finally {
    await act(async () => root.unmount());
  }
});
it.each(["en", "zh-TW"] as const)(
  "standalone pages omit workspace and keep visible language choices in %s",
  (locale) => {
    for (const path of ["sign-in", "no-access", "choose-firm"]) {
      mocks.path = `/${locale}/${path}`;
      const text = renderToStaticMarkup(
        createElement(IdentityFrame, {
          locale,
          mode: "both",
          standalone: createElement("form", null, "Sign in"),
          workspace: createElement("nav", null, "Workspace"),
        }),
      );
      expect(text).not.toContain("Workspace");
      expect(text).toContain("StrideBrain");
      expect(text).toContain("繁中");
      expect(text).toContain("EN");
      expect(text).toContain(
        locale === "en" ? "Test site. No real customer data." : "測試站，不含真實客戶資料。",
      );
    }
  },
);
it("only offers firm switching with multiple firm choices", () => {
  mocks.path = "/en";
  const props = {
    locale: "en" as const,
    realSignIn: true,
    catalog: getCatalog("en"),
    children: "Page",
    account: { person: "Synthetic", organization: "Synthetic firm", role: "Owner" },
  };
  expect(
    renderToStaticMarkup(createElement(WorkspaceShell, { ...props, canSwitchFirm: false })),
  ).not.toContain("Switch firm");
  expect(
    renderToStaticMarkup(createElement(WorkspaceShell, { ...props, canSwitchFirm: true })),
  ).toContain("Switch firm");
});
it("shows invalid-email copy, allows changing address after sending, and routes uninvited correct codes to no-access", async () => {
  const fetch = vi.fn(async () => Response.json({ code: "INVALID" }, { status: 400 }));
  vi.stubGlobal("fetch", fetch);
  const { host, root } = await mount(createElement(SignInForm, { locale: "en", returnTo: "/en" }));
  try {
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(host.textContent).toContain("Enter a valid email address.");
    expect(host.textContent).not.toContain("This code cannot");
    fetch.mockResolvedValueOnce(Response.json({ success: true }));
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(host.querySelector('input[type="email"]')).toBeNull();
    expect(document.activeElement?.id).toBe("sign-in-code");
    expect(host.querySelector("h1")?.textContent).toBe("Enter your code");
    await act(async () => button(host, "Use a different email").click());
    expect(host.querySelector('input[type="email"]')?.hasAttribute("disabled")).toBe(false);
    expect(host.querySelector('[autocomplete="one-time-code"]')).toBeNull();
    fetch.mockResolvedValueOnce(Response.json({ code: "NO_FIRM_ACCESS" }, { status: 403 }));
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(mocks.push).toHaveBeenCalledWith("/en/no-access");
  } finally {
    await act(async () => root.unmount());
  }
});
