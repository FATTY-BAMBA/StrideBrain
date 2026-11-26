vi.mock("@/app/[locale]/home-chat-actions", () => ({ askHomeAction: vi.fn() }));
import { seededFirmLists } from "@/fixtures/firm-lists";
vi.mock("@/app/[locale]/job-draft-actions", () => ({
  draftJobFromNewPage: vi.fn(),
  draftJobFromHome: vi.fn(),
}));
vi.mock("@/lib/server/job-draft-services", () => ({
  jobDraftAvailable: vi.fn().mockResolvedValue(false),
}));
// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import type { HomeDesk } from "@/modules/home-desk/application/get-home-desk";
import { stageGroups } from "@/modules/projects/domain/stage-groups";
import { homeDeskCopy } from "@/modules/localization/home-desk";
import { getCatalog } from "@/modules/localization/catalog";
const boundary = vi.hoisted(() => ({
  identity: vi.fn(),
  execute: vi.fn(),
  list: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: ReactNode }) => createElement("a", props, children),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (href: string) => {
    throw new Error(`REDIRECT:${href}`);
  },
}));
vi.mock("next/headers", () => ({ cookies: boundary.cookies }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: boundary.identity }));
vi.mock("@/lib/server/home-desk-services", () => ({
  createHomeDeskService: () => ({ execute: boundary.execute }),
}));
vi.mock("@/lib/server/project-workspace-services", () => ({
  createProjectListService: () => ({ execute: boundary.list }),
}));
import { HomeDeskScreen } from "@/components/home-desk/home-desk";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import DecisionsPage from "@/app/[locale]/decisions/page";
import ProjectsPage from "@/app/[locale]/projects/page";
import RootPage from "@/app/(redirect)/page";
import { jobContext } from "../projects/job-fixture";
import { roleBundle } from "@/modules/runtime-context/capabilities";

function fixture(count = 7): HomeDesk {
  const projects = Array.from({ length: count }, (_, i) => ({
    businessKey: `JOB-${i}`,
    name: `Job ${i}`,
    active: true,
    stage: "DISCOVERY" as const,
  }));
  return {
    catalog: seededFirmLists,
    kind: "AVAILABLE",
    projects,
    canCreate: true,
    stageCounts: stageGroups.map((group) => ({
      key: group.key,
      count: group.key === "inquiry" ? count : 0,
    })),
    decisions: projects.map((project) => ({
      key: project.businessKey,
      kind: "DRAFT_QUOTE",
      project,
    })),
    findingsNotices: [],
    closedJobs: [],
    closedJobsUnavailable: false,
    decisionsUnavailable: false,
  };
}
function render(node: ReactNode) {
  const host = document.createElement("main");
  host.innerHTML = renderToStaticMarkup(node);
  return host;
}
beforeEach(() => {
  boundary.execute.mockResolvedValue(fixture());
  boundary.identity.mockResolvedValue(jobContext());
  boundary.list.mockResolvedValue({ kind: "AVAILABLE", projects: fixture().projects });
  boundary.cookies.mockResolvedValue({ get: () => ({ value: "en" }) });
});
it.each(["en", "zh-TW"] as const)(
  "shows five decisions and a real all-items link; stage tiles stay neutral in %s",
  (locale) => {
    const host = render(createElement(HomeDeskScreen, { locale, outcome: fixture() }));
    expect(host.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(host.querySelector(`a[href="/${locale}/decisions"]`)?.textContent).toContain(
      homeDeskCopy(locale).all.replace("{count}", "7"),
    );
    const stages = host.querySelector("nav")!;
    expect(stages.querySelectorAll("a")).toHaveLength(5);
    expect(stages.querySelector("[aria-current]")).toBeNull();
    expect(
      [...stages.querySelectorAll("strong")].reduce(
        (total, item) => total + Number(item.textContent),
        0,
      ),
    ).toBe(7);
    expect(host.querySelectorAll('textarea[name="message"]')).toHaveLength(1);
    expect(host.querySelector('input[name="projectKey"]')).toBeNull();
    expect(host.querySelector("textarea")?.getAttribute("rows")).toBe("1");
    expect(host.querySelector("textarea")?.getAttribute("placeholder")).toBe(
      locale === "en" ? "Have we renovated a flagship store before?" : "我們以前做過旗艦店整修嗎？",
    );
    expect(host.querySelector('button[type="submit"]')?.textContent).toBe(
      locale === "en" ? "Ask" : "提問",
    );
    expect(host.textContent).not.toMatch(/Try asking|你可以試著問|Current project|目前專案/);
  },
);
it("shows no overflow link for five, and the complete decision route shows all seven", async () => {
  expect(
    render(createElement(HomeDeskScreen, { locale: "en", outcome: fixture(5) })).querySelector(
      'a[href="/en/decisions"]',
    ),
  ).toBeNull();
  const complete = render(await DecisionsPage({ params: Promise.resolve({ locale: "en" }) }));
  expect(complete.querySelectorAll("tbody tr")).toHaveLength(7);
  expect(boundary.execute).toHaveBeenCalledWith(
    expect.objectContaining({ organizationId: "org_horizon" }),
  );
});
it("empty firm has one sentence and create; Viewer has no create", () => {
  const empty = render(createElement(HomeDeskScreen, { locale: "en", outcome: fixture(0) }));
  expect(empty.textContent).toContain(homeDeskCopy("en").empty);
  expect(empty.querySelector("table")).toBeNull();
  expect(empty.querySelector('a[href="/en/projects/new"]')).not.toBeNull();
  expect(empty.querySelector("textarea")).toBeNull();
  const viewer = render(
    createElement(HomeDeskScreen, { locale: "en", outcome: { ...fixture(), canCreate: false } }),
  );
  expect(viewer.querySelector('a[href="/en/projects/new"]')).toBeNull();
});
it.each(stageGroups)(
  "Projects validates and filters the $key group using the shared mapping",
  async (group) => {
    const projects = stageGroups.flatMap((item) =>
      item.stages.map((stage) => ({
        businessKey: stage,
        name: stage,
        stage,
        active: stage !== "COMPLETE",
      })),
    );
    boundary.list.mockResolvedValue({ kind: "AVAILABLE", projects });
    const host = render(
      await ProjectsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({ group: group.key, organizationId: "evil" }),
      }),
    );
    const projectLinks = [...host.querySelectorAll("section[aria-labelledby] tbody a")];
    expect(projectLinks.map((link) => link.getAttribute("href"))).toEqual(
      group.stages.map((stage) => `/en/projects/${stage}`),
    );
    expect(host.querySelector('nav a[aria-current="page"]')?.getAttribute("href")).toBe(
      `/en/projects?group=${group.key}`,
    );
    expect(boundary.list).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org_horizon" }),
    );
  },
);
it.each(["bad", ["inquiry", "closed"]])(
  "invalid filter remains visible and cannot select data: %s",
  async (group) => {
    const host = render(
      await ProjectsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({ group }),
      }),
    );
    expect(host.textContent).toContain(homeDeskCopy("en").invalidGroup);
    expect(host.querySelector("nav [aria-current]")).toBeNull();
    expect(host.querySelectorAll('a[href^="/en/projects/JOB-"]')).toHaveLength(7);
  },
);
it.each(["en", "zh-TW"] as const)(
  "places identity and controls in the shared sidebar with only the notice on top in %s",
  (locale) => {
    const host = render(
      WorkspaceShell({
        locale,
        catalog: getCatalog(locale),
        account: { person: "Test person", organization: "Test firm" },
        children: "Screen",
      }),
    );
    const sidebar = host.querySelector("aside")!;
    expect(sidebar.textContent).toContain("Test person");
    expect(sidebar.textContent).toContain("Test firm");
    expect(sidebar.querySelector(`a[href="/${locale}/settings"]`)).not.toBeNull();
    expect(
      sidebar.querySelector('form[action="/api/preview-session/logout"] button')?.textContent,
    ).toBe(homeDeskCopy(locale).signOut);
    expect(host.querySelector("header")?.querySelector("a,button,form")).toBeNull();
    const signedOut = render(
      WorkspaceShell({ locale, catalog: getCatalog(locale), children: "Sign in" }),
    );
    expect(signedOut.querySelector(".language-switcher")).not.toBeNull();
    expect(signedOut.textContent).not.toMatch(/Test person|Test firm/);
  },
);
it("restores the saved locale on app entry and rejects invalid cookie values", async () => {
  await expect(RootPage()).rejects.toThrow("REDIRECT:/en");
  boundary.cookies.mockResolvedValue({ get: () => ({ value: "evil" }) });
  await expect(RootPage()).rejects.toThrow("REDIRECT:/zh-TW");
});
it("the decision route neither reads anonymously nor trusts browser authority; Viewer stays read-only", async () => {
  boundary.identity.mockResolvedValue(null);
  boundary.execute.mockClear();
  const denied = render(await DecisionsPage({ params: Promise.resolve({ locale: "en" }) }));
  expect(denied.textContent).toContain(homeDeskCopy("en").unavailable);
  expect(boundary.execute).not.toHaveBeenCalled();
  boundary.identity.mockResolvedValue(
    jobContext({ role: "VIEWER", capabilities: roleBundle("VIEWER"), organizationId: "other-org" }),
  );
  boundary.execute.mockResolvedValue({ ...fixture(0), canCreate: false });
  const viewer = render(await DecisionsPage({ params: Promise.resolve({ locale: "en" }) }));
  expect(boundary.execute).toHaveBeenCalledWith(
    expect.objectContaining({ role: "VIEWER", organizationId: "other-org" }),
  );
  expect(viewer.querySelector('a[href$="/new"]')).toBeNull();
});
it("does not claim all clear when saved findings are unavailable", () => {
  const desk = fixture(1);
  const host = render(
    createElement(HomeDeskScreen, {
      locale: "en",
      outcome: {
        ...desk,
        decisions: [],
        findingsNotices: [{ project: desk.projects[0]!, kind: "UNAVAILABLE" }],
      },
    }),
  );
  expect(host.textContent).toContain("Saved findings are unavailable");
  expect(host.textContent).not.toContain(homeDeskCopy("en").noDecisions);
});
it("remembers locale changes from existing Settings or review links as well as the sidebar", async () => {
  const { createRoot } = await import("react-dom/client");
  const { act } = await import("react");
  const { LanguageSwitcher } = await import("@/components/shell/language-switcher");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => {
      root.render(
        createElement(LanguageSwitcher, { locale: "en", zhLabel: "繁中", enLabel: "EN" }),
      );
    });
    expect(document.cookie).toContain("stridebrain_locale=en");
    await act(async () => {
      root.render(
        createElement(LanguageSwitcher, { locale: "zh-TW", zhLabel: "繁中", enLabel: "EN" }),
      );
    });
    expect(document.cookie).toContain("stridebrain_locale=zh-TW");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});

it.each(["en", "zh-TW"] as const)(
  "adds the remaining finding count without changing the shared sentence in %s",
  async (locale) => {
    const { claimFindingText } = await import("@/modules/economics/presentation/claim-findings");
    const desk = fixture(1);
    const claim = {
      claimKey: "stone",
      kind: "CATEGORY_QUOTED_VARIANCE" as const,
      categoryId: "IMPORTED_STONE",
      titleEn: "",
      titleZhTw: "",
      warningCodes: [],
      evidenceReferenceIds: ["stone-source"],
      value: { direction: "ABOVE", variancePercent: "43.0000" },
    };
    for (const count of [0, 1, 5]) {
      const item = {
        ...desk.decisions[0]!,
        kind: "REVIEW_QUOTE" as const,
        claim,
        additionalFindingCount: count,
      };
      const host = render(
        createElement(HomeDeskScreen, { locale, outcome: { ...desk, decisions: [item] } }),
      );
      expect(host.querySelector("tbody tr p")?.textContent).toBe(
        claimFindingText(claim, locale, seededFirmLists.workCategories),
      );
      expect(host.querySelectorAll("tbody tr p")).toHaveLength(count ? 2 : 1);
      if (count)
        expect(host.querySelectorAll("tbody tr p")[1]?.textContent).toBe(
          locale === "zh-TW"
            ? `另有 ${count} 項`
            : count === 1
              ? "1 more finding"
              : `${count} more findings`,
        );
      expect(host.querySelector("tbody tr a")?.getAttribute("href")).toContain("stone");
    }
  },
);

it.each(["en", "zh-TW"] as const)(
  "keeps comparison state inside the issue row with a localized panel link (%s)",
  (locale) => {
    const desk = fixture(1);
    for (const state of ["NOT_RUN", "OUT_OF_DATE", undefined] as const) {
      const item = {
        ...desk.decisions[0]!,
        kind: "ISSUE_QUOTE" as const,
        ...(state ? { comparisonHint: state } : {}),
      };
      const host = render(
        createElement(HomeDeskScreen, { locale, outcome: { ...desk, decisions: [item] } }),
      );
      expect(host.querySelectorAll("tbody tr")).toHaveLength(1);
      const hint = host.querySelector(
        `tbody tr a[href="/${locale}/projects/JOB-0/quote#quote-comparison"]`,
      );
      if (state) {
        expect(hint?.parentElement?.textContent).toBe(
          locale === "zh-TW"
            ? `${state === "NOT_RUN" ? "尚未與過往專案比較" : "與過往專案的比較已過期"} · 開啟比較`
            : `${state === "NOT_RUN" ? "Not yet compared with past jobs" : "The comparison with past jobs is out of date"} · Open comparison`,
        );
      } else expect(hint).toBeNull();
    }
  },
);

it.each(["en", "zh-TW"] as const)(
  "shows the signed job gap above the unchanged category lesson (%s)",
  async (locale) => {
    const { ClosedJobEconomicsService } =
      await import("@/modules/economics/domain/closed-job-economics-service");
    const { closedLessonText } = await import("@/modules/home-desk/presentation");
    for (const [quoteBeforeTax, actualCost, direction, expectedEn, expectedZh] of [
      [
        "17300000",
        "13420000",
        "BELOW",
        "Actual cost was NT$3,880,000 below the quote (22.4% of the quote).",
        "實際成本比報價低 NT$3,880,000（報價的 22.4%）",
      ],
      [
        "1000",
        "1250",
        "ABOVE",
        "Actual cost was NT$250 above the quote (25.0% of the quote).",
        "實際成本比報價高 NT$250（報價的 25.0%）",
      ],
      ["1000", "1000", "EQUAL", "Actual cost matched the quote.", "實際成本與報價相同"],
    ]) {
      const lesson = {
        quoteBeforeTax: quoteBeforeTax!,
        actualCost: actualCost!,
        currency: "TWD",
        categoryId: "COORDINATION",
        difference: "50.00",
        exceeded: true,
        quoteEvidenceIds: ["q"],
        actualEvidenceIds: ["a"],
        evidenceReferenceIds: ["q", "a"],
      };
      const desk = fixture(1);
      const host = render(
        createElement(HomeDeskScreen, {
          locale,
          outcome: {
            ...desk,
            closedJobs: [
              {
                project: desk.projects[0]!,
                financialState: "AVAILABLE",
                lesson,
                costDifference: new ClosedJobEconomicsService().jobDifference(lesson),
              },
            ],
          },
        }),
      );
      const gap = host.querySelector(`[data-direction="${direction}"]`)!;
      expect(gap.textContent).toBe(locale === "en" ? expectedEn : expectedZh);
      expect(gap.nextElementSibling?.textContent).toBe(
        closedLessonText(lesson, locale, seededFirmLists.workCategories),
      );
      expect(host.textContent).not.toMatch(/margin|毛利/i);
    }
  },
);
