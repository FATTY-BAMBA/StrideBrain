import { randomUUID } from "node:crypto";
import type { Route } from "next";
import { getCatalog } from "@/modules/localization/catalog";
import { jobsCopy, projectStageLabel } from "@/modules/localization/jobs";
import type { Locale } from "@/modules/localization/config";
import { projectNavigation, projectSurfaceHref } from "@/modules/navigation/project-navigation";
import type { ProjectListOutcome } from "@/modules/projects/application/list-authorized-projects";
import { PROJECT_STAGES } from "@/modules/projects/domain/job-input";
import { ProjectStageForm } from "./project-stage-form";
import { Table, NameCell, RowAction } from "@/components/ui/table";
import { SectionHeading } from "@/components/ui/section-heading";
import ui from "@/components/ui/ui.module.css";
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
            <SectionHeading id={`stage-${stage}`}>
              {projectStageLabel(locale, stage)}{" "}
              <span className={styles.count}>({projects.length})</span>
            </SectionHeading>
            {projects.length ? (
              <Table
                caption={`${projectStageLabel(locale, stage)} · ${copy["nav.projects"]}`}
                headings={[
                  { label: copy["nav.projects"] },
                  { label: locale === "zh-TW" ? "狀態" : "Status" },
                  ...(canUpdate && stage !== "COMPLETE" ? [{ label: jobs.updateStage }] : []),
                  { label: copy["projects.open"], action: true },
                ]}
              >
                {projects.map((project) => (
                  <tr key={project.businessKey}>
                    <NameCell>
                      {project.name}
                      <span className={ui.marker}>{project.businessKey}</span>
                    </NameCell>
                    <td>
                      {project.active ? copy["projects.active"] : projectStageLabel(locale, stage)}
                    </td>
                    {canUpdate && stage !== "COMPLETE" ? (
                      <td>
                        <ProjectStageForm
                          key={`${project.businessKey}:${stage}`}
                          locale={locale}
                          businessKey={project.businessKey}
                          stage={stage}
                          idempotencyKey={randomUUID()}
                        />
                      </td>
                    ) : null}
                    <RowAction
                      href={
                        projectSurfaceHref(
                          locale,
                          project.businessKey,
                          projectNavigation[0]!,
                        ) as Route
                      }
                      label={copy["projects.open"]}
                      name={project.name}
                    />
                  </tr>
                ))}
              </Table>
            ) : (
              <p className={styles.empty}>{jobs.emptyStage}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
