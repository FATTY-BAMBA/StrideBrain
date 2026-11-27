"use client";
import { useTransition, type ComponentPropsWithoutRef } from "react";
/** Route-backed dialogs keep their trigger visibly busy through the server round trip. */
export function NavigationButton({
  pendingLabel,
  children,
  onClick,
  disabled,
  ...props
}: ComponentPropsWithoutRef<"button"> & { pendingLabel: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={(event) => start(() => onClick?.(event))}
    >
      {children}
      {pending && <span role="status"> · {pendingLabel}</span>}
    </button>
  );
}
