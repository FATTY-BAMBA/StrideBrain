import type { Route } from "next";
import Link from "next/link";

import { getComparisonCopy } from "@/modules/comparison-experience/copy";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import type {
  CommercialObservationDTO,
  ProjectWorkspaceDTO,
} from "@/modules/projects/domain/project-workspace";
import type { Locale } from "@/modules/localization/config";
import { getInternalReviewCopy } from "@/modules/internal-review-experience/copy";
import { projectActionsHref } from "@/modules/internal-review-experience/route-state";

import styles from "./project-workspace-overview.module.css";

type ProjectWorkspaceOverviewProps = Readonly<{
  locale: Locale;
  workspace: ProjectWorkspaceDTO;
}>;

const copy = {
  en: {
    eyebrow: "PROJECT INTELLIGENCE WORKSPACE",
    projectContext: "Project context",
    currentCommercial: "Current commercial position",
    quote: "Quotation before tax",
    forecast: "Forecast direct cost",
    actual: "Reconciled actual cost",
    evidence: "Evidence health",
    relatedKnowledge: "Related company knowledge",
    suppliers: "Suppliers",
    materials: "Materials",
    scope: "Scope categories",
    questions: "Ask StrideBrain in this project",
    programme: "Programme",
    area: "Area",
    location: "Location",
    manager: "Project lead",
    unavailable: "Unavailable",
    restricted: "Restricted for this role",
    conflicted: "Conflicting records",
    stale: "Historical / stale",
    version: "Version",
    demo: "Synthetic Horizon Atelier demo data",
    compareDescription:
      "Find the strongest historical precedents, understand why they match, and compare the current quotation with evidence-backed history.",
    warnings: "This project has data conditions that require attention.",
  },
  "zh-TW": {
    eyebrow: "專案智慧工作區",
    projectContext: "專案脈絡",
    currentCommercial: "目前商務狀況",
    quote: "未稅報價",
    forecast: "預估直接成本",
    actual: "已核對實際成本",
    evidence: "資料依據狀態",
    relatedKnowledge: "相關公司知識",
    suppliers: "供應商",
    materials: "材料",
    scope: "工作範圍分類",
    questions: "在此專案中詢問 StrideBrain",
    programme: "工期",
    area: "面積",
    location: "地點",
    manager: "專案負責人",
    unavailable: "目前無法使用",
    restricted: "目前角色無權查看",
    conflicted: "資料紀錄不一致",
    stale: "歷史／已過期",
    version: "版本",
    demo: "禾序空間設計虛構示範資料",
    compareDescription: "尋找最接近的歷史專案、理解相似原因，並用可追溯的歷史依據比較目前報價。",
    warnings: "此專案有需要注意的資料狀態。",
  },
} as const;

function localeCode(locale: Locale): string {
  return locale === "zh-TW" ? "zh-TW" : "en-US";
}

function formatMoney(locale: Locale, amount: string, currency: string): string {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return `${currency} ${amount}`;
  return new Intl.NumberFormat(localeCode(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(parsed);
}

function formatObservation(
  locale: Locale,
  observation: CommercialObservationDTO,
  labels: (typeof copy)[Locale],
) {
  if (observation.state === "RESTRICTED") {
    return <p className={styles.restricted}>{labels.restricted}</p>;
  }
  if (observation.state === "UNAVAILABLE") {
    return <p className={styles.unavailable}>{labels.unavailable}</p>;
  }
  if (observation.state === "CONFLICTED") {
    return <p className={styles.conflicted}>{labels.conflicted}</p>;
  }
  return (
    <div className={styles.metric}>
      <span>
        {labels.version} {observation.versionNumber} · {observation.authorityState}
      </span>
      <strong>{formatMoney(locale, observation.money.amount, observation.money.currency)}</strong>
      {observation.freshness === "STALE" ? <p className={styles.stale}>{labels.stale}</p> : null}
    </div>
  );
}

export function ProjectWorkspaceOverview({ locale, workspace }: ProjectWorkspaceOverviewProps) {
  const labels = copy[locale];
  const comparison = getComparisonCopy(locale);
  const actionCopy = getInternalReviewCopy(locale);
  const areaUnit =
    workspace.project.area.unit.toLowerCase() === "m2" ? "m²" : workspace.project.area.unit;
  const comparisonUrl = comparisonHref(locale, workspace.project.businessKey) as Route;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{labels.eyebrow}</p>
          <span className={styles.status}>{workspace.state}</span>
          <h1>{workspace.project.name.display}</h1>
          <p className={styles.client}>{workspace.project.clientName.display}</p>
          <div className={styles.meta}>
            <span>{`${labels.location}: ${workspace.project.location.display}`}</span>
            <span>{`${labels.area}: ${workspace.project.area.value} ${areaUnit}`}</span>
            {workspace.project.programmeWeeks ? (
              <span>{`${labels.programme}: ${workspace.project.programmeWeeks} ${locale === "zh-TW" ? "週" : "weeks"}`}</span>
            ) : null}
            {workspace.project.manager ? (
              <span>{`${labels.manager}: ${workspace.project.manager.display}`}</span>
            ) : null}
          </div>
          {workspace.warnings.length > 0 ? (
            <p className={styles.notice}>{labels.warnings}</p>
          ) : null}
        </div>

        <aside className={styles.intelligenceCard}>
          <p className={styles.eyebrow}>{comparison.eyebrow}</p>
          <strong>{comparison.heroQuestion}</strong>
          <p>{labels.compareDescription}</p>
          {workspace.permissions.canRunComparison ? (
            <Link className={styles.primaryLink} href={comparisonUrl}>
              {comparison.runComparison}
            </Link>
          ) : (
            <p className={styles.restricted}>{labels.restricted}</p>
          )}
          <small>{labels.demo}</small>
        </aside>
      </header>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{labels.currentCommercial}</h2>
          </div>
          <div>
            <p className={styles.eyebrow}>{labels.quote}</p>
            {formatObservation(locale, workspace.commercial.activeQuote, labels)}
          </div>
          <div>
            <p className={styles.eyebrow}>{labels.forecast}</p>
            {formatObservation(locale, workspace.commercial.activeForecast, labels)}
          </div>
          <div>
            <p className={styles.eyebrow}>{labels.actual}</p>
            {formatObservation(locale, workspace.commercial.reconciledActual, labels)}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{labels.evidence}</h2>
            <span className={styles.status}>{workspace.evidenceHealth.state}</span>
          </div>
          <ul className={styles.list}>
            <li>
              <span>{locale === "zh-TW" ? "可存取資料來源" : "Accessible references"}</span>
              <strong>{workspace.evidenceHealth.accessibleReferenceCount ?? "—"}</strong>
            </li>
            <li>
              <span>{locale === "zh-TW" ? "可存取文件" : "Accessible documents"}</span>
              <strong>{workspace.evidenceHealth.accessibleDocumentCount ?? "—"}</strong>
            </li>
            <li>
              <span>{locale === "zh-TW" ? "過期資料" : "Stale records"}</span>
              <strong>{workspace.evidenceHealth.staleCount ?? 0}</strong>
            </li>
            <li>
              <span>{locale === "zh-TW" ? "待處理衝突" : "Open conflicts"}</span>
              <strong>{workspace.evidenceHealth.openConflictCount ?? 0}</strong>
            </li>
          </ul>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{labels.projectContext}</h2>
          </div>
          <ul className={styles.list}>
            <li>
              <span>{labels.scope}</span>
              <strong>{workspace.project.scopeCategories.length}</strong>
            </li>
            <li>
              <span>{labels.suppliers}</span>
              <strong>{workspace.suppliers.length}</strong>
            </li>
            <li>
              <span>{labels.materials}</span>
              <strong>{workspace.materials.length}</strong>
            </li>
            <li>
              <span>{locale === "zh-TW" ? "未完成事項" : "Open actions"}</span>
              <strong>{workspace.openActions.length}</strong>
            </li>
          </ul>
        </article>
      </section>

      {workspace.openActions.length > 0 ? (
        <section className={styles.panel} aria-labelledby="workspace-actions-title">
          <div className={styles.panelHeader}>
            <h2 id="workspace-actions-title">{actionCopy.overviewActions}</h2>
          </div>
          <ul className={styles.list}>
            {workspace.openActions.map((action) => (
              <li key={action.actionKey}>
                <Link
                  href={
                    projectActionsHref(
                      locale,
                      workspace.project.businessKey,
                      action.actionKey,
                    ) as Route
                  }
                >
                  {action.title}
                </Link>
                <span>{action.dueDate ?? actionCopy.noDueDate}</span>
              </li>
            ))}
          </ul>
          <Link
            className={styles.questionLink}
            href={projectActionsHref(locale, workspace.project.businessKey) as Route}
          >
            {actionCopy.openActions}
          </Link>
        </section>
      ) : null}

      <section className={styles.panel} aria-labelledby="project-questions-title">
        <div className={styles.panelHeader}>
          <h2 id="project-questions-title">{labels.questions}</h2>
        </div>
        <div className={styles.questionList}>
          <Link className={styles.questionLink} href={comparisonUrl}>
            <strong>{comparison.heroQuestion}</strong>
            <span>{comparison.heroPrompt}</span>
          </Link>
          {workspace.suggestedQuestions
            .filter((question) =>
              locale === "zh-TW"
                ? question.promptZhTw !== comparison.heroQuestion
                : question.promptEn !== comparison.heroQuestion,
            )
            .slice(0, 3)
            .map((question) => (
              <div className={styles.questionLink} key={question.id}>
                <strong>{locale === "zh-TW" ? question.promptZhTw : question.promptEn}</strong>
                <span>
                  {locale === "zh-TW"
                    ? "此能力將於後續切片啟用"
                    : "This capability belongs to a later slice"}
                </span>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
