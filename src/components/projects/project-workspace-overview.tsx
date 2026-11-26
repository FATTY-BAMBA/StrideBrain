import { formatMoney } from "@/modules/finance/format-money";
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

import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Table, NameCell } from "@/components/ui/table";
import { FactsList } from "@/components/ui/facts-list";
import ui from "@/components/ui/ui.module.css";
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
      <strong>{formatMoney(observation.money.amount, observation.money.currency)}</strong>
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
      <PageHeader
        context={`${workspace.project.subtypeName} · ${stageLabel(locale, workspace.project.stage)} · ${workspaceStateCopies[locale].workspace[workspace.state]}`}
        title={workspace.project.name.display}
        description={workspace.project.clientName.display}
        actions={
          workspace.permissions.canRunComparison ? (
            <Link className={`${ui.button} ${ui.primary}`} href={comparisonUrl}>
              {valueCopy.compare} →
            </Link>
          ) : (
            <p className={styles.restricted}>{labels.restricted}</p>
          )
        }
      />
      <FactsList
        rows={[
          {
            key: "location",
            label: labels.location,
            value: projectLocationLabel(locale, workspace.project.location),
          },
          {
            key: "area",
            label: labels.area,
            value: `${workspace.project.area.displayValue ?? workspace.project.area.value} ${workspace.project.area.displayUnit ?? areaUnit}`,
            numeric: true,
          },
          ...(workspace.project.programmeWeeks
            ? [
                {
                  key: "programme",
                  label: labels.programme,
                  value: `${workspace.project.programmeWeeks} ${locale === "en" ? "weeks" : "週"}`,
                  numeric: true,
                },
              ]
            : []),
        ]}
      />
      {workspace.project.demoData ? (
        <p>{labels.demo.replace("{job}", workspace.project.name.display)}</p>
      ) : null}
      <section className={styles.panel} id="commercial-position" aria-labelledby="commercial-title">
        <SectionHeading id="commercial-title">{labels.currentCommercial}</SectionHeading>
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
        <SectionHeading id="project-attention-title">{valueCopy.attention}</SectionHeading>
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
            <SectionHeading>{labels.evidence}</SectionHeading>
            <span className={styles.status}>
              {workspaceStateCopies[locale].evidence[workspace.evidenceHealth.state]}
            </span>
          </div>
          <FactsList
            rows={[
              {
                key: "fact-0",
                label: locale === "zh-TW" ? "可存取資料來源" : "Accessible references",
                value: <>{workspace.evidenceHealth.accessibleReferenceCount ?? "—"}</>,
                numeric: true,
              },
              {
                key: "fact-1",
                label: locale === "zh-TW" ? "可存取文件" : "Accessible documents",
                value: <>{workspace.evidenceHealth.accessibleDocumentCount ?? "—"}</>,
                numeric: true,
              },
              {
                key: "fact-2",
                label: locale === "zh-TW" ? "過期資料" : "Stale records",
                value: <>{workspace.evidenceHealth.staleCount ?? 0}</>,
                numeric: true,
              },
              {
                key: "fact-3",
                label: locale === "zh-TW" ? "待處理衝突" : "Open conflicts",
                value: <>{workspace.evidenceHealth.openConflictCount ?? 0}</>,
                numeric: true,
              },
            ]}
          />
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <SectionHeading>{labels.projectContext}</SectionHeading>
          </div>
          <FactsList
            rows={[
              {
                key: "fact-0",
                label: labels.scope,
                value: (
                  <>
                    {workspace.project.scopeCategories
                      .map((category) => category.name.display)
                      .join(locale === "zh-TW" ? "、" : ", ")}
                  </>
                ),
                numeric: false,
              },
              {
                key: "fact-1",
                label: labels.suppliers,
                value: <>{workspace.suppliers.length}</>,
                numeric: true,
              },
              {
                key: "fact-2",
                label: labels.materials,
                value: <>{workspace.materials.length}</>,
                numeric: true,
              },
              {
                key: "fact-3",
                label: locale === "zh-TW" ? "未完成事項" : "Open actions",
                value: <>{workspace.openActions.length}</>,
                numeric: true,
              },
            ]}
          />
        </article>
      </section>

      {workspace.openActions.length > 0 ? (
        <section className={styles.panel} aria-labelledby="workspace-actions-title">
          <div className={styles.panelHeader}>
            <SectionHeading id="workspace-actions-title">
              {actionCopy.overviewActions}
            </SectionHeading>
          </div>
          <Table
            caption={actionCopy.overviewActions}
            headings={[{ label: actionCopy.actionsTitle }, { label: actionCopy.dueDate }]}
          >
            {workspace.openActions.map((action) => (
              <tr key={action.actionKey}>
                <NameCell>
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
                </NameCell>
                <td>{action.dueDate ?? actionCopy.noDueDate}</td>
              </tr>
            ))}
          </Table>
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
          <SectionHeading id="project-questions-title">{labels.questions}</SectionHeading>
        </div>
        <div className={styles.questionList}>
          <Link className={styles.questionLink} href={comparisonUrl}>
            <strong>{comparison.heroQuestion}</strong>
            <span>{comparison.heroPrompt}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
