import { sha256 } from "./fingerprints";
import type { ChangedComparisonSource, SourceChangeReason } from "../domain/freshness";
import type {
  AuthorizedEvidenceSourceDTO,
  Stage5EconomicsResult,
} from "@/modules/economics/domain/contracts";
import type { EvidenceSourceRecord } from "@/repositories/ports/evidence-panel-repository";

export function savedSources(
  result: Stage5EconomicsResult,
): Map<string, AuthorizedEvidenceSourceDTO> {
  return new Map(
    result.evidenceBundles.flatMap((bundle) =>
      bundle.sources.map((source) => [source.referenceId, source] as const),
    ),
  );
}

function sourceDetails(source: AuthorizedEvidenceSourceDTO | EvidenceSourceRecord) {
  // Economics snapshots store SQL dates as YYYY-MM-DD; source previews use ISO
  // timestamps for the same midnight instant. Compare values, not serialization.
  const dateValue = (value: string | undefined) => {
    if (!value) return null;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : value;
  };
  return {
    subjectType: source.subjectType,
    subjectId: source.subjectId,
    documentVersionId: source.documentVersionId ?? null,
    observationType: source.observationType ?? null,
    locator: source.locator,
    supportedValue: source.supportedValue ?? null,
    effectiveAt: dateValue(source.effectiveAt),
    staleAt: dateValue(source.staleAt),
  };
}

export function changedComparisonSources(
  comparisonRunId: string,
  saved: Stage5EconomicsResult,
  replayed: Stage5EconomicsResult,
  resolvedSources: readonly EvidenceSourceRecord[],
  now: Date,
): readonly ChangedComparisonSource[] {
  const previousSources = savedSources(saved);
  const currentSources = savedSources(replayed);
  const changed: ChangedComparisonSource[] = [];
  for (const source of resolvedSources) {
    const previous = previousSources.get(source.referenceId);
    if (!previous) throw new Error("UNBOUND_CURRENT_EVIDENCE");
    const reasons: SourceChangeReason[] = [];
    if (previous.authorityState !== source.authorityState) reasons.push("AUTHORITY");
    if (sha256(sourceDetails(previous)) !== sha256(sourceDetails(source)))
      reasons.push("SOURCE_DETAILS");
    const current = currentSources.get(source.referenceId);
    if (!current || sha256(previous.conflictIds) !== sha256(current.conflictIds))
      reasons.push("SUPPORT");
    if (
      source.staleAt &&
      new Date(source.staleAt).getTime() > new Date(saved.run.generatedAt).getTime() &&
      new Date(source.staleAt).getTime() <= now.getTime()
    )
      reasons.push("FRESHNESS");
    if (source.supersededByLabel && previous.authorityState !== "SUPERSEDED")
      reasons.push("SUPERSEDED");
    if (source.previewState === "UNAVAILABLE") reasons.push("UNAVAILABLE");
    if (!reasons.length) continue;
    changed.push({
      sourceKey: sha256({
        comparisonRunId,
        referenceId: source.referenceId,
      }).slice(0, 24),
      titleEn: source.titleEn,
      titleZhTw: source.titleZhTw,
      projectNameEn: source.projectNameEn,
      projectNameZhTw: source.projectNameZhTw,
      previousAuthority: previous.authorityState,
      currentAuthority: source.authorityState,
      reasons,
    });
  }
  return changed;
}
