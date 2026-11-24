// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { FilterForm } from "@/components/ui/filter-form";
it("renders a native GET form on the server and never prevents submission", async () => {
  const tree = h(FilterForm, {
    loadingLabel: "Loading records…",
    children: h("input", { name: "status", defaultValue: "FINAL" }),
  });
  const html = renderToStaticMarkup(tree);
  expect(html).toContain('method="get"');
  expect(html).toContain('name="status"');
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await act(async () => root.render(tree));
    const event = new Event("submit", { bubbles: true, cancelable: true });
    await act(async () => {
      host.querySelector("form")!.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(host.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
    expect(host.querySelector('[role="status"]')?.textContent).toBe("Loading records…");
    expect(new FormData(host.querySelector("form")!).get("status")).toBe("FINAL");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = false;
  }
});
