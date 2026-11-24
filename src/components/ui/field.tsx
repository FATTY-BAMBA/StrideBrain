import type { ComponentPropsWithoutRef } from "react";
import styles from "./ui.module.css";
type Base = { id: string; label: string; hint?: string; error?: string };
type FieldProps = Base &
  (
    | ({ as?: "input" } & Omit<ComponentPropsWithoutRef<"input">, "id">)
    | ({ as: "select" } & Omit<ComponentPropsWithoutRef<"select">, "id">)
  );
export function Field(props: FieldProps) {
  const { id, label, hint, error, ...controlProps } = props;
  const describedBy =
    [props["aria-describedby"], hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const common = {
    id,
    className: styles.input,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : props["aria-invalid"],
  };
  let control;
  if (controlProps.as === "select") {
    const { as, ...rest } = controlProps;
    void as;
    control = <select {...rest} {...common} />;
  } else {
    const { as, ...rest } = controlProps;
    void as;
    control = <input {...rest} {...common} />;
  }
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {control}
      {hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
