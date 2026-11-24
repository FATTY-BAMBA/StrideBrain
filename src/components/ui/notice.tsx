import type { ReactNode } from "react";
import { Icon } from "./icons";
import styles from "./ui.module.css";
export function Notice({
  tone = "information",
  children,
}: {
  tone?: "information" | "warning" | "error";
  children: ReactNode;
}) {
  return (
    <div
      className={`${styles.notice} ${styles[tone === "error" ? "errorNotice" : tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon name={tone === "information" ? "information" : "warning"} decorative />
      <div>{children}</div>
    </div>
  );
}
