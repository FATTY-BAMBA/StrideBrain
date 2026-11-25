// @vitest-environment jsdom
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { projectNavigation, projectSurfaceHref } from "@/modules/navigation/project-navigation";
import { JobChatPanel } from "@/components/assistant/job-chat-panel";
const boundary = vi.hoisted(() => ({ path: "/en/projects/J", ask: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => boundary.path }));
vi.mock("@/app/[locale]/home-chat-actions", () => ({ askHomeAction: boundary.ask }));
vi.mock("@/app/[locale]/job-draft-actions", () => ({ draftJobFromHome: vi.fn() }));
let host: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  boundary.ask.mockImplementation(async (_state, form: FormData) => ({
    turns: [
      {
        id: "answer",
        role: "assistant",
        text: `Saved finding one.\nSaved finding two.`,
        ai: true,
        aiSources: [
          {
            sourceId: "s",
            label: "Saved comparison",
            href: `/${form.get("locale")}/projects/J/compare`,
          },
        ],
      },
    ],
    context: {},
  }));
});
afterEach(async () => {
  await act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
it.each(["en", "zh-TW"] as const)(
  "keeps the thread across job pages, collapses each page and clears on leaving (%s)",
  async (locale) => {
    const base = `/${locale}/projects/J`;
    async function page(path: string) {
      boundary.path = path;
      await act(() =>
        root.render(createElement(JobChatPanel, { key: "J", locale, projectKey: "J" })),
      );
    }
    await page(base);
    const toggle = () => host.querySelector<HTMLButtonElement>("button[aria-controls]")!;
    expect(toggle().textContent).toBe(locale === "en" ? "Ask about this job" : "詢問這個專案");
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    toggle().focus();
    expect(document.activeElement).toBe(toggle());
    expect(toggle().tabIndex).toBe(0);
    expect(host.textContent).not.toMatch(/Create a job|新增專案|建立專案/);
    expect(host.querySelector("textarea")?.placeholder).toBe(
      locale === "en" ? "What is this job's quote status?" : "這個專案的報價狀態如何？",
    );
    await act(() => toggle().click());
    const composer = host.querySelector<HTMLFormElement>("form")!;
    host.querySelector<HTMLTextAreaElement>("textarea")!.value = "What are the saved findings?";
    await act(() => composer.requestSubmit());
    expect((boundary.ask.mock.calls.at(-1)![1] as FormData).get("projectKey")).toBe("J");
    const answer = host.querySelector("article p")!;
    expect(answer.textContent).toBe("Saved finding one.\nSaved finding two.");
    expect([...answer.querySelectorAll("span")].map((e) => e.textContent)).toEqual([
      "Saved finding one.",
      "Saved finding two.",
    ]);
    expect(host.querySelector('a[href$="/compare"]')?.textContent).toBe("Saved comparison");
    for (const tab of projectNavigation.filter((item) => item.segment)) {
      await page(projectSurfaceHref(locale, "J", tab));
      expect(host.querySelector("section")!.hidden).toBe(false);
      expect(toggle().getAttribute("aria-expanded")).toBe("false");
      await act(() => toggle().click());
      expect(host.querySelector("article p")).toBe(answer);
    }
    await page(`${base}/evidence`);
    expect(host.querySelector("section")!.hidden).toBe(true);
    await act(() => root.render(createElement("p", {}, "Home")));
    await page(base);
    expect(host.querySelector("article")).toBeNull();
    // A different job key also mounts a fresh thread.
    await act(() =>
      root.render(createElement(JobChatPanel, { key: "K", locale, projectKey: "K" })),
    );
    expect(host.querySelector('input[name="projectKey"]')?.getAttribute("value")).toBe("K");
    expect(host.querySelector("article")).toBeNull();
  },
);
