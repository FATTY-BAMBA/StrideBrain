// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/modules/quote-comparison/request", () => ({ requestQuoteComparison: mock.request }));
import { QuoteComparisonPanel } from "@/components/quote-document/quote-comparison-panel";
import { quoteComparisonCopy } from "@/modules/localization/quote-comparison";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const host = document.createElement("div");
document.body.append(host);
let root = createRoot(host);
afterEach(async () => {
  await act(async () => root.unmount());
  host.replaceChildren();
  root = createRoot(host);
});
it.each(["en", "zh-TW"] as const)(
  "Run fills the panel in place; stale results remove findings (%s)",
  async (locale) => {
    mock.request.mockResolvedValueOnce({ kind: "NOT_RUN" });
    const onPrepared = vi.fn(),
      copy = quoteComparisonCopy(locale);
    await act(async () =>
      root.render(
        createElement(
          QuoteComparisonPanel,
          {
            projectKey: "JOB",
            locale,
            onPrepared,
          },
          "Category references",
        ),
      ),
    );
    expect(mock.request).toHaveBeenCalledWith(locale, "JOB", "READ");
    expect(host.textContent).toContain(copy.NOT_RUN);
    const sentence =
      locale === "en"
        ? "Lighting and electrical: quoted price is 9.4% above past quoted prices."
        : "照明與電氣：報價比過往報價高 9.4%";
    mock.request.mockResolvedValueOnce({
      kind: "CURRENT",
      generatedAt: "2026-11-25",
      href: `/${locale}/projects/JOB/compare?comparison=run`,
      jobs: [{ projectKey: "PAST", name: "Past job", score: 56 }],
      findings: [{ sentence, href: `/${locale}/projects/JOB/compare?evidenceClaim=price` }],
    });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(mock.request).toHaveBeenLastCalledWith(locale, "JOB", "RUN");
    expect(host.textContent).toContain(sentence);
    expect(host.textContent).toContain("56/100");
    expect(host.querySelector('a[href*="evidenceClaim"]')?.getAttribute("href")).toContain(
      `/${locale}/`,
    );
    expect(host.textContent).toContain("Category references");
    mock.request.mockResolvedValueOnce({ kind: "OUT_OF_DATE" });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(host.textContent).toContain(copy.OUT_OF_DATE);
    expect(host.textContent).not.toContain(sentence);
    expect(onPrepared).not.toHaveBeenCalled();
  },
);

it.each(["en", "zh-TW"] as const)(
  "names missing pricing categories after Run (%s)",
  async (locale) => {
    mock.request.mockResolvedValueOnce({ kind: "NOT_RUN" });
    await act(async () =>
      root.render(
        createElement(QuoteComparisonPanel, { projectKey: "JOB", locale, onPrepared: vi.fn() }),
      ),
    );
    mock.request.mockResolvedValueOnce({
      kind: "CONTEXT_INCOMPLETE",
      missingFields: ["COMMERCIAL_CATEGORIES"],
    });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      quoteComparisonCopy(locale).missingCategories,
    );
    mock.request.mockResolvedValueOnce({ kind: "CONTEXT_INCOMPLETE", missingFields: ["AREA"] });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      quoteComparisonCopy(locale).CONTEXT_INCOMPLETE,
    );
  },
);
it.each(["en", "zh-TW"] as const)(
  "keeps closed-job findings readable, limits to five and opens for the fragment (%s)",
  async (locale) => {
    window.history.replaceState(null, "", "/#quote-comparison");
    mock.request.mockResolvedValue({
      kind: "CURRENT",
      generatedAt: "2026-11-27",
      href: `/${locale}/projects/JOB/compare`,
      jobs: [{ projectKey: "PAST", name: "Past", score: 56 }],
      findings: Array.from({ length: 8 }, (_, i) => ({
        sentence: `Saved sentence ${i}`,
        href: `/${locale}/projects/JOB/compare?claim=${i}`,
      })),
    });
    await act(async () =>
      root.render(
        createElement(QuoteComparisonPanel, {
          locale,
          projectKey: "JOB",
          closed: true,
          onPrepared: vi.fn(),
        }),
      ),
    );
    expect(host.querySelector("button")).toBeNull();
    expect(host.querySelector("details")?.open).toBe(true);
    expect(host.querySelectorAll('a[href*="?claim="]')).toHaveLength(5);
    expect(host.querySelector("summary")?.textContent).toContain("8");
    expect(host.textContent).not.toContain("Saved sentence 5");
    expect(mock.request).toHaveBeenLastCalledWith(locale, "JOB", "READ");
    const source = host.querySelector('a[href*="claim=4"]')!;
    const all = [...host.querySelectorAll("a")].find(
      (a) => a.textContent === quoteComparisonCopy(locale).open,
    )!;
    expect(source.compareDocumentPosition(all) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    window.history.replaceState(null, "", "/");
  },
);
it("starts collapsed without the comparison fragment", async () => {
  window.history.replaceState(null, "", "/");
  mock.request.mockResolvedValue({ kind: "NOT_RUN" });
  await act(async () =>
    root.render(
      createElement(QuoteComparisonPanel, { locale: "en", projectKey: "JOB", onPrepared: vi.fn() }),
    ),
  );
  expect(host.querySelector("details")?.open).toBe(false);
});
it.each(["en", "zh-TW"] as const)(
  "closed jobs without a comparison have no drafting instructions (%s)",
  async (locale) => {
    mock.request.mockResolvedValue({ kind: "NOT_RUN" });
    await act(async () =>
      root.render(
        createElement(QuoteComparisonPanel, {
          locale,
          projectKey: "JOB",
          closed: true,
          onPrepared: vi.fn(),
        }),
      ),
    );
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      quoteComparisonCopy(locale).closedNotRun,
    );
    expect(host.textContent).not.toContain(quoteComparisonCopy(locale).NOT_RUN);
    expect(host.querySelector("button")).toBeNull();
  },
);
