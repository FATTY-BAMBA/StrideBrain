"use client";

import { designSystemCopy } from "@/modules/localization/design-system";

import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { RowList } from "@/components/ui/row-list";
import { Table } from "@/components/ui/table";
import { getValueCopy } from "@/modules/demo-value/copy";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { updateComparisonSelectionAction } from "@/app/[locale]/projects/[projectKey]/compare/actions";
import { StaleComparisonNotice } from "./stale-comparison-notice";
import type { ComparisonFreshness } from "@/modules/comparisons/domain/freshness";
import { EvidencePanel } from "@/components/evidence/evidence-panel";
import {
  InternalReviewController,
  type InternalReviewExperienceProps,
} from "@/components/internal-review/internal-review-controller";
import type {
  ComparableProjectCardView,
  ComparisonExperienceView,
  ComparisonTableCellView,
} from "@/modules/comparison-experience/contracts";
import { getComparisonCopy, type ComparisonCopy } from "@/modules/comparison-experience/copy";
import type {
  EvidencePanelOutcome,
  EvidencePanelSelection,
} from "@/modules/evidence-panel/contracts";
import { EVIDENCE_QUERY_KEYS, evidenceSelectionParams } from "@/modules/evidence-panel/route-state";

import styles from "./comparison-experience.module.css";

type ComparisonExperienceClientProps = Readonly<{
  closed?: boolean;
  view: ComparisonExperienceView;
  freshness?: ComparisonFreshness | undefined;
  evidencePanel?: EvidencePanelOutcome | undefined;
  evidenceSelection?: EvidencePanelSelection | null | undefined;
  evidenceReturnId?: string | undefined;
  internalReview?: InternalReviewExperienceProps | undefined;
}>;

function SelectionSubmit({ disabled, label }: Readonly<{ disabled: boolean; label: string }>) {
  const { pending } = useFormStatus();
  return (
    <button
      className={styles.secondaryButton}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {label}
    </button>
  );
}

function bandClass(band: ComparableProjectCardView["band"]): string {
  if (band === "STRONG") return styles.bandStrong ?? "";
  if (band === "RELEVANT") return styles.bandRelevant ?? "";
  if (band === "PARTIAL") return styles.bandPartial ?? "";
  return styles.bandBroader ?? "";
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

export function ComparisonCell({
  cell,
  copy,
  triggerId,
  onOpenClaim,
}: Readonly<{
  cell: ComparisonTableCellView | undefined;
  copy: ComparisonCopy;
  triggerId: string;
  onOpenClaim: (claimKey: string, triggerId: string) => void;
}>) {
  if (!cell) return <span aria-hidden="true">—</span>;
  const content = (
    <>
      {cell.observationLabel ? (
        <span className={styles.cellSecondary}>{cell.observationLabel}</span>
      ) : null}
      <span className={styles.cellPrimary}>{cell.primary}</span>
      {cell.secondary ? <span className={styles.cellSecondary}>{cell.secondary}</span> : null}
      {cell.state !== "VALUE" ? (
        <span className={styles.statePill} data-state={cell.state}>
          {cellStateLabel(cell, copy)}
        </span>
      ) : null}
    </>
  );
  return (
    <div
      className={styles.cell}
      data-observation-type={cell.observationType}
      data-tone={cell.tone}
      data-claim-key={cell.claimKey}
      data-state={cell.state}
    >
      {cell.claimKey ? (
        <button
          className={styles.evidenceTrigger}
          data-evidence-trigger-id={triggerId}
          type="button"
          onClick={() => onOpenClaim(cell.claimKey!, triggerId)}
          aria-label={`${copy.table.evidenceState}: ${[cell.observationLabel, cell.primary, cell.secondary].filter(Boolean).join(" · ")}`}
        >
          {content}
        </button>
      ) : (
        content
      )}
    </div>
  );
}

function ProjectCard({
  card,
  selected,
  disabled,
  onToggle,
  onOpenFactor,
  copy,
}: Readonly<{
  card: ComparableProjectCardView;
  selected: boolean;
  disabled: boolean;
  onToggle: (projectKey: string) => void;
  onOpenFactor: (
    projectKey: string,
    factorKey: ComparableProjectCardView["strongestFactors"][number]["factorKey"],
    triggerId: string,
  ) => void;
  copy: ComparisonCopy;
}>) {
  const factorGroups = [
    [copy.card.strongest, card.strongestFactors],
    [copy.card.differences, card.differences],
    [copy.card.unknowns, card.unknowns],
  ] as const;

  return (
    <tr className={selected ? styles.projectCardSelected : undefined}>
      <td>
        <label className={styles.cardSelection}>
          <span className="sr-only">{`${copy.selection.title}: ${card.name}`}</span>
          <input
            type="checkbox"
            checked={selected}
            disabled={disabled}
            onChange={() => onToggle(card.projectKey)}
          />
        </label>
      </td>
      <td>
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
      </td>
      <td>
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
      </td>
      <td>
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
                      <button
                        className={styles.factorEvidenceTrigger}
                        data-evidence-trigger-id={`evidence-factor-${card.projectKey}-${factor.factorKey}`}
                        type="button"
                        onClick={() =>
                          onOpenFactor(
                            card.projectKey,
                            factor.factorKey,
                            `evidence-factor-${card.projectKey}-${factor.factorKey}`,
                          )
                        }
                      >
                        <span>{factor.label}</span>
                        <strong>{factor.valueLabel}</strong>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </details>
      </td>
    </tr>
  );
}

function ComparisonResultExperience({
  view,
  freshness,
  evidencePanel,
  evidenceSelection,
  evidenceReturnId,
  internalReview,
  closed = false,
}: ComparisonExperienceClientProps) {
  const router = useRouter();
  const copy = getComparisonCopy(view.locale);
  const valueCopy = getValueCopy(view.locale);
  const [selected, setSelected] = useState<readonly string[]>(view.initialSelectedProjectKeys);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const orderedSelected = useMemo(
    () =>
      view.cards.filter((card) => selectedSet.has(card.projectKey)).map((card) => card.projectKey),
    [selectedSet, view.cards],
  );
  const dirty = orderedSelected.join(",") !== view.initialSelectedProjectKeys.join(",");

  const navigateEvidence = useCallback(
    (selection: EvidencePanelSelection, triggerId?: string, fromReview = false) => {
      const url = new URL(window.location.href);
      url.searchParams.set("run", selection.comparisonRunId);
      const enrichmentRunId =
        "enrichmentRunId" in selection ? selection.enrichmentRunId : view.route.economicsRunId;
      if (enrichmentRunId) url.searchParams.set("economics", enrichmentRunId);
      else url.searchParams.delete("economics");
      url.searchParams.set("selected", view.route.selectedProjectKeys.join(","));
      for (const key of EVIDENCE_QUERY_KEYS) url.searchParams.delete(key);
      for (const [key, value] of Object.entries(evidenceSelectionParams(selection))) {
        url.searchParams.set(key, value);
      }
      const returnId = triggerId ?? evidenceReturnId;
      if (returnId) url.searchParams.set("evidenceReturn", returnId);
      if (fromReview) url.searchParams.set("reviewEvidence", "1");
      router.push(`${url.pathname}?${url.searchParams.toString()}` as Route, { scroll: false });
    },
    [evidenceReturnId, router, view.route.selectedProjectKeys, view.route.economicsRunId],
  );

  const closeEvidence = useCallback(() => {
    const url = new URL(window.location.href);
    const returnId = evidenceReturnId;
    for (const key of EVIDENCE_QUERY_KEYS) url.searchParams.delete(key);
    url.searchParams.delete("reviewEvidence");
    if (returnId) url.searchParams.set("evidenceReturn", returnId);
    router.push(`${url.pathname}?${url.searchParams.toString()}` as Route, { scroll: false });
  }, [evidenceReturnId, router]);

  useEffect(() => {
    if (
      evidencePanel ||
      !evidenceReturnId ||
      internalReview?.route.proposalKey ||
      internalReview?.route.actionKey
    )
      return;
    const target = document.querySelector<HTMLElement>(
      `[data-evidence-trigger-id="${CSS.escape(evidenceReturnId)}"]`,
    );
    target?.focus();
    const url = new URL(window.location.href);
    url.searchParams.delete("evidenceReturn");
    router.replace(`${url.pathname}?${url.searchParams.toString()}` as Route, { scroll: false });
  }, [
    evidencePanel,
    evidenceReturnId,
    internalReview?.route.proposalKey,
    internalReview?.route.actionKey,
    router,
  ]);

  const openClaim = useCallback(
    (claimKey: string, triggerId: string) => {
      if (!view.route.economicsRunId) return;
      navigateEvidence(
        {
          mode: "CLAIM",
          comparisonRunId: view.route.comparisonRunId,
          enrichmentRunId: view.route.economicsRunId,
          claimKey,
        },
        triggerId,
      );
    },
    [navigateEvidence, view.route.comparisonRunId, view.route.economicsRunId],
  );

  const openFactor = useCallback(
    (
      candidateProjectKey: string,
      factorKey: ComparableProjectCardView["strongestFactors"][number]["factorKey"],
      triggerId: string,
    ) => {
      navigateEvidence(
        {
          mode: "FACTOR",
          comparisonRunId: view.route.comparisonRunId,
          candidateProjectKey,
          factorKey,
        },
        triggerId,
      );
    },
    [navigateEvidence, view.route.comparisonRunId],
  );

  const openReviewEvidence = useCallback(
    (claimKey: string, triggerId: string) => {
      if (!view.route.economicsRunId) return;
      navigateEvidence(
        {
          mode: "CLAIM",
          comparisonRunId: view.route.comparisonRunId,
          enrichmentRunId: view.route.economicsRunId,
          claimKey,
        },
        triggerId,
        true,
      );
    },
    [navigateEvidence, view.route.comparisonRunId, view.route.economicsRunId],
  );

  const findings = [
    ...view.synthesis.history,
    ...view.synthesis.differences,
    ...view.synthesis.gaps,
    ...(view.synthesis.recommendation ? [view.synthesis.recommendation] : []),
  ];
  const findingGroups: (typeof findings)[] = [];
  for (const item of findings) {
    const previous = findingGroups.at(-1);
    if (previous?.[0]?.title === item.title) previous.push(item);
    else findingGroups.push([item]);
  }

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
      <PageHeader
        id="comparison-title"
        context={view.activeProject.name}
        title={valueCopy.compare}
        description={view.heading.description}
      />
      {freshness ? (
        <StaleComparisonNotice
          allowRun={!closed}
          catalog={view.catalog}
          freshness={freshness}
          locale={view.locale}
          projectKey={view.route.projectKey}
        />
      ) : null}

      <section className={styles.section} aria-labelledby="closest-projects-title">
        <SectionHeading
          id="closest-projects-title"
          actions={<a href="#comparable-projects-title">{valueCopy.changeSelection} ↓</a>}
        >
          {valueCopy.strongest}
        </SectionHeading>
        <ol className={styles.closestProjects}>
          {view.cards.slice(0, 3).map((card) => (
            <li key={card.projectKey}>
              <span className={styles.rank}>{card.rank}</span>
              <div>
                <strong>{card.name}</strong>
                <span>
                  {card.bandLabel} · {valueCopy.match} {card.scoreLabel}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section
        className={styles.section}
        id="review-findings"
        aria-labelledby="structured-review-title"
      >
        <div className={styles.sectionHeaderText}>
          <SectionHeading id="structured-review-title">{copy.synthesis.title}</SectionHeading>
          <p>{valueCopy.selectedHistory}</p>
          <p className={styles.findingProjects} aria-label={valueCopy.selectedHistory}>
            {view.cards
              .filter((card) => view.route.selectedProjectKeys.includes(card.projectKey))
              .map((card) => card.name)
              .join(view.locale === "zh-TW" ? "、" : ", ")}
          </p>
          <p className={styles.selectionHelp}>{valueCopy.selectedHistoryHelp}</p>
        </div>
        {findingGroups.map((group) => (
          <div key={group[0]!.key}>
            <h3 className={styles.findingGroupTitle}>{group[0]!.title}</h3>
            <RowList>
              {group.map((item) => (
                <li
                  className={styles.findingRow}
                  data-tone={item.tone}
                  data-claim-key={item.claimKey}
                  key={item.key}
                >
                  <p>{item.body}</p>
                  {item.claimKey ? (
                    <Button
                      variant="quiet"
                      data-claim-key={item.claimKey}
                      data-evidence-trigger-id={`evidence-synthesis-${item.key}`}
                      onClick={() => openClaim(item.claimKey!, `evidence-synthesis-${item.key}`)}
                    >
                      {valueCopy.seeEvidence}
                    </Button>
                  ) : null}
                </li>
              ))}
            </RowList>
          </div>
        ))}
      </section>

      {internalReview ? (
        <InternalReviewController
          key={`${internalReview.locale}:${internalReview.route.actionKey ?? internalReview.route.proposalKey ?? internalReview.route.errorKind ?? "entry"}`}
          {...internalReview}
          evidenceActive={!!evidencePanel}
          evidenceReturnId={evidenceReturnId}
          onEvidence={openReviewEvidence}
        />
      ) : null}

      <details className={styles.runDetails}>
        <summary>{valueCopy.details}</summary>
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
          {view.summary.syntheticDataLabel ? (
            <div className={styles.summaryItem}>
              <dt>{copy.summary.demoData}</dt>
              <dd>{view.summary.syntheticDataLabel}</dd>
            </div>
          ) : null}
        </dl>
      </details>
      <section className={styles.section} aria-labelledby="comparable-projects-title">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderText}>
            <p className={styles.eyebrow}>{copy.heroQuestion}</p>
            <SectionHeading id="comparable-projects-title">{copy.selection.title}</SectionHeading>
            <p>{copy.selection.description}</p>
          </div>
          <div className={styles.selectionStatus} aria-live="polite">
            <strong>{orderedSelected.length}</strong>
            <span>{copy.selection.selectedCount}</span>
            <span>·</span>
            <span>{copy.selection.maximum}</span>
          </div>
        </div>

        <Table
          caption={designSystemCopy(view.locale).selectableJobs}
          headings={[
            { label: copy.selection.selectedCount },
            { label: copy.table.title },
            { label: copy.card.score, numeric: true },
            { label: copy.card.inspectFactors },
          ]}
        >
          {view.cards.map((card) => (
            <ProjectCard
              key={card.projectKey}
              card={card}
              selected={selectedSet.has(card.projectKey)}
              disabled={
                closed ||
                (!selectedSet.has(card.projectKey) &&
                  selected.length >= view.maximumSelectedProjects)
              }
              onToggle={toggleProject}
              onOpenFactor={openFactor}
              copy={copy}
            />
          ))}
        </Table>

        {!closed && (
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
                `${copy.selectedProjects}: ${
                  orderedSelected.length > 0
                    ? view.cards
                        .filter((card) => selectedSet.has(card.projectKey))
                        .map((card) => card.name)
                        .join(", ")
                    : "—"
                }`}
            </p>
            <SelectionSubmit
              disabled={!dirty || orderedSelected.length === 0 || selectionError !== null}
              label={copy.selection.apply}
            />
          </form>
        )}
      </section>

      <section className={styles.tablePanel} aria-labelledby="comparison-table-title">
        <div className={styles.sectionHeaderText}>
          <SectionHeading id="comparison-table-title">{copy.table.title}</SectionHeading>
          <p>{copy.table.description}</p>
        </div>

        <div
          className={styles.tableWrap}
          tabIndex={0}
          role="region"
          aria-label={designSystemCopy(view.locale).comparisonValues}
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
                        <ComparisonCell
                          cell={row.cells[column.key]}
                          copy={copy}
                          triggerId={`evidence-cell-${row.key}-${column.key}`}
                          onOpenClaim={openClaim}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <aside className={styles.noticeStack} aria-label={copy.table.evidenceState}>
        {view.notices.map((notice) => (
          <div className={styles.notice} data-tone={notice.tone} key={notice.key}>
            <span>{notice.body}</span>
          </div>
        ))}
      </aside>

      {evidencePanel ? (
        <EvidencePanel
          closed={closed}
          outcome={evidencePanel}
          selection={evidenceSelection}
          locale={view.locale}
          onClose={closeEvidence}
          onNavigate={navigateEvidence}
        />
      ) : null}
    </div>
  );
}

/** A persisted result change resets its editor; same-result navigation retains it. */
export function ComparisonExperienceClient(props: ComparisonExperienceClientProps) {
  const { comparisonRunId, economicsRunId } = props.view.route;
  return (
    <ComparisonResultExperience
      key={`${comparisonRunId}:${economicsRunId ?? "structural"}`}
      {...props}
    />
  );
}
