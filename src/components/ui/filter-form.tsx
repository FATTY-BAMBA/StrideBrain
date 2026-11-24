"use client";
import { useState, type ReactNode } from "react";
import { Notice } from "./notice";
import styles from "./ui.module.css";
/** Native GET navigation remains usable without JS; JS only announces the pending request. */
export function FilterForm({
  children,
  loadingLabel,
}: {
  children: ReactNode;
  loadingLabel: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <div>
      <form
        className={styles.filters}
        method="get"
        aria-busy={pending}
        onSubmit={() => setPending(true)}
      >
        {children}
      </form>
      {pending ? <Notice>{loadingLabel}</Notice> : null}
    </div>
  );
}
