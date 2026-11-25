// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { QuoteItemDescription } from "@/components/price-list/quote-item-description";
import { PriceHistory } from "@/components/price-list/price-history";
import { priceListCopy } from "@/modules/localization/price-list";
import type { Locale } from "@/modules/localization/config";
import type { QuoteDocumentLine } from "@/modules/quote-draft/domain/document-input";
import type { PriceListRow } from "@/repositories/ports/price-list-repository";
const mock = vi.hoisted(() => ({ read: vi.fn(), change: vi.fn() }));
vi.mock("@/modules/price-list/request", () => ({ readQuotePrices: mock.read }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const host = document.createElement("div");
document.body.append(host);
let root = createRoot(host);
afterEach(async () => {
  await act(async () => root.unmount());
  host.replaceChildren();
  root = createRoot(host);
  vi.useRealTimers();
  vi.clearAllMocks();
});
const old: PriceListRow = {
  description: "天花板",
  unit: "坪",
  unitPrice: "3500",
  currency: "TWD",
  issuedOn: "2026-11-26",
  documentNumber: "Q1",
  versionId: "old",
  projectKey: "OLD",
  projectName: "Old job",
  clientName: "Client A",
  timesQuoted: 2,
};
const newest: PriceListRow = {
  ...old,
  unitPrice: "3800",
  issuedOn: "2026-11-27",
  documentNumber: "Q2",
  versionId: "new",
  projectKey: "NEW",
  projectName: "New job",
  clientName: "Client B",
  clientPrice: old,
};
const available = (rows: PriceListRow[]) => ({ kind: "AVAILABLE", rows, hasMore: false });
function Harness({ locale, initial = "" }: { locale: Locale; initial?: string }) {
  const [line, setLine] = useState<Extract<QuoteDocumentLine, { kind: "ITEM" }>>({
    kind: "ITEM",
    description: initial,
    quantity: "6.23",
    unit: "式",
    unitPrice: "1",
    remark: "Keep this remark",
  });
  return createElement(QuoteItemDescription, {
    line,
    projectKey: "TARGET",
    locale,
    label: "Item 1.1",
    disabled: false,
    editable: true,
    onChange: (next) => {
      mock.change(next);
      setLine(next);
    },
  });
}
async function type(text: string) {
  await act(async () => {
    const input = host.querySelector("textarea")!;
    input.focus();
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(260);
  });
}
it.each(["en", "zh-TW"] as const)(
  "offers after two characters, shows both linked prices, and chooses the newest without changing quantity or remark (%s)",
  async (locale) => {
    vi.useFakeTimers();
    mock.read.mockResolvedValue(available([newest]));
    await act(async () => root.render(createElement(Harness, { locale })));
    await type("天");
    expect(mock.read).not.toHaveBeenCalled();
    await type("天花");
    expect(mock.read).toHaveBeenCalledWith(
      locale,
      {
        mode: "SUGGEST",
        search: "天花",
        unit: "",
        page: 1,
        projectKey: "TARGET",
      },
      expect.any(AbortSignal),
    );
    expect(host.textContent).toContain("NT$3,800");
    expect(host.textContent).toContain("NT$3,500");
    expect(host.textContent).toContain(priceListCopy(locale).clientLast);
    expect(host.textContent).toContain("2026-11-26");
    expect(host.querySelector('a[href="/api/quotes/old/pdf"]')).not.toBeNull();
    expect(host.querySelector('a[href="/api/quotes/new/pdf"]')).not.toBeNull();
    await act(async () =>
      host
        .querySelector("textarea")!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })),
    );
    const choose = host.querySelector<HTMLButtonElement>("[data-price-suggestion]")!;
    expect(document.activeElement).toBe(choose);
    await act(async () => choose.click());
    expect(mock.change.mock.calls.at(-1)![0]).toMatchObject({
      description: "天花板",
      unit: "坪",
      unitPrice: "3800",
      quantity: "6.23",
      remark: "Keep this remark",
    });
    expect(host.querySelector("[data-price-suggestion]")).toBeNull();
    expect(document.activeElement).toBe(host.querySelector("textarea"));
  },
);
it("ignores stale responses after typing another item and closes suggestions with Escape", async () => {
  vi.useFakeTimers();
  let first: (value: unknown) => void = () => {};
  mock.read
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          first = resolve;
        }),
    )
    .mockResolvedValueOnce(available([{ ...newest, description: "木作" }]));
  await act(async () => root.render(createElement(Harness, { locale: "zh-TW" })));
  await type("天花");
  const oldSignal = mock.read.mock.calls[0]![2] as AbortSignal;
  await type("木作");
  expect(oldSignal.aborted).toBe(true);
  await act(async () => first(available([newest])));
  expect(host.querySelector("[data-price-suggestion]")?.textContent).toContain("木作");
  await act(async () => {
    host.querySelector<HTMLButtonElement>("[data-price-suggestion]")!.focus();
    host
      .querySelector("[data-price-suggestion]")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
  expect(host.querySelector("[data-price-suggestion]")).toBeNull();
  expect(document.activeElement).toBe(host.querySelector("textarea"));
});
it("history lists sources and Use this price changes only the price", async () => {
  mock.read.mockResolvedValue(available([newest, old]));
  const use = vi.fn();
  await act(async () =>
    root.render(
      createElement(PriceHistory, {
        description: "天花板",
        unit: "坪",
        locale: "zh-TW",
        label: "項目 1.1",
        projectKey: "TARGET",
        onUse: use,
      }),
    ),
  );
  await act(async () => host.querySelector("button")!.click());
  expect(mock.read).toHaveBeenCalledWith(
    "zh-TW",
    {
      mode: "HISTORY",
      search: "天花板",
      unit: "坪",
      page: 1,
      projectKey: "TARGET",
    },
    expect.any(AbortSignal),
  );
  expect(host.querySelector('a[href="/zh-TW/projects/OLD/quote"]')).not.toBeNull();
  const buttons = [...host.querySelectorAll("button")].filter(
    (node) => node.textContent === "使用此單價",
  );
  await act(async () => buttons[1]!.click());
  expect(use).toHaveBeenCalledWith(old);
});
it("renders empty/error states without disabling manual entry", async () => {
  vi.useFakeTimers();
  mock.read.mockResolvedValueOnce(available([])).mockRejectedValueOnce(Error("offline"));
  await act(async () => root.render(createElement(Harness, { locale: "en" })));
  await type("No record");
  expect(host.textContent).toContain(priceListCopy("en").empty);
  await type("Other item");
  expect(host.textContent).toContain(priceListCopy("en").unavailable);
  expect(host.querySelector("textarea")?.disabled).toBe(false);
});

it("focusing a filled description does not read; ArrowDown explicitly opens suggestions", async () => {
  vi.useFakeTimers();
  mock.read.mockResolvedValue(available([newest]));
  await act(async () => root.render(createElement(Harness, { locale: "en", initial: "天花板" })));
  await act(async () => host.querySelector("textarea")!.focus());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(mock.read).not.toHaveBeenCalled();
  expect(host.querySelector("[data-price-suggestion]")).toBeNull();
  await act(async () =>
    host
      .querySelector("textarea")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(260);
  });
  expect(mock.read).toHaveBeenCalledTimes(1);
  expect(host.querySelector("[data-price-suggestion]")).not.toBeNull();
});
it("closing history aborts its outstanding request", async () => {
  mock.read.mockImplementation(() => new Promise(() => {}));
  await act(async () =>
    root.render(
      createElement(PriceHistory, {
        description: "天花板",
        unit: "坪",
        locale: "en",
        label: "Item",
        projectKey: "TARGET",
      }),
    ),
  );
  await act(async () => host.querySelector("button")!.click());
  const signal = mock.read.mock.calls[0]![2] as AbortSignal;
  expect(signal.aborted).toBe(false);
  await act(async () => host.querySelector("button")!.click());
  expect(signal.aborted).toBe(true);
});
