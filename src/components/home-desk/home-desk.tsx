import { formatMoney } from "@/modules/finance/format-money";
import Link from "next/link";
import type { Route } from "next";
import type { Locale } from "@/modules/localization/config";
import { homeDeskCopy } from "@/modules/localization/home-desk";
import { findingsCopy } from "@/modules/localization/economics-findings";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import type { HomeDeskOutcome, HomeDesk } from "@/modules/home-desk/application/get-home-desk";
import {
  closedDifferenceText,
  closedLessonText,
  decisionPresentation,
} from "@/modules/home-desk/presentation";
import { HomeChat } from "@/components/assistant/home-chat";
import { StageCounts } from "./stage-counts";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Table, NameCell, NumericCell } from "@/components/ui/table";
import ui from "@/components/ui/ui.module.css";
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
      {items.length ? (
        <Table
          caption={`${copy.needs} · ${copy.decisions}`}
          headings={[
            { label: locale === "zh-TW" ? "專案" : "Job" },
            { label: copy.needs },
            { label: locale === "zh-TW" ? "開啟" : "Open", action: true },
          ]}
        >
          {items.map((item) => {
            const view = decisionPresentation(item, locale, desk.catalog.workCategories);
            return (
              <tr key={item.key}>
                <NameCell>{item.project.name}</NameCell>
                <td>
                  <p>{view.sentence}</p>
                  {view.moreFindings ? <p className={styles.muted}>{view.moreFindings}</p> : null}
                  {item.kind === "ISSUE_QUOTE" && item.comparisonHint ? (
                    <p className={styles.muted}>
                      {item.comparisonHint === "NOT_RUN"
                        ? copy.comparisonNotRun
                        : copy.comparisonOutOfDate}{" "}
                      ·{" "}
                      <Link
                        href={
                          `/${locale}/projects/${encodeURIComponent(item.project.businessKey)}/quote#quote-comparison` as Route
                        }
                      >
                        {copy.openComparison}
                      </Link>
                    </p>
                  ) : null}
                </td>
                <td className={ui.rowAction}>
                  <Link className={ui.rowLink} href={view.href as Route}>
                    {view.label}
                    <span aria-hidden="true"> →</span>
                  </Link>
                </td>
              </tr>
            );
          })}
        </Table>
      ) : null}
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
  canDraftJob = false,
}: {
  locale: Locale;
  outcome: HomeDeskOutcome;
  complete?: boolean;
  requestedProject?: string | undefined;
  canDraftJob?: boolean;
}) {
  const copy = homeDeskCopy(locale);
  if (outcome.kind !== "AVAILABLE")
    return (
      <section className={styles.page}>
        <PageHeader context="StrideBrain" title={complete ? copy.decisions : copy.title} />
        <p role="status">{copy.unavailable}</p>
      </section>
    );
  const desk = outcome;
  if (complete)
    return (
      <section className={styles.page}>
        <PageHeader context="StrideBrain" title={copy.decisions} />
        <Link href={`/${locale}` as Route}>← {copy.back}</Link>
        <DecisionList locale={locale} desk={desk} complete />
      </section>
    );
  return (
    <div className={styles.page}>
      <PageHeader
        context="StrideBrain"
        title={copy.title}
        actions={
          desk.canCreate ? (
            <Link
              className={`${ui.button} ${ui.primary}`}
              href={`/${locale}/projects/new` as Route}
            >
              + {copy.newJob}
            </Link>
          ) : undefined
        }
      />
      {!desk.projects.length ? (
        <>
          <p>{copy.empty}</p>
          {desk.canCreate && canDraftJob ? <HomeChat locale={locale} canDraftJob /> : null}
        </>
      ) : (
        <>
          <section className={styles.section} aria-labelledby="needs-title">
            <SectionHeading id="needs-title">{copy.needs}</SectionHeading>
            <DecisionList locale={locale} desk={desk} />
          </section>
          <section className={styles.section} aria-labelledby="stages-title">
            <SectionHeading id="stages-title">{copy.stages}</SectionHeading>
            <StageCounts locale={locale} counts={desk.stageCounts} />
          </section>
          <HomeChat
            locale={locale}
            canDraftJob={desk.canCreate && canDraftJob}
            projectKey={
              (requestedProject
                ? desk.projects.find((job) => job.businessKey === requestedProject)
                : undefined
              )?.businessKey
            }
          />
          <section className={styles.section} aria-labelledby="learned-title">
            <SectionHeading id="learned-title">{copy.learned}</SectionHeading>
            {desk.closedJobsUnavailable ? (
              <p role="status">{copy.lessonsUnavailable}</p>
            ) : !desk.closedJobs.length ? (
              <p className={styles.muted}>{copy.noLessons}</p>
            ) : null}
            {desk.closedJobs.length ? (
              <Table
                caption={`${copy.learned} · ${locale === "zh-TW" ? "專案紀錄" : "Job records"}`}
                headings={[
                  { label: locale === "zh-TW" ? "專案" : "Job" },
                  ...(desk.closedJobs.some((job) => job.lesson)
                    ? [
                        { label: copy.quote, numeric: true },
                        { label: copy.actual, numeric: true },
                      ]
                    : []),
                  { label: copy.learned },
                ]}
              >
                {desk.closedJobs.map(({ project, lesson, costDifference, financialState }) => (
                  <tr key={project.businessKey}>
                    <NameCell>
                      <Link
                        href={
                          `/${locale}/projects/${encodeURIComponent(project.businessKey)}` as Route
                        }
                      >
                        {project.name}
                      </Link>
                    </NameCell>
                    {desk.closedJobs.some((job) => job.lesson) ? (
                      <>
                        <NumericCell>
                          {lesson ? formatMoney(lesson.quoteBeforeTax, lesson.currency) : "—"}
                        </NumericCell>
                        <NumericCell>
                          {lesson ? formatMoney(lesson.actualCost, lesson.currency) : "—"}
                        </NumericCell>
                      </>
                    ) : null}
                    <td>
                      {lesson ? (
                        <>
                          {costDifference ? (
                            <p
                              className={styles.costDifference}
                              data-direction={costDifference.direction}
                            >
                              {closedDifferenceText(costDifference, lesson.currency, locale)}
                            </p>
                          ) : null}
                          <p>{closedLessonText(lesson, locale, outcome.catalog.workCategories)}</p>
                        </>
                      ) : financialState === "UNAVAILABLE" ? (
                        copy.figuresUnavailable
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
