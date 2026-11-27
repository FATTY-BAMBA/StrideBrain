// @vitest-environment jsdom
import { act, createElement, type ComponentProps } from "react";
import { jsx } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { Dialog } from "@/components/ui/dialog";
it("keeps unsaved choices on outside click; Close and Escape request closing", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host),
    close = vi.fn();
  try {
    await act(async () =>
      root.render(
        jsx(Dialog, {
          labelledBy: "title",
          onClose: close,
          children: createElement(
            "div",
            null,
            createElement("h2", { id: "title", tabIndex: -1 }, "Review"),
            createElement("button", { onClick: close }, "Close"),
          ),
        } satisfies ComponentProps<typeof Dialog>),
      ),
    );
    const dialog = host.querySelector("dialog")!;
    await act(async () =>
      dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: -10, clientY: -10 })),
    );
    expect(close).not.toHaveBeenCalled();
    expect(dialog.open).toBe(true);
    await act(async () => host.querySelector("button")!.click());
    expect(close).toHaveBeenCalledTimes(1);
    await act(async () =>
      dialog.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })),
    );
    expect(close).toHaveBeenCalledTimes(2);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
