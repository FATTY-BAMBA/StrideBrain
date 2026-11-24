import type { ComponentPropsWithoutRef } from "react";
import styles from "./ui.module.css";
export function Paper({ className = "", ...props }: ComponentPropsWithoutRef<"article">) {
  return <article {...props} className={`${styles.paper} ${className}`} />;
}
