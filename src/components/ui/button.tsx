import type { ComponentPropsWithoutRef } from "react";
import styles from "./ui.module.css";
export type ButtonVariant = "primary" | "secondary" | "outline" | "quiet" | "danger";
export function Button({
  variant = "secondary",
  type = "button",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant }) {
  return (
    <button {...props} type={type} className={`${styles.button} ${styles[variant]} ${className}`} />
  );
}
