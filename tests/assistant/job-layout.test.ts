// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { jobContext } from "../projects/job-fixture";
import { getCatalog } from "@/modules/localization/catalog";
import { quoteDraftCopy } from "@/modules/localization/quote-draft";
import { projectNavigation, projectSurfaceHref } from "@/modules/navigation/project-navigation";
import type { Locale } from "@/modules/localization/config";
import styles from "@/components/assistant/job-chat-panel.module.css";
import ui from "@/components/ui/ui.module.css";
const boundary = vi.hoisted(() => ({
  path: "",
  context: vi.fn(),
  policy: vi.fn(),
  workspace: vi.fn(),
  quote: vi.fn(),
  issue: vi.fn(),
  actions: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  usePathname: () => boundary.path,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => {
    throw Error("FRAMEWORK_404");
  },
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: boundary.context }));
vi.mock("@/lib/server/assistant-services", () => ({
  createAssistantControlServices: () => ({ repository: { jobPolicy: boundary.policy } }),
}));
vi.mock("@/lib/server/project-workspace-services", () => ({
  createProjectWorkspaceService: () => ({ execute: boundary.workspace }),
}));
vi.mock("@/lib/server/project-write-services", () => ({
  createProjectWriteServices: () => ({ siteAddress: { read: vi.fn().mockResolvedValue(null) } }),
}));
vi.mock("@/lib/server/quote-draft-services", () => ({
  createQuoteDraftServices: () => ({ read: { execute: boundary.quote } }),
}));
vi.mock("@/lib/server/quote-issue-services", () => ({
  createQuoteIssueServices: () => ({ read: { execute: boundary.issue } }),
}));
vi.mock("@/lib/server/internal-review-services", () => ({
  createInternalReviewServices: () => ({ listProjectActions: boundary.actions }),
}));
vi.mock("@/components/projects/project-workspace-overview", () => ({
  ProjectWorkspaceOverview: () => createElement("p", {}, "Available overview"),
}));
vi.mock("@/app/[locale]/home-chat-actions", () => ({ askHomeAction: vi.fn() }));
vi.mock("@/app/[locale]/job-draft-actions", () => ({ draftJobFromHome: vi.fn() }));
import JobLayout from "@/app/[locale]/projects/[projectKey]/layout";
import Overview from "@/app/[locale]/projects/[projectKey]/[[...surface]]/page";
import Quote from "@/app/[locale]/projects/[projectKey]/quote/page";
import Compare from "@/app/[locale]/projects/[projectKey]/compare/page";
import { WorkspaceShell } from "@/components/shell/workspace-shell";

beforeEach(() => {
  boundary.context.mockResolvedValue(jobContext());
  boundary.policy.mockResolvedValue({ id: "job", excluded: false });
  boundary.workspace.mockResolvedValue({ kind: "AVAILABLE", workspace: {} });
  boundary.quote.mockResolvedValue({ kind: "UNAVAILABLE" });
  boundary.issue.mockResolvedValue({ kind: "UNAVAILABLE" });
  boundary.actions.mockResolvedValue({ kind: "ACTION_NOT_AUTHORIZED", requestId: "" });
});
async function page(locale: Locale, segment: string) {
  const params = Promise.resolve({ locale, projectKey: "J", surface: segment ? [segment] : [] });
  return segment === "quote"
    ? Quote({ params })
    : segment === "compare"
      ? Compare({ params, searchParams: Promise.resolve({ outcome: "UNAVAILABLE" }) })
      : Overview({ params, searchParams: Promise.resolve({}) });
}
async function composed(locale: Locale, child: ReactNode) {
  const layout = await JobLayout({
    children: child,
    params: Promise.resolve({ locale, projectKey: "J" }),
  });
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    WorkspaceShell({ locale, catalog: getCatalog(locale), children: layout }),
  );
  return host;
}
it.each(["en", "zh-TW"] as const)(
  "places the single nav and bar together before each of the four page bodies (%s)",
  async (locale) => {
    for (const tab of projectNavigation) {
      boundary.path = projectSurfaceHref(locale, "J", tab);
      const host = await composed(locale, await page(locale, tab.segment));
      const nav = host.querySelector(
        `nav[aria-label="${locale === "en" ? "Project workspace navigation" : "專案工作區導覽"}"]`,
      )!;
      expect(
        host.querySelectorAll(`nav[aria-label="${nav.getAttribute("aria-label")}"]`),
      ).toHaveLength(1);
      const panel = nav.nextElementSibling!;
      expect(panel.getAttribute("aria-label")).toBe(
        locale === "en" ? "Ask about this job" : "詢問這個專案",
      );
      expect(panel.hasAttribute("hidden")).toBe(false);
      expect(nav.parentElement).toBe(panel.parentElement);
      expect(nav.parentElement?.className).toBe(styles.navigation);
      const body = nav.parentElement!.nextElementSibling!;
      expect(body.className).toBe(styles.body);
      expect(body.firstElementChild).not.toBeNull();
      expect(body.querySelector("nav[aria-label]")).toBeNull();
      expect(nav.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe(boundary.path);
      expect(host.querySelectorAll('textarea[name="message"]')).toHaveLength(1);
      expect(panel.querySelector("button")?.getAttribute("aria-expanded")).toBe("false");
    }
    // The available overview branch no longer owns a second nav either.
    boundary.workspace.mockResolvedValue({ kind: "AVAILABLE", workspace: {} });
    boundary.path = `/${locale}/projects/J`;
    const available = await composed(locale, await page(locale, ""));
    expect(available.textContent).toContain("Available overview");
    expect(
      available.querySelectorAll(
        'nav[aria-label$="workspace navigation"],nav[aria-label="專案工作區導覽"]',
      ),
    ).toHaveLength(1);
  },
);
function rule(path: string, selector: string) {
  const css = readFileSync(path, "utf8");
  const declaration = css.match(new RegExp(`\\.${selector}\\s*\\{([^}]+)\\}`))?.[1];
  if (!declaration) throw new Error(`Missing .${selector} rule`);
  return declaration;
}
it.each([false, true])(
  "keeps the 16px panel gap and shared column independent of stylesheet order (ui last: %s)",
  async (uiLast) => {
    boundary.path = "/en/projects/J";
    const panelCss = "src/components/assistant/job-chat-panel.module.css";
    const navRule = rule(panelCss, "navigation");
    const bodyRule = rule(panelCss, "body");
    for (const column of [navRule, bodyRule]) {
      expect(column).toMatch(/width:\s*min\(100%, var\(--page-width\)\)/);
      expect(column).toMatch(/margin-inline:\s*auto/);
    }
    // Only width containment changes the older page bodies.
    expect(bodyRule).not.toMatch(/(?:font|gap|padding|line-height):/);
    const panelRules = `.${styles.navigation} {${navRule}} .${styles.body} {${bodyRule}}`;
    const uiRule = `.${ui.page} {${rule("src/components/ui/ui.module.css", "page")}}`;
    const tokens = readFileSync("src/styles/tokens.css", "utf8");
    const sheet = document.createElement("style");
    sheet.textContent = [tokens, ...(uiLast ? [panelRules, uiRule] : [uiRule, panelRules])].join(
      "\n",
    );
    const host = await composed("en", await page("en", ""));
    document.head.append(sheet);
    document.body.append(host);
    try {
      const nav = host.querySelector<HTMLElement>(`.${styles.navigation}`)!;
      expect(nav.classList.contains(ui.page!)).toBe(false);
      expect(getComputedStyle(nav).display).toBe("grid");
      expect(getComputedStyle(nav).gap).toBe("16px");
      expect(tokens).toMatch(/--space-16:\s*16px/);
      expect(tokens).toMatch(/--page-width:\s*1120px/);
    } finally {
      host.remove();
      sheet.remove();
    }
  },
);
it.each(["en", "zh-TW"] as const)(
  "keeps the pages' localized unavailable states and tabs inside the app when signed out (%s)",
  async (locale) => {
    boundary.context.mockResolvedValue(null);
    const expected = [
      getCatalog(locale)["project.unavailableTitle"],
      quoteDraftCopy(locale).UNAVAILABLE,
      locale === "en" ? "Sign in" : "登入",
    ];
    for (const [i, segment] of ["", "quote", "compare"].entries()) {
      boundary.path = `/${locale}/projects/J${segment ? `/${segment}` : ""}`;
      const host = await composed(locale, await page(locale, segment));
      expect(host.querySelector("aside")).not.toBeNull();
      expect(host.querySelector("main")?.textContent).toContain(expected[i]);
      expect(
        host.querySelectorAll(
          'nav[aria-label$="workspace navigation"],nav[aria-label="專案工作區導覽"]',
        ),
      ).toHaveLength(1);
      expect(host.querySelector('textarea[name="message"]')).toBeNull();
    }
    expect(boundary.policy).not.toHaveBeenCalled();
  },
);
it.each(["no capability", "no policy", "lookup failure", "session failure"])(
  "an optional panel %s cannot replace the child page with a 404",
  async (scenario) => {
    if (scenario === "no capability")
      boundary.context.mockResolvedValue(jobContext({ capabilities: new Set() }));
    if (scenario === "no policy") boundary.policy.mockResolvedValue(null);
    if (scenario === "lookup failure") boundary.policy.mockRejectedValue(Error("temporary"));
    if (scenario === "session failure") boundary.context.mockRejectedValue(Error("temporary"));
    const host = await composed("zh-TW", createElement("p", {}, "頁面的不可用狀態"));
    expect(host.querySelector("main")?.textContent).toContain("頁面的不可用狀態");
    expect(host.querySelector('nav[aria-label="專案工作區導覽"]')).not.toBeNull();
    expect(host.querySelector('textarea[name="message"]')).toBeNull();
    if (["no capability", "session failure"].includes(scenario))
      expect(boundary.policy).not.toHaveBeenCalled();
  },
);

it("uses a non-disclosing 404 for an unavailable overview, without treating optional panel failure as denial", async () => {
  boundary.workspace.mockResolvedValue({ kind: "UNAVAILABLE" });
  await expect(page("en", "")).rejects.toThrow("FRAMEWORK_404");
});
