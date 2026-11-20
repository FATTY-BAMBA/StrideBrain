import { randomUUID } from "node:crypto";
import type { Route } from "next";
import Link from "next/link";
import { getCatalog } from "@/modules/localization/catalog";
import { jobsCopy, projectStageLabel } from "@/modules/localization/jobs";
import type { Locale } from "@/modules/localization/config";
import { projectNavigation, projectSurfaceHref } from "@/modules/navigation/project-navigation";
import type { ProjectListOutcome } from "@/modules/projects/application/list-authorized-projects";
import { PROJECT_STAGES } from "@/modules/projects/domain/job-input";
import { ProjectStageForm } from "./project-stage-form";
import styles from "./project-list.module.css";

export function ProjectList({
  locale,
  outcome,
  canUpdate = false,
}: {
  locale: Locale;
  outcome: ProjectListOutcome;
  canUpdate?: boolean;
}) {
  const copy = getCatalog(locale);
  const jobs = jobsCopy(locale);
  if (outcome.kind !== "AVAILABLE")
    return (
      <section className="empty-state" role="status">
        <div>
          <h2>{copy["projects.unavailableTitle"]}</h2>
          <p>{copy["projects.unavailableDescription"]}</p>
        </div>
      </section>
    );
  return (
    <div className={styles.groups}>
      {canUpdate ? <p>{jobs.stageHelp}</p> : null}
      {PROJECT_STAGES.map((stage) => {
        const projects = outcome.projects.filter((project) => project.stage === stage);
        return (
          <section key={stage} aria-labelledby={`stage-${stage}`} className={styles.group}>
            <h2 id={`stage-${stage}`}>
              {projectStageLabel(locale, stage)}{" "}
              <span className={styles.count}>({projects.length})</span>
            </h2>
            {projects.length ? (
              <ul className={styles.list} aria-labelledby={`stage-${stage}`}>
                {projects.map((project) => (
                  <li key={project.businessKey}>
                    <Link
                      className={styles.entry}
                      href={
                        projectSurfaceHref(
                          locale,
                          project.businessKey,
                          projectNavigation[0]!,
                        ) as Route
                      }
                    >
                      <h3>{project.name}</h3>
                      <span>{project.businessKey}</span>
                      {project.active ? (
                        <span className={styles.status}>{copy["projects.active"]}</span>
                      ) : null}
                      <span className={styles.open}>
                        {copy["projects.open"]} <span aria-hidden="true">→</span>
                      </span>
                    </Link>
                    {canUpdate ? (
                      <ProjectStageForm
                        key={`${project.businessKey}:${stage}`}
                        locale={locale}
                        businessKey={project.businessKey}
                        stage={stage}
                        idempotencyKey={randomUUID()}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>{jobs.emptyStage}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
