// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { SignInForm } from "@/components/sign-in/sign-in-form";
import { IdentityFrame } from "@/components/sign-in/identity-frame";
import { signInCopy } from "@/modules/localization/sign-in";
const route = vi.hoisted(() => ({ path: "/en/sign-in" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.path,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = "";
});
async function mount(locale: "en" | "zh-TW" = "en", initialError = "") {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(createElement(SignInForm, { locale, returnTo: `/${locale}`, initialError })),
  );
  return { host, root };
}
const submit = async (host: HTMLElement) =>
  act(async () => {
    host
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
it.each(["en", "zh-TW"] as const)(
  "both-only test strip and segmented languages on all standalone pages in %s",
  (locale) => {
    for (const path of ["sign-in", "no-access", "choose-firm"])
      for (const mode of ["both", "real"] as const) {
        route.path = `/${locale}/${path}`;
        const host = document.createElement("div");
        host.innerHTML = renderToStaticMarkup(
          createElement(IdentityFrame, {
            locale,
            mode,
            standalone: "Contents",
            workspace: "Workspace",
          }),
        );
        const c = signInCopy(locale);
        expect(host.textContent).not.toContain("Workspace");
        expect(host.textContent?.includes(c.sampleBadge)).toBe(mode === "both");
        expect(host.textContent?.includes(c.sampleLine)).toBe(mode === "both");
        expect(Boolean(host.querySelector('a[href$="/preview"]'))).toBe(mode === "both");
        const nav = host.querySelector("nav")!;
        expect(nav.getAttribute("aria-label")).toBe(locale === "en" ? "Language" : "語言");
        expect(nav.querySelectorAll("a")).toHaveLength(2);
        expect(nav.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe(
          `/${locale}/${path}`,
        );
        expect(nav.querySelector("svg")).toBeNull();
        expect(nav.textContent).not.toContain("/");
        expect(host.querySelector("article")).not.toBeNull();
      }
  },
);
it("no initial autofocus; sending changes only the pressed control, then focuses the code step", async () => {
  let finish!: (response: Response) => void;
  const fetch = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetch);
  const { host, root } = await mount();
  try {
    expect(document.activeElement).toBe(document.body);
    await submit(host);
    const buttons = [...host.querySelectorAll("button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["Continue with Google", "Please wait…"]);
    expect(buttons.every((b) => b.disabled)).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/email-otp/send-verification-otp",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "", locale: "en" }),
      }),
    );
    await act(async () => finish(Response.json({ success: true })));
    expect(host.querySelector("h1")?.textContent).toBe("Enter your code");
    expect(host.querySelector('input[type="email"]')).toBeNull();
    expect(document.activeElement?.id).toBe("sign-in-code");
    const resend = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "Send again",
    )!;
    expect(resend.disabled).toBe(true);
    expect(resend.parentElement?.textContent).toContain("You can send again in 60 seconds.");
    expect(resend.parentElement?.querySelector('[role="status"], [aria-live]')).toBeNull();
    await act(async () =>
      [...host.querySelectorAll("button")]
        .find((b) => b.textContent === "Use a different email")!
        .click(),
    );
    expect(document.activeElement?.id).toBe("sign-in-email");
    expect(host.querySelector("h1")?.textContent).toBe("Sign in");
  } finally {
    await act(async () => root.unmount());
  }
});
it.each(["en", "zh-TW"] as const)(
  "preserves the exact neutral sentence for every address in %s",
  async (locale) => {
    const exact =
      locale === "en"
        ? "If this email has been invited, a code is on its way. It works for 10 minutes. If it does not arrive, check your spam folder or send it again."
        : "如果這個信箱已受邀，驗證碼已寄出，10 分鐘內有效。沒收到的話，請看看垃圾信件，或重新寄送。";
    expect(signInCopy(locale).neutral).toBe(exact);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ success: true })),
    );
    const { host, root } = await mount(locale);
    try {
      await submit(host);
      expect(host.querySelector('[role="status"]')?.textContent).toBe(exact);
    } finally {
      await act(async () => root.unmount());
    }
  },
);
it("invalid email and invalid code are attached to their fields, while 429/503 are notices below the head", async () => {
  const fetch = vi.fn(async () => Response.json({ code: "INVALID" }, { status: 400 }));
  vi.stubGlobal("fetch", fetch);
  const { host, root } = await mount();
  try {
    await submit(host);
    expect(host.querySelector("#sign-in-email")?.getAttribute("aria-invalid")).toBe("true");
    expect(host.querySelector("#sign-in-email-error")?.textContent).toBe(
      signInCopy("en").invalidEmail,
    );
    fetch.mockResolvedValueOnce(Response.json({ success: true }));
    await submit(host);
    fetch.mockResolvedValueOnce(Response.json({ code: "INVALID_OTP" }, { status: 400 }));
    const input = host.querySelector<HTMLInputElement>("#sign-in-code")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        input,
        "123456",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(host.querySelector("#sign-in-code-error")?.textContent).toBe(signInCopy("en").invalid);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    for (const status of [429, 503]) {
      fetch.mockResolvedValueOnce(Response.json({ code: "ERROR" }, { status }));
      await submit(host);
      expect(host.querySelector("header")?.nextElementSibling?.getAttribute("role")).toBe("alert");
      expect(host.querySelector('[role="alert"]')?.textContent).toBe(
        status === 429 ? signInCopy("en").limited : signInCopy("en").unavailable,
      );
    }
    expect([...host.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Try again"]);
    await act(async () => host.querySelector("button")!.click());
    expect(host.querySelector("#sign-in-code")).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
  }
});
it("query error is an error Notice directly below the sheet head", async () => {
  const { host, root } = await mount("en", signInCopy("en").googleAccount);
  try {
    expect(host.querySelector("header")?.nextElementSibling?.getAttribute("role")).toBe("alert");
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(signInCopy("en").googleAccount);
  } finally {
    await act(async () => root.unmount());
  }
});

it("query errors follow the new page language without resetting the form", async () => {
  const { host, root } = await mount("en", signInCopy("en").googleAccount);
  try {
    await act(async () =>
      root.render(
        createElement(SignInForm, {
          locale: "zh-TW",
          returnTo: "/zh-TW",
          initialError: signInCopy("zh-TW").googleAccount,
        }),
      ),
    );
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(
      signInCopy("zh-TW").googleAccount,
    );
  } finally {
    await act(async () => root.unmount());
  }
});
