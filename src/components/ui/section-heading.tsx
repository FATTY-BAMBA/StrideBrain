import type { ReactNode } from "react";
import styles from "./ui.module.css";
export function SectionHeading({
  id,
  children,
  actions,
}: {
  id?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.sectionHeading}>
      <h2 id={id}>{children}</h2>
      {actions}
    </div>
  );
}
