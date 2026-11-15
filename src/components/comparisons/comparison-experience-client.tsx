"use client";

import { useMemo, useState } from "react";

import { updateComparisonSelectionAction } from "@/app/[locale]/projects/[projectKey]/compare/actions";
import type {
  ComparableProjectCardView,
  ComparisonExperienceView,
  ComparisonTableCellView,
} from "@/modules/comparison-experience/contracts";
import { getComparisonCopy, type ComparisonCopy } from "@/modules/comparison-experience/copy";

import styles from "./comparison-experience.module.css";

type ComparisonExperienceClientProps = Readonly<{
  view: ComparisonExperienceView;
}>;

function bandClass(band: ComparableProjectCardView["band"]): string {
  if (band === "STRONG") return styles.bandStrong;
  if (band === "RELEVANT") return styles.bandRelevant;
  if (band === "PARTIAL") return styles.bandPartial;
  return styles.bandBroader;
}

function cellStateLabel(cell: ComparisonTableCellView, copy: ComparisonCopy): string {
  if (cell.state === "INSUFFICIENT") return copy.states.insufficient;
  if (cell.state === "RESTRICTED") return copy.states.restricted;
  if (cell.state === "STALE") return copy.states.stale;
  if (cell.state === "CONFLICTED") return copy.states.conflicted;
  if (cell.state === "NOT_APPLICABLE") return copy.states.notApplicable;
  if (cell.state === "UNAVAILABLE") return copy.states.unavailable;
  return copy.states.sufficient;
}

function ComparisonCell({
  cell,
  copy,
}: Readonly<{ cell: ComparisonTableCellView | undefined; copy: ComparisonCopy }>) {
  if (!cell) return <span aria-hidden="true">—</span>;
  return (
    <div
      className={styles.cell}
      data-tone={cell.tone}
      data-claim-key={cell.claimKey}
      data-state={cell.state}
    >
      <span className={styles.cellPrimary}>{cell.primary}</span>
      {cell.secondary ? <span className={styles.cellSecondary}>{cell.secondary}</span> : null}
      {cell.state !== "VALUE" ? (
        <span className={styles.statePill} data-state={cell.state}>
          {cellStateLabel(cell, copy)}
        </span>
      ) : null}
    </div>
  );
}

function ProjectCard({
  card,
  selected,
  disabled,
  onToggle,
  copy,
}: Readonly<{
  card: ComparableProjectCardView;
  selected: boolean;
  disabled: boolean;
  onToggle: (projectKey: string) => void;
  copy: ComparisonCopy;
}>) {
  const factorGroups = [
    [copy.card.strongest, card.strongestFactors],
    [copy.card.differences, card.differences],
    [copy.card.unknowns, card.unknowns],
  ] as const;

  return (
    <article
      className={`${styles.projectCard} ${selected ? styles.projectCardSelected : ""}`}
      aria-label={`${card.rank}. ${card.name}`}
    >
      <label className={styles.cardSelection}>
        <span className="sr-only">{`${copy.selection.title}: ${card.name}`}</span>
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(card.projectKey)}
        />
      </label>

      <div className={styles.cardTopline}>
        <span className={styles.rank}>{card.rank}</span>
        <span className={`${styles.band} ${bandClass(card.band)}`}>{card.bandLabel}</span>
      </div>

      <div className={styles.cardIdentity}>
        <h3>{card.name}</h3>
        <div className={styles.cardMeta}>
          <span>{card.locationLabel}</span>
          <span>{card.areaLabel}</span>
          <span>{card.completionLabel}</span>
        </div>
      </div>

      <div className={styles.scoreRow}>
        <div className={styles.scoreMetric}>
          <span>{copy.card.score}</span>
          <strong>{card.scoreLabel}</strong>
        </div>
        <div className={styles.scoreMetric}>
          <span>{copy.card.coverage}</span>
          <strong>{card.evidenceCoverageLabel}</strong>
        </div>
      </div>

      <div className={styles.badgeRow}>
        {card.quotedHistoryAvailable ? (
          <span className={styles.dataBadge}>{copy.card.quotedAvailable}</span>
        ) : null}
        {card.actualHistoryAvailable ? (
          <span className={styles.dataBadge}>{copy.card.actualAvailable}</span>
        ) : null}
        {card.warningLabels.map((warning) => (
          <span className={styles.warningBadge} key={warning}>
            {warning}
          </span>
        ))}
      </div>

      <details className={styles.factorDetails}>
        <summary>{copy.card.inspectFactors}</summary>
        {factorGroups.map(([label, factors]) =>
          factors.length > 0 ? (
            <div key={label}>
              <p className={styles.eyebrow}>{label}</p>
              <ul className={styles.factorList}>
                {factors.map((factor) => (
                  <li
                    className={`${styles.factorItem} ${factor.state === "UNKNOWN" ? styles.factorItemUnknown : ""}`}
                    key={`${factor.factorKey}-${factor.valueLabel}`}
                  >
                    <span>{factor.label}</span>
                    <strong>{factor.valueLabel}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </details>
    </article>
  );
}

export function ComparisonExperienceClient({ view }: ComparisonExperienceClientProps) {
  const copy = getComparisonCopy(view.locale);
  const [selected, setSelected] = useState<readonly string[]>(view.initialSelectedProjectKeys);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const orderedSelected = useMemo(
    () => view.cards.filter((card) => selectedSet.has(card.projectKey)).map((card) => card.projectKey),
    [selectedSet, view.cards],
  );
  const dirty = orderedSelected.join(",") !== view.initialSelectedProjectKeys.join(",");

  function toggleProject(projectKey: string) {
    setSelected((current) => {
      if (current.includes(projectKey)) {
        setSelectionError(null);
        return current.filter((key) => key !== projectKey);
      }
      if (current.length >= view.maximumSelectedProjects) {
        setSelectionError(copy.selection.errorMaximum);
        return current;
      }
      setSelectionError(null);
      return [...current, projectKey];
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{view.heading.eyebrow}</p>
          <h1>{view.heading.title}</h1>
          <p className={styles.heroDescription}>{view.heading.description}</p>
        </div>

        <dl className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <dt>{copy.summary.generated}</dt>
            <dd>{view.summary.generatedAtLabel}</dd>
          </div>
          <div className={styles.summaryItem}>
            <dt>{copy.summary.policy}</dt>
            <dd>{view.summary.policyLabel}</dd>
          </div>
          <div className={styles.summaryItem}>
            <dt>{copy.summary.matches}</dt>
            <dd>{view.summary.authorizedMatchCountLabel}</dd>
          </div>
          <div className={styles.summaryItem}>
            <dt>{copy.summary.selected}</dt>
            <dd>{view.summary.selectedCountLabel}</dd>
          </div>
          <div className={styles.summaryItem}>
            <dt>{copy.summary.economics}</dt>
            <dd>{view.summary.economicsStateLabel}</dd>
          </div>
          <div className={styles.summaryItem}>
            <dt>{copy.summary.demoData}</dt>
            <dd>{view.summary.syntheticDataLabel}</dd>
          </div>
        </dl>
      </header>

      <section className={styles.section} aria-labelledby="comparable-projects-title">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderText}>
            <p className={styles.eyebrow}>{copy.heroQuestion}</p>
            <h2 id="comparable-projects-title">{copy.selection.title}</h2>
            <p>{copy.selection.description}</p>
          </div>
          <div className={styles.selectionStatus} aria-live="polite">
            <strong>{orderedSelected.length}</strong>
            <span>{copy.selection.selectedCount}</span>
            <span>·</span>
            <span>{copy.selection.maximum}</span>
          </div>
        </div>

        <div className={styles.cardGrid}>
          {view.cards.map((card) => (
            <ProjectCard
              key={card.projectKey}
              card={card}
              selected={selectedSet.has(card.projectKey)}
              disabled={
                !selectedSet.has(card.projectKey) && selected.length >= view.maximumSelectedProjects
              }
              onToggle={toggleProject}
              copy={copy}
            />
          ))}
        </div>

        <form action={updateComparisonSelectionAction} className={styles.selectionForm}>
          <input type="hidden" name="locale" value={view.locale} />
          <input type="hidden" name="projectKey" value={view.route.projectKey} />
          <input type="hidden" name="comparisonRunId" value={view.route.comparisonRunId} />
          {orderedSelected.map((key) => (
            <input key={key} type="hidden" name="selectedProjectKey" value={key} />
          ))}
          <p
            className={`${styles.selectionFormMessage} ${selectionError ? styles.selectionError : ""}`}
            aria-live="polite"
          >
            {selectionError ??
              `${copy.selectedProjects}: ${orderedSelected.length > 0 ? orderedSelected.join(", ") : "—"}`}
          </p>
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={!dirty || orderedSelected.length === 0 || selectionError !== null}
          >
            {copy.selection.apply}
          </button>
        </form>
      </section>

      <section className={styles.tablePanel} aria-labelledby="comparison-table-title">
        <div className={styles.sectionHeaderText}>
          <p className={styles.eyebrow}>{copy.table.title}</p>
          <h2 id="comparison-table-title">{copy.table.title}</h2>
          <p>{copy.table.description}</p>
        </div>

        <div
          className={styles.tableWrap}
          tabIndex={0}
          role="region"
          aria-label={copy.table.title}
        >
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th className={styles.rowLabel} scope="col">
                  {copy.table.title}
                </th>
                {view.table.columns.map((column) => (
                  <th
                    className={column.kind === "ACTIVE" ? styles.activeColumn : undefined}
                    key={column.key}
                    scope="col"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            {view.table.sections.map((section) => (
              <tbody key={section.key}>
                <tr className={styles.sectionRow}>
                  <th colSpan={view.table.columns.length + 1}>{section.label}</th>
                </tr>
                {section.rows.map((row) => (
                  <tr key={row.key}>
                    <th className={styles.rowLabel} scope="row">
                      {row.label}
                    </th>
                    {view.table.columns.map((column) => (
                      <td
                        className={column.kind === "ACTIVE" ? styles.activeColumn : undefined}
                        key={column.key}
                      >
                        <ComparisonCell cell={row.cells[column.key]} copy={copy} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>

        <div className={styles.mobileComparison} aria-label={copy.table.title}>
          {view.table.columns.map((column) => (
            <article className={styles.mobileColumn} key={column.key}>
              <h3>{column.label}</h3>
              {view.table.sections.map((section) => (
                <section className={styles.mobileSection} key={section.key}>
                  <h4>{section.label}</h4>
                  {section.rows.map((row) => (
                    <div className={styles.mobileRow} key={row.key}>
                      <span>{row.label}</span>
                      <ComparisonCell cell={row.cells[column.key]} copy={copy} />
                    </div>
                  ))}
                </section>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="structured-review-title">
        <div className={styles.sectionHeaderText}>
          <p className={styles.eyebrow}>{copy.synthesis.title}</p>
          <h2 id="structured-review-title">{copy.synthesis.title}</h2>
        </div>
        <div className={styles.synthesisGrid}>
          {[
            ...view.synthesis.history,
            ...view.synthesis.differences,
            ...view.synthesis.gaps,
            view.synthesis.recommendation,
          ].map((item) => (
            <article
              className={styles.synthesisCard}
              data-tone={item.tone}
              data-claim-key={item.claimKey}
              key={item.key}
            >
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className={styles.noticeStack} aria-label={copy.table.evidenceState}>
        {view.notices.map((notice) => (
          <div className={styles.notice} data-tone={notice.tone} key={notice.key}>
            <span>{notice.body}</span>
          </div>
        ))}
      </aside>

      <section className={styles.futureAction}>
        <div>
          <strong>{copy.synthesis.recommendation}</strong>
          <p>{copy.actionComingLater}</p>
        </div>
        <button className={styles.secondaryButton} type="button" disabled>
          {view.locale === "zh-TW" ? "建立內部審查事項" : "Create internal review action"}
        </button>
      </section>
    </div>
  );
}
