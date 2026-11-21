import { getValueCopy, stageLabel, warningLabel } from "@/modules/demo-value/copy";
import { workspaceStateCopies } from "@/modules/localization/workspace-state-copy";
import { getFinancialCopy } from "@/modules/localization/financial-copy";
import { projectLocationLabel } from "@/modules/localization/project-context";
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
    demo: "Synthetic demo data for {job}",
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
    demo: "{job}的虛構示範資料",
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
        {getFinancialCopy(locale).observations[observation.observationType]} · {labels.version}{" "}
        {observation.versionNumber} ·{" "}
        {getFinancialCopy(locale).authorities[observation.authorityState]}
      </span>
      <strong>{formatMoney(locale, observation.money.amount, observation.money.currency)}</strong>
      {observation.freshness === "STALE" ? <p className={styles.stale}>{labels.stale}</p> : null}
    </div>
  );
}

export function ProjectWorkspaceOverview({ locale, workspace }: ProjectWorkspaceOverviewProps) {
  const labels = copy[locale];
  const valueCopy = getValueCopy(locale);
  const comparison = getComparisonCopy(locale);
  const actionCopy = getInternalReviewCopy(locale);
  const areaUnit =
    workspace.project.area.unit.toLowerCase() === "m2" ? "m²" : workspace.project.area.unit;
  const comparisonUrl = comparisonHref(locale, workspace.project.businessKey) as Route;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.meta}>
            <p className={styles.eyebrow}>{stageLabel(locale, workspace.project.stage)}</p>
            <span className={styles.status}>
              {workspaceStateCopies[locale].workspace[workspace.state]}
            </span>
          </div>
          <h1>{workspace.project.name.display}</h1>
          <p className={styles.client}>{workspace.project.clientName.display}</p>
          <div className={styles.meta}>
            <span>{projectLocationLabel(locale, workspace.project.location)}</span>
            <span>
              {workspace.project.area.value} {areaUnit}
            </span>
            {workspace.project.programmeWeeks ? (
              <span>
                {workspace.project.programmeWeeks} {locale === "en" ? "weeks" : "週"}
              </span>
            ) : null}
          </div>
        </div>
        {workspace.permissions.canRunComparison ? (
          <Link className={styles.primaryLink} href={comparisonUrl}>
            {valueCopy.compare} →
          </Link>
        ) : (
          <p className={styles.restricted}>{labels.restricted}</p>
        )}
      </header>
      {workspace.project.demoData ? (
        <p>{labels.demo.replace("{job}", workspace.project.name.display)}</p>
      ) : null}
      <section className={styles.panel} id="commercial-position" aria-labelledby="commercial-title">
        <h2 id="commercial-title">{labels.currentCommercial}</h2>
        <div className={styles.commercialSummary}>
          <div>
            <p className={styles.eyebrow}>{labels.quote}</p>
            {formatObservation(locale, workspace.commercial.activeQuote, labels)}
          </div>
          <div>
            <p className={styles.eyebrow}>{labels.forecast}</p>
            {formatObservation(locale, workspace.commercial.activeForecast, labels)}
          </div>
        </div>
        <details>
          <summary>{labels.actual}</summary>
          {formatObservation(locale, workspace.commercial.reconciledActual, labels)}
        </details>
      </section>
      <section
        className={styles.attention}
        id="project-attention"
        aria-labelledby="project-attention-title"
      >
        <h2 id="project-attention-title">{valueCopy.attention}</h2>
        {workspace.warnings.length ? (
          <ul>
            {workspace.warnings.map((warning) => (
              <li key={warning}>{warningLabel(locale, warning)}</li>
            ))}
          </ul>
        ) : (
          <p>{valueCopy.attentionEmpty}</p>
        )}
      </section>
      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{labels.evidence}</h2>
            <span className={styles.status}>
              {workspaceStateCopies[locale].evidence[workspace.evidenceHealth.state]}
            </span>
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
          <Link
            className={styles.questionLink}
            href={
              `/${locale}/stridebrain?project=${encodeURIComponent(workspace.project.businessKey)}` as Route
            }
          >
            <strong>{valueCopy.brainTitle}</strong>
            <span>{valueCopy.brainDescription}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
