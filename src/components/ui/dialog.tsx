"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ui.module.css";
/** Native modal semantics keep background controls inert and contain keyboard focus. */
export function Dialog({
  children,
  labelledBy,
  describedBy,
  onClose,
  pending = false,
  focusKey,
  resolveInitialFocus,
  resolveReturnFocus,
  className = "",
}: {
  children: ReactNode | ((close: () => void) => ReactNode);
  labelledBy: string;
  describedBy?: string;
  onClose: () => void;
  pending?: boolean;
  focusKey?: string;
  resolveInitialFocus?: (panel: HTMLElement) => HTMLElement | null;
  resolveReturnFocus?: (() => HTMLElement | null) | undefined;
  className?: string | undefined;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const key = focusKey ?? "";
  const [dismissal, setDismissal] = useState({ key, closed: false });
  // A different route selection starts a fresh dialog, including a revisited source.
  if (dismissal.key !== key) setDismissal({ key, closed: false });
  const hidden = dismissal.key === key && dismissal.closed;
  const dismiss = useCallback(() => {
    if (pending) return;
    setDismissal({ key, closed: true });
    onClose();
  }, [key, onClose, pending]);
  const resolve = useRef(resolveInitialFocus);
  const returnFocus = useRef(resolveReturnFocus);
  useEffect(() => {
    resolve.current = resolveInitialFocus;
    returnFocus.current = resolveReturnFocus;
  }, [resolveInitialFocus, resolveReturnFocus]);
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.showModal();
    return () => {
      panel.close();
      document.body.style.overflow = overflow;
      const target = returnFocus.current?.() ?? opener;
      if (target?.isConnected) target.focus();
    };
  }, [hidden]);
  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const heading = panel.querySelector<HTMLElement>("[tabindex='-1']");
    const target =
      resolve.current?.(panel) ?? heading ?? panel.querySelector<HTMLElement>("button, a[href]");
    if (target === heading) panel.scrollTop = 0;
    target?.focus({ preventScroll: true });
    if (target !== heading)
      target?.scrollIntoView?.({ behavior: "instant", block: "nearest", inline: "nearest" });
  }, [focusKey, hidden]);
  useEffect(() => {
    const currentPanel = ref.current;
    if (!currentPanel) return;
    const panel = currentPanel;
    const heading = () => panel.querySelector<HTMLElement>("[tabindex='-1']");
    const controls = () =>
      [
        ...panel.querySelectorAll<HTMLElement>(
          "button, a[href], input, select, textarea, summary, [tabindex]",
        ),
      ].filter(
        (e) =>
          e.tabIndex >= 0 &&
          !e.matches(":disabled") &&
          !e.closest('[hidden], [inert], [aria-hidden="true"]') &&
          e.getClientRects().length > 0 &&
          getComputedStyle(e).visibility !== "hidden",
      );
    function key(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== "Tab") return;
      const items = controls(),
        first = items[0],
        last = items.at(-1);
      if (!first || !last) {
        event.preventDefault();
        heading()?.focus();
        return;
      }
      if (!items.includes(document.activeElement as HTMLElement)) {
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
    function focus(event: FocusEvent) {
      if (event.target instanceof Node && !panel.contains(event.target)) {
        const target = heading();
        target?.focus({ preventScroll: true });
        target?.scrollIntoView?.({ behavior: "instant", block: "nearest", inline: "nearest" });
      }
    }
    document.addEventListener("keydown", key);
    document.addEventListener("focusin", focus);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("focusin", focus);
    };
  }, [dismiss, hidden]);
  if (hidden) return null;
  return (
    <dialog
      ref={ref}
      role="dialog"
      aria-modal="true"
      className={`${styles.dialog} ${className}`}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-busy={pending}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      {typeof children === "function" ? children(dismiss) : children}
    </dialog>
  );
}
