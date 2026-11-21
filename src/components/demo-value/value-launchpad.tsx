import Link from "next/link";
import { HomeChat } from "./home-chat";
import type { Route } from "next";
import type { DemoValueContext } from "@/lib/server/demo-value-context";
import type { Locale } from "@/modules/localization/config";
import { buildHomeIntelligence } from "@/modules/home-intelligence/home-intelligence";
import { stageLabel } from "@/modules/demo-value/copy";
import styles from "./value-launchpad.module.css";

export function ValueLaunchpad({ locale, context }: { locale: Locale; context: DemoValueContext }) {
  const workspace = context.workspace;
  const intelligence = buildHomeIntelligence(locale, context);
  const base = workspace
    ? `/${locale}/projects/${encodeURIComponent(workspace.project.businessKey)}`
    : null;
  const copy =
    locale === "zh-TW"
      ? {
          eyebrow: "找到資料。掌握狀況。做出判斷。採取行動。",
          title: "今天想知道什麼，或先完成什麼？",
          placeholder: "搜尋專案、材料、供應商、文件，或問一個支援的問題…",
          submit: "查找",
          supported: "你可以試著問",
          noMatch: "目前還不能直接回答這個問題。可以先從最接近的支援問題開始：",
          current: "目前專案",
          open: "開啟專案",
          actions: "未完成事項",
          memory: "公司過往經驗",
          memoryHelp: "StrideBrain 會用這些已完成專案來比較目前工作。",
          match: "相似度",
        }
      : {
          eyebrow: "Find. Understand. Decide. Act.",
          title: "What do you want to know or get done?",
          placeholder:
            "Search projects, materials, suppliers or documents, or ask a supported question…",
          submit: "Find",
          supported: "Try asking",
          noMatch: "I can’t answer that directly yet. Start with the closest supported question:",
          current: "Current project",
          open: "Open project",
          actions: "open action",
          memory: "Company memory",
          memoryHelp: "StrideBrain uses these completed projects to compare current work.",
          match: "match",
        };

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
      </header>

      <HomeChat
        key={workspace?.project.businessKey}
        locale={locale}
        projectKey={workspace?.project.businessKey}
      />

      {workspace && base ? (
        <section className={styles.projectCard} aria-labelledby="current-project-title">
          <div className={styles.projectHeader}>
            <div>
              <p className="eyebrow">{copy.current}</p>
              <h2 id="current-project-title">{workspace.project.name.display}</h2>
              <p className={styles.projectMeta}>
                {stageLabel(locale, workspace.project.stage)}
                {workspace.project.programmeWeeks
                  ? ` · ${workspace.project.programmeWeeks} ${locale === "en" ? "weeks" : "週"}`
                  : ""}
              </p>
            </div>
            <Link className={styles.primary} href={base as Route}>
              {copy.open} <span aria-hidden="true">→</span>
            </Link>
          </div>

          {intelligence.findings.length ? (
            <div className={styles.findings}>
              {intelligence.findings.map((finding) => (
                <Link className={styles.finding} href={finding.href as Route} key={finding.id}>
                  <strong>{finding.title}</strong>
                  <span>{finding.detail}</span>
                  <small>{finding.check}</small>
                </Link>
              ))}
            </div>
          ) : (
            <p>
              <Link href={intelligence.comparisonHref as Route}>{intelligence.emptyMessage}</Link>
            </p>
          )}
          {workspace.project.demoData ? (
            <small>
              {locale === "zh-TW"
                ? "此專案使用虛構示範資料。"
                : "This job uses synthetic demo data."}
            </small>
          ) : null}

          {intelligence.openActionCount > 0 ? (
            <Link className={styles.actionLink} href={`${base}/actions` as Route}>
              {intelligence.openActionCount} {copy.actions} <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </section>
      ) : null}

      {intelligence.memory.length ? (
        <section className={styles.memory} aria-labelledby="company-memory-title">
          <div className={styles.memoryHeader}>
            <div>
              <h2 id="company-memory-title">{copy.memory}</h2>
              <p>{copy.memoryHelp}</p>
            </div>
            <Link href={`/${locale}/projects` as Route}>
              {locale === "zh-TW" ? "查看全部專案" : "View all projects"} →
            </Link>
          </div>
          <ul>
            {intelligence.memory.map((project) => (
              <li key={project.name}>
                <span>{project.name}</span>
                {project.score ? (
                  <small>
                    {project.score} {copy.match}
                  </small>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
