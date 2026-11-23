// @vitest-environment jsdom
vi.mock("@/lib/server/job-draft-services", () => ({
  jobDraftAvailable: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/app/[locale]/job-draft-actions", () => ({
  draftJobFromNewPage: vi.fn(),
  draftJobFromHome: vi.fn(),
}));
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectWorkspaceDTO } from "@/modules/projects/domain/project-workspace";

const boundary = vi.hoisted(() => ({
  resolve: vi.fn(),
  list: vi.fn(),
  workspace: vi.fn(),
  intelligence: vi.fn(),
  desk: vi.fn(),
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: boundary.resolve }));
vi.mock("@/lib/server/project-workspace-services", () => ({
  createProjectListService: () => ({ execute: boundary.list }),
  createProjectWorkspaceService: () => ({ execute: boundary.workspace }),
}));
vi.mock("@/lib/server/comparison-services", () => ({
  createComparisonServices: () => ({ getHomeComparison: { execute: boundary.intelligence } }),
}));
vi.mock("@/lib/server/home-desk-services", () => ({
  createHomeDeskService: () => ({ execute: boundary.desk }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (href: string) => {
    throw new Error(`REDIRECT:${href}`);
  },
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: ReactNode }) => createElement("a", props, children),
}));

import { loadDemoValueContext } from "@/lib/server/demo-value-context";
import { HomeDeskScreen } from "@/components/home-desk/home-desk";
import type { HomeDesk } from "@/modules/home-desk/application/get-home-desk";
import Home from "@/app/[locale]/page";
import Knowledge from "@/app/[locale]/knowledge/page";
import Brain from "@/app/[locale]/stridebrain/page";

const trusted = { organizationId: "ORG-ALLOWED", userId: "PERSON-ALLOWED", locale: "en" };
const workspace = {
  project: {
    businessKey: "PROJECT/allowed",
    name: { display: "Allowed project" },
    stage: "QUOTE_REVIEW",
    programmeWeeks: "16",
    demoData: false,
  },
  warnings: [],
  permissions: { canRunComparison: true },
  materials: [],
  suppliers: [],
  evidence: [],
  openActions: [],
} as unknown as ProjectWorkspaceDTO;
const projects = [
  {
    businessKey: "PROJECT/allowed",
    name: "Allowed project",
    active: true,
    stage: "QUOTE_REVIEW" as const,
  },
];

const desk: HomeDesk = {
  kind: "AVAILABLE",
  projects,
  canCreate: false,
  stageCounts: [],
  decisions: [],
  findingsNotices: [],
  decisionsUnavailable: false,
  closedJobsUnavailable: false,
  closedJobs: [],
};

function render(node: ReactNode) {
  const host = document.createElement("main");
  host.innerHTML = renderToStaticMarkup(node);
  return host;
}

beforeEach(() => {
  boundary.desk.mockReset().mockResolvedValue(desk);
  boundary.intelligence.mockReset().mockResolvedValue(null);
  boundary.resolve.mockReset().mockResolvedValue(trusted);
  boundary.list.mockReset().mockResolvedValue({ kind: "AVAILABLE", projects });
  boundary.workspace.mockReset().mockResolvedValue({ kind: "AVAILABLE", workspace });
});

describe("authorized read-only Home composition", () => {
  it("reads one workspace selected only from the authorized list and preserves locale", async () => {
    const result = await loadDemoValueContext("zh-TW");
    expect(result.workspace).toBe(workspace);
    expect(boundary.intelligence).toHaveBeenCalledExactlyOnceWith(
      { ...trusted, locale: "zh-TW" },
      workspace.project.businessKey,
    );
    expect(boundary.list).toHaveBeenCalledExactlyOnceWith({ ...trusted, locale: "zh-TW" });
    expect(boundary.workspace).toHaveBeenCalledExactlyOnceWith(
      { ...trusted, locale: "zh-TW" },
      "PROJECT/allowed",
    );
  });

  it("does not fetch an unauthorized requested project", async () => {
    const result = await loadDemoValueContext("en", "PROJECT-OTHER-TENANT");
    expect(result.workspace).toBeNull();
    expect(boundary.workspace).not.toHaveBeenCalled();
  });

  it.each(["en", "zh-TW"] as const)(
    "keeps the job when saved findings fail in %s",
    async (locale) => {
      boundary.intelligence.mockRejectedValue(new Error("FINDINGS_READ_FAILED"));
      const context = await loadDemoValueContext(locale);
      expect(context.projects).toEqual(projects);
      expect(context.workspace).toBe(workspace);
      expect(context.intelligence).toEqual({ kind: "UNAVAILABLE" });
      const host = render(
        createElement(HomeDeskScreen, {
          locale,
          outcome: { ...desk, findingsNotices: [{ project: projects[0]!, kind: "UNAVAILABLE" }] },
        }),
      );
      expect(host.textContent).toContain("Allowed project");
      expect(host.textContent).toContain(
        locale === "en" ? "Saved findings are unavailable." : "目前無法讀取已儲存的比較結果",
      );
      expect(host.querySelector('a[href$="/compare"]')).not.toBeNull();
    },
  );

  it.each(["en", "zh-TW"] as const)("shows one linked out-of-date line in %s", async (locale) => {
    boundary.intelligence.mockResolvedValue({ kind: "OUT_OF_DATE" });
    const host = render(
      createElement(HomeDeskScreen, {
        locale,
        outcome: { ...desk, findingsNotices: [{ project: projects[0]!, kind: "OUT_OF_DATE" }] },
      }),
    );
    const line =
      locale === "en"
        ? "The saved comparison is out of date. Open the comparison to run it again."
        : "已儲存的比較已過期，請開啟比較後重新執行。";
    expect(host.querySelector('a[href$="/compare"]')?.textContent).toBe(line);
    expect(host.textContent?.split(line)).toHaveLength(2);
    expect(host.querySelector('[class*="projectCard"]')).toBeNull();
  });

  it("does not query project data without a session", async () => {
    boundary.resolve.mockResolvedValue(null);
    expect(await loadDemoValueContext("en")).toEqual({ projects: [], workspace: null });
    expect(boundary.list).not.toHaveBeenCalled();
    expect(boundary.workspace).not.toHaveBeenCalled();
  });

  it.each(["en", "zh-TW"] as const)(
    "renders one bounded composer and stage groups in %s",
    async (locale) => {
      const host = render(
        await Home({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) }),
      );
      expect(host.querySelectorAll('textarea[name="message"]')).toHaveLength(1);
      expect(
        host
          .querySelector('textarea[name="message"]')
          ?.closest("form")
          ?.querySelectorAll('button[type="submit"]'),
      ).toHaveLength(1);
      expect(host.textContent).toMatch(/Jobs by stage|各階段專案/);
      expect(host.querySelector('a[href*="/knowledge"]')).toBeNull();
      expect(host.querySelector('a[href*="/stridebrain"]')).toBeNull();
      expect(host.textContent).not.toMatch(/Planned assistance|規劃中的工作協助/);
      expect(host.textContent).not.toMatch(/01|02|03|04|05/);
    },
  );

  it("renders a conversational StrideBrain surface instead of redirecting search controls", () => {
    const host = render(createElement(HomeDeskScreen, { locale: "en", outcome: desk }));
    expect(host.textContent).toContain("Ask StrideBrain");
    expect(host.querySelector('textarea[name="message"]')).not.toBeNull();
    expect(host.querySelector('input[name="q"]')).toBeNull();
  });

  it("does not disclose fixture identity when no project is authorized", () => {
    const host = render(
      createElement(HomeDeskScreen, { locale: "en", outcome: { ...desk, projects: [] } }),
    );
    expect(host.textContent).not.toMatch(/Xinyi|Horizon|Mei|信義|禾序|Allowed/);
    expect(host.querySelector('a[href*="/projects/"]')).toBeNull();
  });

  it("folds the legacy Brain entry into Home", async () => {
    const Page = Brain;
    await expect(
      Page({ params: Promise.resolve({ locale: "en" }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/en");
  });
  it.each(["en", "zh-TW"] as const)("shows Knowledge as planned in %s", async (locale) => {
    const host = render(await Knowledge({ params: Promise.resolve({ locale }) }));
    expect(host.textContent).toContain(locale === "en" ? "Planned" : "規劃中");
    expect(host.querySelector("button,input,form")).toBeNull();
  });
});

it("rejects an invalid locale before querying identity", async () => {
  await expect(
    Home({ params: Promise.resolve({ locale: "other" }), searchParams: Promise.resolve({}) }),
  ).rejects.toThrow("NOT_FOUND");
  expect(boundary.resolve).not.toHaveBeenCalled();
});
