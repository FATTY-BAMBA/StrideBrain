import type { ReactNode } from "react";
import styles from "./ui.module.css";
export function RowList({ children }: { children: ReactNode }) {
  return <ul className={styles.rowList}>{children}</ul>;
}
export function RecordRow({
  name,
  children,
  action,
}: {
  name: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <li className={styles.recordRow}>
      <div className={styles.rowBody}>
        <strong>{name}</strong>
        {children}
      </div>
      {action ? <div className={styles.recordAction}>{action}</div> : null}
    </li>
  );
}
