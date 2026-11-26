import type { ReactNode } from "react";
import styles from "./ui.module.css";
export type Fact = { key: string; label: string; value: ReactNode; numeric?: boolean };
export function FactsList({
  rows,
  groupAdjacent = false,
}: {
  rows: readonly Fact[];
  groupAdjacent?: boolean;
}) {
  const groups: Fact[][] = [];
  for (const row of rows) {
    const last = groups.at(-1);
    if (groupAdjacent && last?.[0]?.label === row.label) last.push(row);
    else groups.push([row]);
  }
  return (
    <dl className={styles.facts}>
      {groups.map((group) => (
        <div className={group.length > 1 ? styles.factGroup : styles.fact} key={group[0]!.key}>
          <dt>{group[0]!.label}</dt>
          {group.map((row) => (
            <dd key={row.key} className={row.numeric ? styles.numeric : undefined}>
              {row.value}
            </dd>
          ))}
        </div>
      ))}
    </dl>
  );
}
