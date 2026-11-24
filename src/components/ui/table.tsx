import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { Icon } from "./icons";
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
export function RowAction({ href, label, name }: { href: Route; label: string; name: string }) {
  return (
    <td className={styles.rowAction}>
      <Link href={href} className={styles.rowLink} aria-label={`${label} · ${name}`}>
        {label}
        <Icon name="open" decorative />
      </Link>
    </td>
  );
}
