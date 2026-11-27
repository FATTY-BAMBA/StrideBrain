// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { NavigationButton } from "@/components/ui/navigation-button";
it("keeps a visible busy label until navigation finishes", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let finish!: () => void;
  const navigation = new Promise<void>((resolve) => {
    finish = resolve;
  });
  try {
    await act(async () =>
      root.render(
        createElement(
          NavigationButton,
          {
            pendingLabel: "Opening…",
            onClick: async () => {
              await navigation;
            },
          },
          "See evidence",
        ),
      ),
    );
    await act(async () => host.querySelector("button")!.click());
    expect(host.querySelector("button")!.disabled).toBe(true);
    expect(host.querySelector("button")!.getAttribute("aria-busy")).toBe("true");
    expect(host.querySelector('[role="status"]')!.textContent).toContain("Opening…");
    await act(async () => finish());
    expect(host.querySelector("button")!.disabled).toBe(false);
    expect(host.querySelector('[role="status"]')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
