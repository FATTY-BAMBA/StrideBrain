"use client";
import type { ReactNode } from "react";
import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import styles from "./shell.module.css";
export function MobileMenu({ summary, children }: { summary: ReactNode; children?: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [path]);
  return (
    <details
      ref={ref}
      className={styles.mobileMenu}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a[href]") && ref.current)
          ref.current.open = false;
      }}
    >
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
