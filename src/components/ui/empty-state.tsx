import type { ReactNode } from "react";
import { Icon } from "./icons";
import styles from "./ui.module.css";
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className={styles.empty}>
      <Icon name="empty" decorative />
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action}
    </section>
  );
}
