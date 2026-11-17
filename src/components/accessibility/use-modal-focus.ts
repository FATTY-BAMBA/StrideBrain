"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/** One mounted modal boundary, including content changes and safe error states. */
export function useModalFocus({
  focusKey,
  onClose,
  resolveInitialFocus,
}: Readonly<{
  focusKey: string;
  onClose: () => void;
  resolveInitialFocus?: ((panel: HTMLElement) => HTMLElement | null) | undefined;
}>) {
  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const target = resolveInitialFocus?.(panel) ?? headingRef.current;
    if (!target) return;
    if (target === headingRef.current) panel.scrollTop = 0;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: "instant", block: "nearest", inline: "nearest" });
  }, [focusKey, resolveInitialFocus]);

  // Match the review modal’s passive lock lifecycle during modal handoffs.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useLayoutEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const panel = panelRef.current;
      if (event.key !== "Tab" || !panel) return;
      const controls = [
        ...panel.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, summary, [tabindex], [contenteditable="true"]',
        ),
      ].filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(":disabled") &&
          !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== "hidden",
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) {
        event.preventDefault();
        headingRef.current?.focus();
        return;
      }
      // A removed control or a programmatic focus escape must not let the next
      // native Tab enter background navigation. The heading is not a tab stop.
      if (!controls.includes(document.activeElement as HTMLElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    function onFocusIn(event: FocusEvent) {
      const panel = panelRef.current;
      if (panel && event.target instanceof Node && !panel.contains(event.target)) {
        headingRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [onClose]);

  return { panelRef, headingRef };
}
