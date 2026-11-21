import Link from "next/link";
import type { Route } from "next";
import { stageGroups, type StageGroupKey } from "@/modules/projects/domain/stage-groups";
import type { Locale } from "@/modules/localization/config";
import type { HomeDesk } from "@/modules/home-desk/application/get-home-desk";
import styles from "./home-desk.module.css";

export function StageCounts({
  locale,
  counts,
  active,
}: {
  locale: Locale;
  counts: HomeDesk["stageCounts"];
  active?: StageGroupKey | undefined;
}) {
  return (
    <nav className={styles.stages} aria-label={locale === "zh-TW" ? "專案階段" : "Job stages"}>
      {stageGroups.map((group) => (
        <Link
          key={group.key}
          href={`/${locale}/projects?group=${group.key}` as Route}
          aria-current={active === group.key ? "page" : undefined}
        >
          <span>{group[locale]}</span>
          <strong>{counts.find((item) => item.key === group.key)?.count ?? 0}</strong>
        </Link>
      ))}
    </nav>
  );
}
