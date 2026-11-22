import { formatMoney } from "@/modules/finance/format-money";
import Link from "next/link";
import type { Route } from "next";
import type { Locale } from "@/modules/localization/config";
import { homeDeskCopy } from "@/modules/localization/home-desk";
import { findingsCopy } from "@/modules/localization/economics-findings";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import type { HomeDeskOutcome, HomeDesk } from "@/modules/home-desk/application/get-home-desk";
import { closedLessonText, decisionPresentation } from "@/modules/home-desk/presentation";
import { HomeChat } from "@/components/demo-value/home-chat";
import { StageCounts } from "./stage-counts";
import styles from "./home-desk.module.css";

export function DecisionList({
  locale,
  desk,
  complete = false,
}: {
  locale: Locale;
  desk: HomeDesk;
  complete?: boolean;
}) {
  const copy = homeDeskCopy(locale);
  const items = complete ? desk.decisions : desk.decisions.slice(0, 5);
  return (
    <>
      {desk.decisionsUnavailable ? <p role="status">{copy.partial}</p> : null}
      {!items.length && !desk.decisionsUnavailable && !desk.findingsNotices.length ? (
        <p className={styles.muted}>{copy.noDecisions}</p>
      ) : null}
      <ul className={styles.decisions}>
        {items.map((item) => {
          const view = decisionPresentation(item, locale);
          return (
            <li key={item.key}>
              <div>
                <strong>{item.project.name}</strong>
                <p>{view.sentence}</p>
                {view.moreFindings ? <p className={styles.muted}>{view.moreFindings}</p> : null}
              </div>
              <Link className={styles.secondary} href={view.href as Route}>
                {view.label}
                <span aria-hidden="true"> →</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {!complete && desk.decisions.length > 5 ? (
        <Link className={styles.more} href={`/${locale}/decisions` as Route}>
          {copy.all.replace("{count}", String(desk.decisions.length))} →
        </Link>
      ) : null}
      {desk.findingsNotices.map((notice) => (
        <p className={styles.notice} key={notice.project.businessKey}>
          <strong>{notice.project.name}</strong>
          <Link href={comparisonHref(locale, notice.project.businessKey) as Route}>
            {findingsCopy(locale)[notice.kind === "OUT_OF_DATE" ? "outOfDate" : "unavailable"]}
          </Link>
        </p>
      ))}
    </>
  );
}

export function HomeDeskScreen({
  locale,
  outcome,
  complete = false,
  requestedProject,
}: {
  locale: Locale;
  outcome: HomeDeskOutcome;
  complete?: boolean;
  requestedProject?: string | undefined;
}) {
  const copy = homeDeskCopy(locale);
  if (outcome.kind !== "AVAILABLE")
    return (
      <section className={styles.page}>
        <h1>{complete ? copy.decisions : copy.title}</h1>
        <p role="status">{copy.unavailable}</p>
      </section>
    );
  const desk = outcome;
  if (complete)
    return (
      <section className={styles.page}>
        <Link href={`/${locale}` as Route}>← {copy.back}</Link>
        <h1>{copy.decisions}</h1>
        <DecisionList locale={locale} desk={desk} complete />
      </section>
    );
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <h1>{copy.title}</h1>
        {desk.canCreate ? (
          <section className={styles.start} aria-label={copy.start}>
            <Link className={styles.primary} href={`/${locale}/projects/new` as Route}>
              + {copy.newJob}
            </Link>
          </section>
        ) : null}
      </header>
      {!desk.projects.length ? (
        <p>{copy.empty}</p>
      ) : (
        <>
          <section className={styles.section} aria-labelledby="needs-title">
            <h2 id="needs-title">{copy.needs}</h2>
            <DecisionList locale={locale} desk={desk} />
          </section>
          <section className={styles.section} aria-labelledby="stages-title">
            <h2 id="stages-title">{copy.stages}</h2>
            <StageCounts locale={locale} counts={desk.stageCounts} />
          </section>
          <HomeChat
            locale={locale}
            projectKey={
              (requestedProject
                ? desk.projects.find((job) => job.businessKey === requestedProject)
                : (desk.projects.find((job) => job.active) ?? desk.projects[0])
              )?.businessKey
            }
          />
          <section className={styles.section} aria-labelledby="learned-title">
            <h2 id="learned-title">{copy.learned}</h2>
            {desk.closedJobsUnavailable ? (
              <p role="status">{copy.lessonsUnavailable}</p>
            ) : !desk.closedJobs.length ? (
              <p className={styles.muted}>{copy.noLessons}</p>
            ) : null}
            <div className={styles.lessons}>
              {desk.closedJobs.map(({ project, lesson, financialState }) => (
                <article key={project.businessKey}>
                  <h3>
                    <Link
                      href={
                        `/${locale}/projects/${encodeURIComponent(project.businessKey)}` as Route
                      }
                    >
                      {project.name}
                    </Link>
                  </h3>
                  {lesson ? (
                    <>
                      <dl>
                        <div>
                          <dt>{copy.quote}</dt>
                          <dd>{formatMoney(lesson.quoteBeforeTax, lesson.currency)}</dd>
                        </div>
                        <div>
                          <dt>{copy.actual}</dt>
                          <dd>{formatMoney(lesson.actualCost, lesson.currency)}</dd>
                        </div>
                      </dl>
                      <p>{closedLessonText(lesson, locale)}</p>
                    </>
                  ) : financialState === "UNAVAILABLE" ? (
                    <p>{copy.figuresUnavailable}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
