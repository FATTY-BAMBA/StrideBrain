import type { SimilarityFactorKey } from "@/modules/comparisons/domain/contracts";
import type { EvidencePanelSelection } from "@/modules/evidence-panel/contracts";

const SAFE_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_-]{0,191}$/;
const SAFE_SOURCE_KEY = /^[a-f0-9]{20,40}$/;
const FACTOR_KEYS = new Set<SimilarityFactorKey>([
  "SUBTYPE",
  "SCOPE_OVERLAP",
  "AREA_SIMILARITY",
  "COMMERCIAL_CATEGORY_OVERLAP",
  "MATERIAL_OVERLAP",
  "SUPPLIER_OVERLAP",
  "COMPLETION_RECENCY",
  "LOCATION_PROXIMITY",
]);

type EvidenceRouteInput = Readonly<{
  comparisonRunId?: string | undefined;
  economicsRunId?: string | undefined;
  evidenceMode?: string | undefined;
  evidenceClaimKey?: string | undefined;
  evidenceCandidateProjectKey?: string | undefined;
  evidenceFactorKey?: string | undefined;
  evidenceSourceKey?: string | undefined;
  evidenceConflictKey?: string | undefined;
}>;

function safe(value: string | undefined): string | undefined {
  return value && SAFE_IDENTIFIER.test(value) ? value : undefined;
}

function factor(value: string | undefined): SimilarityFactorKey | undefined {
  return value && FACTOR_KEYS.has(value as SimilarityFactorKey)
    ? (value as SimilarityFactorKey)
    : undefined;
}

export function parseEvidenceSelection(input: EvidenceRouteInput): EvidencePanelSelection | null {
  const comparisonRunId = safe(input.comparisonRunId);
  if (!comparisonRunId) return null;
  const mode = input.evidenceMode?.toUpperCase();
  if (mode === "CLAIM") {
    const enrichmentRunId = safe(input.economicsRunId);
    const claimKey = safe(input.evidenceClaimKey);
    return enrichmentRunId && claimKey
      ? Object.freeze({ mode: "CLAIM", comparisonRunId, enrichmentRunId, claimKey })
      : null;
  }
  if (mode === "FACTOR") {
    const candidateProjectKey = safe(input.evidenceCandidateProjectKey);
    const factorKey = factor(input.evidenceFactorKey);
    return candidateProjectKey && factorKey
      ? Object.freeze({ mode: "FACTOR", comparisonRunId, candidateProjectKey, factorKey })
      : null;
  }
  if (mode === "SOURCE") {
    const sourceKey = input.evidenceSourceKey;
    if (!sourceKey || !SAFE_SOURCE_KEY.test(sourceKey)) return null;
    const claimKey = safe(input.evidenceClaimKey);
    const candidateProjectKey = safe(input.evidenceCandidateProjectKey);
    const factorKey = factor(input.evidenceFactorKey);
    if (!claimKey && !(candidateProjectKey && factorKey)) return null;
    return Object.freeze({
      mode: "SOURCE",
      comparisonRunId,
      ...(safe(input.economicsRunId) ? { enrichmentRunId: safe(input.economicsRunId) } : {}),
      sourceKey,
      ...(claimKey ? { claimKey } : {}),
      ...(candidateProjectKey ? { candidateProjectKey } : {}),
      ...(factorKey ? { factorKey } : {}),
    });
  }
  if (mode === "CONFLICT") {
    const conflictKey = safe(input.evidenceConflictKey);
    const sourceKey = input.evidenceSourceKey;
    const enrichmentRunId = safe(input.economicsRunId);
    const claimKey = safe(input.evidenceClaimKey);
    const candidateProjectKey = safe(input.evidenceCandidateProjectKey);
    const factorKey = factor(input.evidenceFactorKey);
    if (!conflictKey || !sourceKey || !SAFE_SOURCE_KEY.test(sourceKey)) return null;
    if (!(claimKey && enrichmentRunId) && !(candidateProjectKey && factorKey)) return null;
    return Object.freeze({
      mode: "CONFLICT",
      comparisonRunId,
      ...(enrichmentRunId ? { enrichmentRunId } : {}),
      conflictKey,
      sourceKey,
      ...(claimKey ? { claimKey } : {}),
      ...(candidateProjectKey ? { candidateProjectKey } : {}),
      ...(factorKey ? { factorKey } : {}),
    });
  }
  return null;
}

export function evidenceSelectionParams(
  selection: EvidencePanelSelection,
): Readonly<Record<string, string>> {
  if (selection.mode === "CLAIM") {
    return Object.freeze({ evidenceMode: "claim", evidenceClaim: selection.claimKey });
  }
  if (selection.mode === "FACTOR") {
    return Object.freeze({
      evidenceMode: "factor",
      evidenceCandidate: selection.candidateProjectKey,
      evidenceFactor: selection.factorKey,
    });
  }
  if (selection.mode === "SOURCE") {
    return Object.freeze({
      evidenceMode: "source",
      evidenceSource: selection.sourceKey,
      ...(selection.claimKey ? { evidenceClaim: selection.claimKey } : {}),
      ...(selection.candidateProjectKey
        ? { evidenceCandidate: selection.candidateProjectKey }
        : {}),
      ...(selection.factorKey ? { evidenceFactor: selection.factorKey } : {}),
    });
  }
  return Object.freeze({
    evidenceMode: "conflict",
    evidenceConflict: selection.conflictKey,
    ...(selection.sourceKey ? { evidenceSource: selection.sourceKey } : {}),
    ...(selection.claimKey ? { evidenceClaim: selection.claimKey } : {}),
    ...(selection.candidateProjectKey ? { evidenceCandidate: selection.candidateProjectKey } : {}),
    ...(selection.factorKey ? { evidenceFactor: selection.factorKey } : {}),
  });
}

export const EVIDENCE_QUERY_KEYS = Object.freeze([
  "evidenceMode",
  "evidenceClaim",
  "evidenceCandidate",
  "evidenceFactor",
  "evidenceSource",
  "evidenceConflict",
  "evidenceReturn",
]);
