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
