// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { Locale } from "@/modules/localization/config";

const boundary = vi.hoisted(() => ({ resolve: vi.fn(), execute: vi.fn(), factory: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: boundary.resolve }));
vi.mock("@/lib/server/project-workspace-services", () => ({
  createProjectListService: boundary.factory,
}));
vi.mock("next/navigation", () => ({
  notFound() {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: ReactNode }) => createElement("a", props, children),
}));
import ProjectsPage from "@/app/[locale]/projects/page";
import { ProjectList } from "@/components/projects/project-list";

const trusted: RuntimeContext = {
  requestId: "request",
  userId: "mei",
  membershipId: "membership",
  organizationId: "org_horizon",
  role: "PROJECT_MANAGER_ESTIMATOR",
  capabilities: new Set(["project:read"]),
  assignedProjectIds: new Set(["prj_xinyi_026"]),
  locale: "en",
  dataMode: "DEMO_SYNTHETIC",
};
function render(element: ReactNode) {
  const host = document.createElement("main");
  host.innerHTML = renderToStaticMarkup(element);
  document.body.append(host);
  return host;
}
beforeEach(() => {
  document.body.replaceChildren();
  boundary.resolve.mockReset().mockResolvedValue(trusted);
  boundary.execute.mockReset().mockResolvedValue({ kind: "AVAILABLE", projects: [] });
  boundary.factory.mockReset().mockReturnValue({ execute: boundary.execute });
});

describe("Projects entry server page and semantic navigation", () => {
  it.each(["en", "zh-TW"] as const)(
    "renders a focusable named workspace link preserving %s",
    async (locale) => {
      const name = locale === "en" ? "Xinyi Flagship Renovation" : "信義旗艦店裝修";
      boundary.execute.mockResolvedValue({
        kind: "AVAILABLE",
        projects: [{ businessKey: "PRJ-XINYI-026", name, active: true }],
      });
      const host = render(await ProjectsPage({ params: Promise.resolve({ locale }) }));
      expect(boundary.execute).toHaveBeenCalledExactlyOnceWith({ ...trusted, locale });
      const link = host.querySelector("a")!;
      expect(link.getAttribute("href")).toBe(`/${locale}/projects/PRJ-XINYI-026`);
      expect(link.textContent).toContain(name);
      expect(link.textContent).toContain(locale === "en" ? "Open project" : "開啟專案");
      expect(link.tabIndex).toBe(0);
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.querySelector("h2")?.textContent).toBe(name);
      expect(link.querySelector("button,input,a")).toBeNull();
      expect(link.hasAttribute("onclick")).toBe(false);
      expect(host.querySelector("ul[aria-label]")).not.toBeNull();
      expect(host.textContent).not.toMatch(
        /ACTIVE|QUOTE_REVIEW|programmeWeeks|Horizon Atelier|禾序空間/,
      );
    },
  );
  it.each(["en", "zh-TW"] as const)(
    "uses identical neutral empty and unavailable presentation in %s",
    (locale) => {
      const a = renderToStaticMarkup(
        createElement(ProjectList, { locale, outcome: { kind: "AVAILABLE", projects: [] } }),
      );
      const b = renderToStaticMarkup(
        createElement(ProjectList, { locale, outcome: { kind: "UNAVAILABLE" } }),
      );
      expect(a).toBe(b);
      expect(a).not.toMatch(/Xinyi|信義|PRJ-|count|href=/);
    },
  );
  it.each([null, undefined])(
    "does not query project names when identity is unavailable: %s",
    async (value) => {
      boundary.resolve.mockResolvedValue(value);
      const host = render(await ProjectsPage({ params: Promise.resolve({ locale: "en" }) }));
      expect(boundary.factory).not.toHaveBeenCalled();
      expect(host.querySelector("a")).toBeNull();
      expect(host.textContent).not.toMatch(/Xinyi|Horizon|PRJ-/);
    },
  );
  it("contains failed session resolution without exposing raw diagnostics", async () => {
    boundary.resolve.mockRejectedValue(new Error("private details"));
    const host = render(await ProjectsPage({ params: Promise.resolve({ locale: "zh-TW" }) }));
    expect(host.textContent).toContain("目前沒有可開啟的專案");
    expect(host.textContent).not.toMatch(/private|信義|禾序|PRJ-/);
    expect(boundary.factory).not.toHaveBeenCalled();
  });
  it("rejects invalid locales before identity lookup", async () => {
    await expect(ProjectsPage({ params: Promise.resolve({ locale: "foreign" }) })).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(boundary.resolve).not.toHaveBeenCalled();
  });
  it("ignores browser organization, role and project selectors", async () => {
    const props = {
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        organizationId: "org_northern",
        role: "ORGANIZATION_ADMIN",
        projectKey: "PRJ-NORTH-001",
      }),
    };
    await ProjectsPage(props);
    expect(boundary.execute).toHaveBeenCalledExactlyOnceWith(trusted);
  });
  it("encodes a project key as a single path segment", () => {
    const host = render(
      createElement(ProjectList, {
        locale: "zh-TW" as Locale,
        outcome: {
          kind: "AVAILABLE",
          projects: [
            { businessKey: "PROJECT/one?role=admin", name: "Allowed project", active: false },
          ],
        },
      }),
    );
    expect(host.querySelector("a")?.getAttribute("href")).toBe(
      "/zh-TW/projects/PROJECT%2Fone%3Frole%3Dadmin",
    );
  });
});
