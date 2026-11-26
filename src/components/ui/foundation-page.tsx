import type { ReactNode } from "react";
import { PageHeader } from "./page-header";
import styles from "./ui.module.css";

type FoundationPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  actions?: ReactNode;
};

export function FoundationPage({
  eyebrow,
  title,
  description,
  children,
  actions,
}: FoundationPageProps) {
  return (
    <div className={styles.page}>
      <PageHeader context={eyebrow} title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}
