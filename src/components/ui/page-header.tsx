import type { ReactNode } from "react";
import styles from "./ui.module.css";
export function PageHeader({
  id,
  context,
  title,
  description,
  actions,
}: {
  id?: string;
  context: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <p className={styles.context}>{context}</p>
        <h1 id={id} tabIndex={id ? -1 : undefined} className={styles.title}>
          {title}
        </h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
