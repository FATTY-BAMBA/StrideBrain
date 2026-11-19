// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectWorkspaceDTO } from "@/modules/projects/domain/project-workspace";
import { getValueCopy, valueCopies } from "@/modules/demo-value/copy";

const boundary = vi.hoisted(() => ({ resolve: vi.fn(), list: vi.fn(), workspace: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: boundary.resolve }));
vi.mock("@/lib/server/project-workspace-services", () => ({
  createProjectListService: () => ({ execute: boundary.list }),
  createProjectWorkspaceService: () => ({ execute: boundary.workspace }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: ReactNode }) => createElement("a", props, children),
}));
import { loadDemoValueContext } from "@/lib/server/demo-value-context";
import { ValueLaunchpad, PlannedAssistance } from "@/components/demo-value/value-launchpad";
import Home from "@/app/[locale]/page";
import Knowledge from "@/app/[locale]/knowledge/page";
import Brain from "@/app/[locale]/stridebrain/page";

const trusted = { organizationId: "ORG-ALLOWED", userId: "PERSON-ALLOWED", locale: "en" };
// Only the presentation fields consumed by this component are needed here.
const workspace = {
  project: {
    businessKey: "PROJECT/allowed",
    name: { display: "Allowed project" },
    stage: "QUOTE_REVIEW",
    programmeWeeks: "16",
  },
  warnings: ["SUPPLIER_OFFER_STALE"],
  permissions: { canRunComparison: true },
} as unknown as ProjectWorkspaceDTO;
const projects = [{ businessKey: "PROJECT/allowed", name: "Allowed project", active: true }];
function render(node: ReactNode) {
  const host = document.createElement("main");
  host.innerHTML = renderToStaticMarkup(node);
  return host;
}
beforeEach(() => {
  boundary.resolve.mockReset().mockResolvedValue(trusted);
  boundary.list.mockReset().mockResolvedValue({ kind: "AVAILABLE", projects });
  boundary.workspace.mockReset().mockResolvedValue({ kind: "AVAILABLE", workspace });
});
describe("authorized read-only launchpad composition", () => {
  it("reads one workspace selected only from the authorized list and preserves locale", async () => {
    const result = await loadDemoValueContext("zh-TW");
    expect(result.workspace).toBe(workspace);
    expect(boundary.list).toHaveBeenCalledExactlyOnceWith({ ...trusted, locale: "zh-TW" });
    expect(boundary.workspace).toHaveBeenCalledExactlyOnceWith(
      { ...trusted, locale: "zh-TW" },
      "PROJECT/allowed",
    );
  });
  it("does not fetch another tenant's requested project or fall back to a different project", async () => {
    const result = await loadDemoValueContext("en", "PROJECT-OTHER-TENANT");
    expect(result.workspace).toBeNull();
    expect(boundary.workspace).not.toHaveBeenCalled();
  });
  it("does not query project data without a session", async () => {
    boundary.resolve.mockResolvedValue(null);
    expect(await loadDemoValueContext("en")).toEqual({ projects: [], workspace: null });
    expect(boundary.list).not.toHaveBeenCalled();
    expect(boundary.workspace).not.toHaveBeenCalled();
  });
  it.each(["UNAVAILABLE", "EMPTY"])("fails closed for %s list", async (kind) => {
    boundary.list.mockResolvedValue(
      kind === "EMPTY" ? { kind: "AVAILABLE", projects: [] } : { kind },
    );
    expect((await loadDemoValueContext("en")).workspace).toBeNull();
    expect(boundary.workspace).not.toHaveBeenCalled();
  });
  it("does not surface failed reads or private diagnostics", async () => {
    boundary.workspace.mockRejectedValue(new Error("SECRET"));
    expect(await loadDemoValueContext("en")).toEqual({ projects: [], workspace: null });
  });
});
describe.each(["en", "zh-TW"] as const)("value entry in %s", (locale) => {
  it("Home links to real scoped workflows and encodes the key", async () => {
    const host = render(
      await Home({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) }),
    );
    const hrefs = [...host.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain(`/${locale}/projects/PROJECT%2Fallowed`);
    expect(
      hrefs.filter((href) => href === `/${locale}/projects/PROJECT%2Fallowed/compare`),
    ).toHaveLength(2);
    expect(hrefs).toContain(`/${locale}/projects/PROJECT%2Fallowed#commercial-position`);
    expect(hrefs).toContain(`/${locale}/knowledge?project=PROJECT%2Fallowed`);
    expect(host.querySelector("h1")?.textContent).toBe(getValueCopy(locale).homeTitle);
    expect(host.textContent).not.toMatch(
      /Mei|Xinyi|Recent|immutable|deterministic|current stage|later slice|server-side|QUOTE_REVIEW/i,
    );
  });
  it.each([Knowledge, Brain])(
    "renders bounded questions with a truthful comparison prerequisite",
    async (Page) => {
      const host = render(
        await Page({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) }),
      );
      expect(host.textContent).toContain(getValueCopy(locale).bounded);
      const taskHrefs = [...host.querySelectorAll("a")]
        .filter((a) => a.querySelector("h3"))
        .map((a) => a.getAttribute("href"));
      expect(new Set(taskHrefs).size).toBe(taskHrefs.length);
      expect(taskHrefs).toContain(`/${locale}/projects/PROJECT%2Fallowed/compare`);
      expect(taskHrefs).toContain(`/${locale}/projects/PROJECT%2Fallowed#project-attention`);
      expect(host.textContent).not.toContain(getValueCopy(locale).stone);
      expect(host.querySelectorAll('input,textarea,button,[role="textbox"]')).toHaveLength(0);
      expect(
        [...host.querySelectorAll("a")].every(
          (a) => !/\/(commercial|evidence)(?:$|\?)/.test(a.getAttribute("href")!),
        ),
      ).toBe(true);
      const finalHref =
        Page === Knowledge
          ? `/${locale}/projects/PROJECT%2Fallowed#commercial-position`
          : `/${locale}/projects/PROJECT%2Fallowed/actions`;
      expect(
        [...host.querySelectorAll("a")].some((a) => a.getAttribute("href") === finalHref),
      ).toBe(true);
    },
  );
  it("separates company-record discovery from getting project work done", async () => {
    const props = { params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) };
    const knowledge = render(await Knowledge(props));
    const brain = render(await Brain(props));
    const copy = getValueCopy(locale);
    expect(knowledge.querySelector("h1")?.textContent).toBe(copy.knowledgeTitle);
    expect(brain.querySelector("h1")?.textContent).toBe(copy.brainTitle);
    expect(knowledge.textContent).toContain(copy.knowledgeDescription);
    expect(brain.textContent).toContain(copy.brainDescription);
    expect([...knowledge.querySelectorAll("h3")].map((el) => el.textContent)).toEqual([
      copy.similar,
      copy.current,
      copy.records,
    ]);
    expect([...brain.querySelectorAll("h3")].map((el) => el.textContent)).toEqual([
      copy.compare,
      copy.quote,
      copy.next,
      copy.actions,
    ]);
    expect(knowledge.querySelectorAll('a[href$="/actions"]')).toHaveLength(0);
    expect(brain.querySelectorAll('a[href$="/actions"]')).toHaveLength(1);
  });
  it("withholds comparison links from a role without the capability", () => {
    const host = render(
      createElement(ValueLaunchpad, {
        locale,
        surface: "home",
        context: {
          projects,
          workspace: {
            ...workspace,
            permissions: { ...workspace.permissions, canRunComparison: false },
          },
        },
      }),
    );
    expect(host.querySelector('a[href$="/compare"]')).toBeNull();
    expect(host.textContent).toContain(getValueCopy(locale).restricted);
  });
  it("does not disclose fixture identity when no project is authorized", () => {
    const host = render(
      createElement(ValueLaunchpad, {
        locale,
        surface: "home",
        context: { projects: [], workspace: null },
      }),
    );
    expect(host.textContent).not.toMatch(/Xinyi|Horizon|Mei|信義|禾序|Allowed/);
    expect(host.querySelector('a[href*="/projects/"]')).toBeNull();
  });
  it("Planned assistance has no fake execution controls", () => {
    const host = render(createElement(PlannedAssistance, { locale }));
    expect(host.querySelectorAll("li")).toHaveLength(3);
    expect(host.querySelectorAll("a,button,input,[role=button]")).toHaveLength(0);
    expect(
      [...host.querySelectorAll("small")].every(
        (x) => x.textContent === getValueCopy(locale).planned,
      ),
    ).toBe(true);
  });
});
it("has complete primary bilingual copy parity", () => {
  expect(Object.keys(valueCopies.en)).toEqual(Object.keys(valueCopies["zh-TW"]));
  for (const value of Object.values(valueCopies["zh-TW"]))
    for (const text of Array.isArray(value) ? value : [value])
      expect(text).toMatch(/[\u3400-\u9fff]/);
});
it("rejects an invalid locale before querying identity", async () => {
  await expect(
    Home({ params: Promise.resolve({ locale: "other" }), searchParams: Promise.resolve({}) }),
  ).rejects.toThrow("NOT_FOUND");
  expect(boundary.resolve).not.toHaveBeenCalled();
});
