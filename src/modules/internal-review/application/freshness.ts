import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { permissionFingerprint, sha256 } from "@/modules/comparisons/application/fingerprints";
import {
  changedComparisonSources,
  savedSources,
} from "@/modules/comparisons/application/comparison-source-changes";
import { RunComparableProjectAnalysis } from "@/modules/comparisons/application/run-comparable-project-analysis";
import type { PersistCompleteComparisonInput } from "@/modules/comparisons/domain/contracts";
import { RunHistoricalEconomicsEnrichment } from "@/modules/economics/application/run-historical-economics-enrichment";
import type { PersistStage5EconomicsInput } from "@/modules/economics/domain/contracts";
import type { MaterialFingerprints } from "@/modules/internal-review/domain/contracts";
import { calendarDate, mandatoryClaims } from "@/modules/internal-review/domain/proposal-policy";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  EvidenceScope,
  InternalReviewTransaction,
  ReviewProject,
  StoredRunState,
} from "@/repositories/ports/internal-review-repository";
import {
  hasOrganizationWidePrivateHistory,
  organizationComparisonLibraryClassifications,
} from "@/repositories/ports/comparable-project-repository";
import type { EvidenceSourceRecord } from "@/repositories/ports/evidence-panel-repository";

const authorization = new AuthorizationService();
const library = new Set<string>(organizationComparisonLibraryClassifications());
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function actionAccess(context: RuntimeContext, projectId: string): boolean {
  return (
    context.role !== "VIEWER" &&
    authorization.canCreateInternalReview(context, projectId).allowed &&
    authorization.canRunComparison(context, projectId).allowed &&
    authorization.canReadEvidence(context, projectId).allowed &&
    authorization.canReadCommercial(context, projectId, "ACTUAL").allowed &&
    authorization.canReadCommercial(context, projectId, "FORECAST").allowed &&
    authorization.canReadCommercial(context, projectId, "QUOTE").allowed
  );
}
export function preliminaryAccess(context: RuntimeContext): boolean {
  return (
    context.role !== "VIEWER" &&
    [
      "project:read",
      "project:compare",
      "evidence:read",
      "quote:read",
      "commercial:forecast-read",
      "commercial:actual-read",
      "action:internal-review:propose",
      "action:internal-review:create",
    ].every((capability) =>
      context.capabilities.has(capability as Parameters<typeof context.capabilities.has>[0]),
    )
  );
}
export function evidenceScopesAllowed(
  context: RuntimeContext,
  projectId: string,
  scopes: readonly EvidenceScope[],
  references: readonly string[],
): boolean {
  if (
    scopes.length !== new Set(references).size ||
    new Set(scopes.map((scope) => scope.referenceId)).size !== scopes.length ||
    scopes.some((scope) => !references.includes(scope.referenceId))
  )
    return false;
  return scopes.every((scope) => {
    if (
      scope.organizationId !== context.organizationId ||
      scope.projectDeleted ||
      !scope.inComparison ||
      scope.classification === "TENANT_RESTRICTED" ||
      scope.projectClassification === "TENANT_RESTRICTED"
    )
      return false;
    if (!library.has(scope.classification) && scope.classification !== "TENANT_PRIVATE")
      return false;
    if (
      scope.documentClassification &&
      !library.has(scope.documentClassification) &&
      scope.documentClassification !== "TENANT_PRIVATE"
    )
      return false;
    const assigned = context.assignedProjectIds?.has(scope.projectId) === true;
    const privateAccess = assigned || hasOrganizationWidePrivateHistory(context);
    if (scope.classification === "TENANT_PRIVATE" && !privateAccess) return false;
    const documentAssigned = Boolean(
      scope.documentProjectId && context.assignedProjectIds?.has(scope.documentProjectId),
    );
    const privateDocumentAccess = documentAssigned || hasOrganizationWidePrivateHistory(context);
    if (scope.documentProjectDeleted || scope.documentProjectClassification === "TENANT_RESTRICTED")
      return false;
    if (scope.documentClassification === "TENANT_PRIVATE" && !privateDocumentAccess) return false;
    if (
      scope.documentProjectId &&
      !library.has(scope.documentProjectClassification ?? "") &&
      !(scope.documentProjectClassification === "TENANT_PRIVATE" && privateDocumentAccess)
    )
      return false;
    if (
      scope.projectId !== projectId &&
      !library.has(scope.projectClassification) &&
      !(scope.projectClassification === "TENANT_PRIVATE" && privateAccess)
    )
      return false;
    if (scope.projectId === projectId && !authorization.canReadEvidence(context, projectId).allowed)
      return false;
    const actual =
      scope.observationType === "RECONCILED_ACTUAL_COST" ||
      ["PROJECT_COST_VERSION", "COST_LINE"].includes(scope.subjectType);
    const forecast =
      scope.observationType === "FORECAST_DIRECT_COST" ||
      [
        "FORECAST_COST_VERSION",
        "FORECAST_COST_LINE",
        "SUPPLIER_OFFER",
        "SUPPLIER_OFFER_ITEM",
      ].includes(scope.subjectType);
    const quote =
      scope.observationType === "QUOTED_PRICE" ||
      ["QUOTE_VERSION", "QUOTE_ITEM"].includes(scope.subjectType);
    if (
      actual &&
      (!context.capabilities.has("commercial:actual-read") ||
        (scope.projectId === projectId
          ? !authorization.canReadCommercial(context, projectId, "ACTUAL").allowed
          : !library.has(scope.projectClassification) &&
            !hasOrganizationWidePrivateHistory(context) &&
            context.projectAssignments?.get(scope.projectId)?.canReadActuals !== true))
    )
      return false;
    if (forecast && !context.capabilities.has("commercial:forecast-read")) return false;
    if (quote && !context.capabilities.has("quote:read")) return false;
    return context.capabilities.has("evidence:read");
  });
}

export type CurrentMaterial = Readonly<{
  runs: StoredRunState;
  claims: NonNullable<ReturnType<typeof mandatoryClaims>>;
  evidence: readonly EvidenceSourceRecord[];
  scopes: readonly EvidenceScope[];
  fingerprints: MaterialFingerprints;
  references: readonly string[];
}>;
export type MaterialOutcome =
  | Readonly<{ kind: "READY"; material: CurrentMaterial }>
  | Readonly<{
      kind: "STALE_COMPARISON" | "EVIDENCE_UNAVAILABLE" | "NO_QUOTE_VERSION" | "NOTHING_TO_REVIEW";
    }>;

export async function currentMaterial(
  tx: InternalReviewTransaction,
  context: RuntimeContext,
  project: ReviewProject,
  comparisonRunId: string,
  enrichmentRunId: string,
  now: Date,
  timezone = "Asia/Taipei",
): Promise<MaterialOutcome> {
  const runs = await tx.getRunState(context, project.id, comparisonRunId, enrichmentRunId);
  if (!runs) return { kind: "STALE_COMPARISON" };
  const { stage4, stage5, comparison, economics } = runs;
  if (
    comparison.activeQuoteValidUntil &&
    comparison.activeQuoteValidUntil < calendarDate(now, timezone)
  )
    return { kind: "STALE_COMPARISON" };
  const original4 = object(comparison.snapshot);
  const original5 = object(economics.snapshot);
  const fingerprints4 = object(original4.fingerprints);
  const fingerprints5 = object(original5.fingerprints);
  const lineage = object(comparison.actorSnapshot);
  if (
    comparison.status !== "COMPLETED" ||
    economics.status !== "COMPLETED" ||
    comparison.intelligenceOrganizationId !== context.organizationId ||
    comparison.intelligenceProjectId !== project.id ||
    lineage.actorMembershipId !== context.membershipId ||
    lineage.actorUserId !== context.userId ||
    lineage.sourceFingerprint !== fingerprints4.source ||
    lineage.permissionFingerprint !== fingerprints4.permission ||
    lineage.activeQuoteVersionId !== comparison.activeQuoteVersionId ||
    lineage.snapshotDate !== stage4.run.snapshotDate ||
    original4.schemaVersion !== "comparison-run-snapshot.v1" ||
    original5.schemaVersion !== "economics-enrichment-snapshot.v1" ||
    stage4.run.id !== comparisonRunId ||
    stage5.run.id !== enrichmentRunId ||
    stage5.run.comparisonRunId !== comparisonRunId ||
    stage4.activeContext.projectKey !== project.businessKey ||
    comparison.policyVersion !== stage4.run.policyVersion ||
    comparison.calculationVersion !== stage4.run.calculationVersion ||
    comparison.inputFingerprint !== stage4.run.inputFingerprint ||
    fingerprints4.input !== comparison.inputFingerprint ||
    economics.authorityPolicyVersion !== stage5.run.authorityPolicyVersion ||
    economics.calculationVersion !== stage5.run.calculationVersion ||
    economics.sourceFingerprint !== stage5.run.sourceFingerprint ||
    economics.inputFingerprint !== stage5.run.inputFingerprint ||
    economics.permissionFingerprint !== stage5.run.permissionFingerprint ||
    economics.structuralResultFingerprint !== stage5.structuralResultFingerprint ||
    fingerprints5.source !== economics.sourceFingerprint ||
    fingerprints5.input !== economics.inputFingerprint ||
    fingerprints5.permission !== economics.permissionFingerprint ||
    sha256(stage4) !== stage5.structuralResultFingerprint
  )
    return { kind: "STALE_COMPARISON" };
  if (!stage4.activeContext.activeQuoteVersionKey) return { kind: "NO_QUOTE_VERSION" };
  const claims = mandatoryClaims(stage5);
  if (!claims) return { kind: "EVIDENCE_UNAVAILABLE" };
  const references = [...new Set(claims.flatMap((claim) => claim.evidenceReferenceIds))].sort();
  const scopes = await tx.getEvidenceScopes(context, comparisonRunId, references);
  if (!evidenceScopesAllowed(context, project.id, scopes, references))
    return { kind: "EVIDENCE_UNAVAILABLE" };
  if (
    scopes.some(
      (scope) =>
        scope.documentSuperseded ||
        scope.documentAuthority === "SUPERSEDED" ||
        scope.documentAuthority === "CONFLICTED",
    )
  )
    return { kind: "EVIDENCE_UNAVAILABLE" };

  // Existing deterministic services are replayed into capture-only ports. No run is written.
  const captured4: { input?: PersistCompleteComparisonInput } = {};
  const comparisonReplay = new RunComparableProjectAnalysis(
    tx.projects,
    tx.candidates,
    {
      persistComplete: async (input) => {
        captured4.input = input;
      },
      getAuthorizedResult: (runtime, id) => tx.comparisons.getAuthorizedResult(runtime, id),
    },
    undefined,
    () => new Date(stage4.run.generatedAt),
    (prefix) => (prefix === "cmprun" ? comparisonRunId : "capture_only_intelligence_run"),
  );
  const current4 = await comparisonReplay.execute(context, project.businessKey);
  if (
    current4.kind !== "COMPLETE" ||
    !captured4.input ||
    captured4.input.sourceFingerprint !== fingerprints4.source ||
    captured4.input.permissionFingerprint !== fingerprints4.permission ||
    captured4.input.inputFingerprint !== comparison.inputFingerprint ||
    captured4.input.activeQuoteVersionId !== comparison.activeQuoteVersionId ||
    sha256(current4.result) !== sha256(stage4)
  )
    return { kind: "STALE_COMPARISON" };
  const captured5: { input?: PersistStage5EconomicsInput } = {};
  const economicsReplay = new RunHistoricalEconomicsEnrichment(
    tx.comparisons,
    tx.observations,
    {
      persistComplete: async (input) => {
        captured5.input = input;
      },
      getAuthorizedResult: (runtime, id) => tx.economics.getAuthorizedResult(runtime, id),
    },
    undefined,
    () => new Date(stage5.run.generatedAt),
    () => enrichmentRunId,
  );
  const current5 = await economicsReplay.execute(
    context,
    comparisonRunId,
    stage5.selectedProjectKeys,
  );
  if (
    !("result" in current5) ||
    !captured5.input ||
    captured5.input.sourceFingerprint !== economics.sourceFingerprint ||
    captured5.input.permissionFingerprint !== economics.permissionFingerprint ||
    captured5.input.inputFingerprint !== economics.inputFingerprint ||
    sha256(current5.result) !== sha256(stage5)
  )
    return { kind: "STALE_COMPARISON" };
  const snapshotReferences = [...savedSources(stage5).keys()];
  const resolved = await tx.evidence.getAuthorizedSources(
    context,
    comparisonRunId,
    snapshotReferences,
  );
  if (resolved.kind !== "COMPLETE" || resolved.sources.length !== snapshotReferences.length)
    return { kind: "EVIDENCE_UNAVAILABLE" };
  const requiredSources = resolved.sources.filter((source) =>
    references.includes(source.referenceId),
  );
  if (requiredSources.length !== references.length) return { kind: "EVIDENCE_UNAVAILABLE" };
  if (
    requiredSources.some(
      (source) =>
        source.authorityState === "CONFLICTED" ||
        source.authorityState === "SUPERSEDED" ||
        source.supersededByLabel ||
        source.conflictKeys.length > 0 ||
        (source.staleAt && new Date(source.staleAt).getTime() <= now.getTime()),
    )
  )
    return { kind: "EVIDENCE_UNAVAILABLE" };
  if (
    changedComparisonSources(comparisonRunId, stage5, current5.result, resolved.sources, now).length
  )
    return { kind: "STALE_COMPARISON" };
  if (claims.length === 0) return { kind: "NOTHING_TO_REVIEW" };
  const evidence = [...requiredSources].sort((a, b) => a.referenceId.localeCompare(b.referenceId));
  const fingerprints: MaterialFingerprints = {
    project: sha256(project),
    comparisonSource: captured4.input.sourceFingerprint,
    comparisonInput: comparison.inputFingerprint,
    comparisonPermission: captured4.input.permissionFingerprint,
    comparisonResult: sha256(stage4),
    economicsSource: economics.sourceFingerprint,
    economicsInput: economics.inputFingerprint,
    economicsPermission: economics.permissionFingerprint,
    economicsStructural: economics.structuralResultFingerprint,
    economicsResult: sha256(stage5),
    permission: permissionFingerprint(context, project.id),
    evidence: sha256({ claims, evidence, scopes }),
  };
  return { kind: "READY", material: { runs, claims, evidence, scopes, fingerprints, references } };
}
