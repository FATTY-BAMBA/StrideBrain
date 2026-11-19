import type { Route } from "next";
import Link from "next/link";

import { getCatalog } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";
import { projectNavigation, projectSurfaceHref } from "@/modules/navigation/project-navigation";
import type { ProjectListOutcome } from "@/modules/projects/application/list-authorized-projects";

import styles from "./project-list.module.css";

export function ProjectList({ locale, outcome }: { locale: Locale; outcome: ProjectListOutcome }) {
  const copy = getCatalog(locale);
  if (outcome.kind !== "AVAILABLE" || outcome.projects.length === 0) {
    return (
      <section className="empty-state" role="status">
        <div>
          <h2>{copy["projects.unavailableTitle"]}</h2>
          <p>{copy["projects.unavailableDescription"]}</p>
        </div>
      </section>
    );
  }

  return (
    <ul className={styles.list} aria-label={copy["nav.projects"]}>
      {outcome.projects.map((project) => (
        <li key={project.businessKey}>
          <Link
            className={styles.entry}
            href={projectSurfaceHref(locale, project.businessKey, projectNavigation[0]!) as Route}
          >
            <h2>{project.name}</h2>
            {project.active && <span className={styles.status}>{copy["projects.active"]}</span>}
            <span className={styles.open}>
              {copy["projects.open"]} <span aria-hidden="true">→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
