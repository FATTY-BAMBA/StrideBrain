// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { FactsList } from "@/components/ui/facts-list";
import { AnswerCards } from "@/components/assistant/answer-cards";
it("groups only adjacent equal labels without changing, sorting or omitting values", () => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    createElement(FactsList, {
      groupAdjacent: true,
      rows: [
        { key: "1", label: "Finding", value: "First." },
        { key: "2", label: "Finding", value: "Second." },
        { key: "3", label: "Other", value: "Third." },
        { key: "4", label: "Finding", value: "Fourth." },
      ],
    }),
  );
  expect([...host.querySelectorAll("dt")].map((n) => n.textContent)).toEqual([
    "Finding",
    "Other",
    "Finding",
  ]);
  expect([...host.querySelectorAll("dd")].map((n) => n.textContent)).toEqual([
    "First.",
    "Second.",
    "Third.",
    "Fourth.",
  ]);
});
it.each(["en", "zh-TW"] as const)(
  "renders the saved answer sentences once under a shared label (%s)",
  (locale) => {
    const host = document.createElement("div"),
      label = locale === "en" ? "Findings" : "比較結果";
    host.innerHTML = renderToStaticMarkup(
      createElement(AnswerCards, {
        presentation: {
          version: 1,
          locale,
          blocks: [
            {
              kind: "CARD",
              key: "job",
              title: "Synthetic job",
              rows: [
                { ref: "a", sourceId: "source", path: "findings.0", label, value: "Sentence A" },
                { ref: "b", sourceId: "source", path: "findings.1", label, value: "Sentence B" },
              ],
              link: { href: `/${locale}/projects/PRJ-XINYI-026/compare`, label: "Open" },
            },
          ],
        },
      }),
    );
    expect([...host.querySelectorAll("dt")].map((n) => n.textContent)).toEqual([label]);
    expect([...host.querySelectorAll("dd")].map((n) => n.textContent)).toEqual([
      "Sentence A",
      "Sentence B",
    ]);
    expect(host.querySelector("a")?.getAttribute("href")).toBe(
      `/${locale}/projects/PRJ-XINYI-026/compare`,
    );
  },
);
