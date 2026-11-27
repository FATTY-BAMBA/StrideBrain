// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/en" }));
import { MobileMenu } from "@/components/shell/mobile-menu";
it("retains native disclosure but closes after every menu destination", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      createElement(
        MobileMenu,
        {
          summary: "Menu",
        },
        createElement("a", { href: "#projects" }, "Projects"),
      ),
    ),
  );
  const details = container.querySelector("details")!;
  details.open = true;
  act(() => container.querySelector("a")!.click());
  expect(details.open).toBe(false);
  expect(details.querySelector("summary")?.textContent).toBe("Menu");
  act(() => root.unmount());
  container.remove();
});
