// @vitest-environment jsdom
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { QuoteListTable } from "@/components/quotes/quote-list-table";
import { QUOTE_LIST_STATUSES } from "@/modules/quotes/domain/quote-list";
import { quoteListCopy } from "@/modules/localization/quote-list";
import { readFileSync } from "node:fs";
const route = vi.hoisted(() => ({ locale: "zh-TW" }));
vi.mock("next/navigation", () => ({ useParams: () => route }));
import { RecordsState } from "@/components/ui/records-state";
function render(node: Parameters<typeof renderToStaticMarkup>[0]) {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(node);
  return host;
}
it("associates the field label, hint and error with the real input/select", () => {
  for (const as of ["input", "select"] as const) {
    const host = render(
      as === "input"
        ? h(Field, { id: "name", name: "name", label: "Name", hint: "Hint", error: "Required" })
        : h(Field, {
            as: "select",
            id: "name",
            name: "name",
            label: "Name",
            hint: "Hint",
            error: "Required",
            children: h("option", { value: "one" }, "One"),
          }),
    );
    const control = host.querySelector(as)!;
    expect(host.querySelector("label")?.htmlFor).toBe(control.id);
    expect(control.getAttribute("aria-invalid")).toBe("true");
    for (const id of control.getAttribute("aria-describedby")!.split(" "))
      expect(host.querySelector(`#${id}`)).not.toBeNull();
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("Required");
  }
});
it("uses real buttons with explicit action text and a safe default type", () => {
  for (const variant of ["primary", "secondary", "outline", "quiet", "danger"] as const) {
    const button = render(h(Button, { variant, children: "Save" })).querySelector("button")!;
    expect(button.type).toBe("button");
    expect(button.textContent).toBe("Save");
  }
});
it.each(["en", "zh-TW"] as const)(
  "renders all five worded quote badges and omits Viewer amounts in %s",
  (locale) => {
    for (const status of QUOTE_LIST_STATUSES)
      expect(render(h(Badge, { status, locale })).textContent).toBe(quoteListCopy(locale)[status]);
    const rows = QUOTE_LIST_STATUSES.map((status, i) => ({
      status,
      quoteKey: `Q${i}`,
      projectKey: `J${i}`,
      projectName: `Job ${i}`,
      clientName: "Client",
      documentNumber: null,
      date: "2026-11-24",
      currency: "TWD",
      revisionInDraft: i === 0,
    }));
    const host = render(h(QuoteListTable, { rows, locale }));
    expect(host.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(host.querySelectorAll("tbody a")).toHaveLength(5);
    expect(host.querySelectorAll('th[scope="row"]')).toHaveLength(5);
    expect(host.querySelectorAll("[data-status]")).toHaveLength(5);
    expect(host.textContent).not.toContain("NT$");
    expect(host.querySelector('[role="region"]')?.getAttribute("tabindex")).toBe("0");
    expect(render(h(QuoteListTable, { rows: [], locale })).textContent).toBe(
      quoteListCopy(locale).empty,
    );
  },
);
it("keeps notices and route loading/error states readable in both languages", () => {
  expect(
    render(h(Notice, { tone: "error", children: "Failed" })).querySelector('[role="alert"]')
      ?.textContent,
  ).toBe("Failed");
  expect(
    render(h(PageHeader, { context: "Workspace", title: "Quotes" })).querySelector("h1")
      ?.textContent,
  ).toBe("Quotes");
  for (const locale of ["en", "zh-TW"]) {
    route.locale = locale;
    expect(
      render(h(RecordsState, { area: "quotes" })).querySelector('[aria-busy="true"]'),
    ).not.toBeNull();
    const error = render(h(RecordsState, { area: "clients", reset: () => undefined }));
    expect(error.querySelector('[role="alert"]')).not.toBeNull();
    expect(error.querySelector("button")?.textContent).toBe(
      locale === "en" ? "Try again" : "再試一次",
    );
  }
});
it("meets contrast for new-system text, badge words, controls and icons", () => {
  const css = readFileSync("src/styles/tokens.css", "utf8");
  const tokens = Object.fromEntries(
    [...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map((m) => [m[1], m[2]]),
  );
  function luminance(name: string) {
    const hex = tokens[name]!;
    const rgb = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
  }
  function contrast(a: string, b: string) {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  for (const [a, b] of [
    ["ink", "canvas"],
    ["muted", "canvas"],
    ["muted", "surface-subtle"],
    ["accent", "canvas"],
    ["on-accent", "accent"],
    ["neutral-ink", "neutral-soft"],
    ["info-ink", "info-soft"],
    ["warning-ink", "warning-soft"],
    ["accent-strong", "accent-soft"],
    ["on-accent", "ink"],
    ["danger", "danger-soft"],
  ])
    expect(contrast(a!, b!)).toBeGreaterThanOrEqual(4.5);
  for (const surface of ["canvas", "surface-subtle"])
    expect(contrast("line-control", surface)).toBeGreaterThanOrEqual(3);
});
