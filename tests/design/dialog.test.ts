// @vitest-environment jsdom
import { act, createElement, type ComponentProps } from "react";
import { jsx } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { Dialog } from "@/components/ui/dialog";
it.each(["Close", "Escape"])(
  "keeps outside clicks inert and dismisses immediately on %s before route completion",
  async (method) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const host = document.createElement("div");
    const opener = document.createElement("button");
    opener.textContent = "Open";
    document.body.append(opener, host);
    opener.focus();
    const root = createRoot(host),
      close = vi.fn();
    try {
      await act(async () =>
        root.render(
          jsx(Dialog, {
            labelledBy: "title",
            onClose: close,
            children: (dismiss) =>
              createElement(
                "div",
                null,
                createElement("h2", { id: "title", tabIndex: -1 }, "Review"),
                createElement("button", { onClick: dismiss }, "Close"),
              ),
          } satisfies ComponentProps<typeof Dialog>),
        ),
      );
      const dialog = host.querySelector("dialog")!;
      await act(async () =>
        dialog.dispatchEvent(
          new MouseEvent("click", { bubbles: true, clientX: -10, clientY: -10 }),
        ),
      );
      expect(close).not.toHaveBeenCalled();
      expect(dialog.open).toBe(true);

      await act(async () => {
        if (method === "Close") host.querySelector("button")!.click();
        else dialog.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
      });
      expect(close).toHaveBeenCalledTimes(1);
      expect(host.querySelector("dialog")).toBeNull();
      expect(document.body.style.overflow).not.toBe("hidden");
      expect(document.activeElement).toBe(opener);
    } finally {
      await act(async () => root.unmount());
      host.remove();
      opener.remove();
      vi.unstubAllGlobals();
    }
  },
);

it("reopens a previously dismissed source after returning through its parent", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const render = (focusKey: string) =>
    root.render(
      jsx(Dialog, {
        labelledBy: "title",
        focusKey,
        onClose: vi.fn(),
        children: createElement("h2", { id: "title", tabIndex: -1 }, focusKey),
      }),
    );
  try {
    await act(async () => render("source"));
    await act(async () =>
      host
        .querySelector("dialog")!
        .dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })),
    );
    expect(host.querySelector("dialog")).toBeNull();
    await act(async () => render("parent"));
    expect(host.querySelector("dialog")!.open).toBe(true);
    await act(async () => render("source"));
    expect(host.querySelector("dialog")!.open).toBe(true);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
