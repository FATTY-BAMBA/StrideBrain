import Link from "next/link";
import type { Route } from "next";
import type { DemoValueContext } from "@/lib/server/demo-value-context";
import type { Locale } from "@/modules/localization/config";
import { getValueCopy, stageLabel, warningLabel } from "@/modules/demo-value/copy";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import styles from "./value-launchpad.module.css";

export function PlannedAssistance({ locale }: { locale: Locale }) {
  const copy = getValueCopy(locale);
  return (
    <section className={styles.planned} aria-labelledby="planned-title">
      <div>
        <h2 id="planned-title">{copy.plannedTitle}</h2>
        <p>{copy.plannedDescription}</p>
      </div>
      <ul>
        {copy.plannedItems.map((item) => (
          <li key={item}>
            <span>{item}</span>
            <small>{copy.planned}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ValueLaunchpad({
  locale,
  surface,
  context,
}: {
  locale: Locale;
  surface: "home" | "knowledge" | "stridebrain";
  context: DemoValueContext;
}) {
  const copy = getValueCopy(locale);
  const workspace = context.workspace;
  const base = workspace
    ? `/${locale}/projects/${encodeURIComponent(workspace.project.businessKey)}`
    : null;
  const compare = workspace?.permissions.canRunComparison
    ? comparisonHref(locale, workspace.project.businessKey)
    : null;
  const tasks =
    surface === "home"
      ? [
          {
            title: copy.compare,
            description: copy.compareDescription,
            href: compare,
            action: copy.compareFirst,
          },
          {
            title: copy.quote,
            description: copy.quoteDescription,
            href: base ? `${base}#commercial-position` : null,
            action: copy.quoteContext,
          },
          {
            title: copy.evidence,
            description: copy.evidenceDescription,
            href: compare,
            action: copy.compareFirst,
          },
          {
            title: copy.knowledge,
            description: copy.knowledgeTaskDescription,
            href: `/${locale}/knowledge${workspace ? `?project=${encodeURIComponent(workspace.project.businessKey)}` : ""}`,
            action: copy.knowledge,
          },
        ]
      : [
          {
            title: surface === "knowledge" ? copy.similar : copy.compare,
            description: copy.compareDescription,
            href: compare,
            action: copy.compareFirst,
          },
          {
            title: surface === "knowledge" ? copy.current : copy.quote,
            description: copy.quoteDescription,
            href: base ? `${base}#commercial-position` : null,
            action: copy.quoteContext,
          },
          {
            title: surface === "knowledge" ? copy.records : copy.next,
            description: copy.recordsDescription,
            href: base ? `${base}#project-attention` : null,
            action: copy.attention,
          },
          ...(surface === "stridebrain"
            ? [
                {
                  title: copy.actions,
                  description: copy.actionsDescription,
                  href: base ? `${base}/actions` : null,
                  action: copy.openActions,
                },
              ]
            : []),
        ];
  return (
    <div className={styles.page} data-surface={surface}>
      <header className={styles.heading}>
        {surface === "home" ? <p className="eyebrow">{copy.framing}</p> : null}
        <h1>
          {surface === "home"
            ? copy.homeTitle
            : surface === "knowledge"
              ? copy.knowledgeTitle
              : copy.brainTitle}
        </h1>
        <p>
          {surface === "home"
            ? copy.homeDescription
            : surface === "knowledge"
              ? copy.knowledgeDescription
              : copy.brainDescription}
        </p>
      </header>
      {workspace && base ? (
        <section className={styles.current} aria-labelledby="current-project-title">
          <div>
            <p className="eyebrow">{surface === "home" ? copy.continue : copy.context}</p>
            <h2 id="current-project-title">{workspace.project.name.display}</h2>
            <p>
              {stageLabel(locale, workspace.project.stage)}
              {workspace.project.programmeWeeks
                ? ` · ${workspace.project.programmeWeeks} ${locale === "en" ? "weeks" : "週"}`
                : ""}
            </p>
          </div>
          <Link className={styles.primary} href={base as Route}>
            {copy.openProject} <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <section className={styles.empty}>
          <h2>{copy.noProject}</h2>
          <p>{copy.noAccess}</p>
          <Link href={`/${locale}/projects`}>{copy.chooseProject} →</Link>
        </section>
      )}
      {context.projects.length > 1 ? (
        <nav className={styles.projectChoices} aria-label={copy.chooseProject}>
          {context.projects.map((project) => (
            <Link
              key={project.businessKey}
              aria-current={
                project.businessKey === workspace?.project.businessKey ? "page" : undefined
              }
              href={
                `/${locale}${surface === "home" ? "" : `/${surface}`}?project=${encodeURIComponent(project.businessKey)}` as Route
              }
            >
              {project.name}
            </Link>
          ))}
        </nav>
      ) : null}
      <section aria-labelledby="tasks-title">
        <div className={styles.sectionHeading}>
          <h2 id="tasks-title">{surface === "knowledge" ? copy.knowledgeTasks : copy.tasks}</h2>
          {surface !== "home" ? <p>{copy.bounded}</p> : null}
        </div>
        <div className={styles.taskGrid}>
          {tasks.map((task, index) => {
            const content = (
              <>
                <span className={styles.taskIndex} aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <span className={styles.taskAction}>
                  {task.href ? task.action : workspace ? copy.restricted : copy.chooseProject}
                  {task.href ? " →" : ""}
                </span>
              </>
            );
            return task.href ? (
              <Link className={styles.task} key={task.title} href={task.href as Route}>
                {content}
              </Link>
            ) : (
              <article className={styles.task} key={task.title} data-unavailable>
                {content}
              </article>
            );
          })}
        </div>
      </section>
      {surface === "home" && workspace ? (
        <section className={styles.attention} aria-labelledby="attention-title">
          <h2 id="attention-title">{copy.attention}</h2>
          {workspace.warnings.length ? (
            <ul>
              {workspace.warnings.map((warning) => (
                <li key={warning}>{warningLabel(locale, warning)}</li>
              ))}
            </ul>
          ) : (
            <p>{copy.attentionEmpty}</p>
          )}
          <Link href={`${base}#project-attention` as Route}>{copy.openProject} →</Link>
        </section>
      ) : null}
      {surface !== "knowledge" ? <PlannedAssistance locale={locale} /> : null}
    </div>
  );
}
