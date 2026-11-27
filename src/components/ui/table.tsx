import type { ReactNode } from "react";
import styles from "./ui.module.css";
export function Table({
  caption,
  headings,
  children,
}: {
  caption: string;
  headings: readonly { label: string; numeric?: boolean; action?: boolean }[];
  children: ReactNode;
}) {
  return (
    <div className={styles.scroll} role="region" aria-label={caption} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>{caption}</caption>
        <thead>
          <tr>
            {headings.map(({ label, numeric, action }) => (
              <th
                key={label}
                scope="col"
                className={numeric ? styles.numeric : action ? styles.rowAction : undefined}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function NameCell({ children }: { children: ReactNode }) {
  return <th scope="row">{children}</th>;
}
export function NumericCell({ children }: { children: ReactNode }) {
  return <td className={styles.numeric}>{children}</td>;
}
