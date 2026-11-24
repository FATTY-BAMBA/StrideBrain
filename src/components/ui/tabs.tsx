import Link from "next/link";
import type { Route } from "next";
import styles from "./ui.module.css";
/** Navigation tabs retain normal link and keyboard behavior. */
export function Tabs({
  label,
  items,
}: {
  label: string;
  items: readonly { href: Route; label: string; active: boolean }[];
}) {
  return (
    <nav className={styles.tabs} aria-label={label}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
