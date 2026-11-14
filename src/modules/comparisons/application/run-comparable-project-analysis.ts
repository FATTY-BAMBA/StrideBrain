import { randomUUID } from "node:crypto";

import { ActiveProjectContextService } from "@/modules/comparisons/application/active-project-context-service";
import { profileFingerprint, sha256 } from "@/modules/comparisons/application/fingerprints";
import {
  CALCULATION_VERSION,
  ELIGIBILITY_POLICY_VERSION,
  SIMILARITY_POLICY_VERSION,
  type CandidateSimilarityCalculation,
  type ComparableProjectMatchDTO,
  type EligibilityReasonCode,
  type PersistableComparisonCandidate,
  type SafeEligibilitySummary,
  type SimilarityFactorKey,
  type Stage4ComparisonOutcome,
  type Stage4ComparisonResult,
} from "@/modules/comparisons/domain/contracts";
import {
  evaluateCandidateEligibility,
  validateActiveComparisonContext,
} from "@/modules/comparisons/domain/eligibility-policy";
import {
  FACTOR_ORDER,
  calculateCandidateSimilarity,
  rankCandidateCalculations,
} from "@/modules/comparisons/domain/similarity-policy";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparableProjectRepositoryPort } from "@/repositories/ports/comparable-project-repository";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";
import type { ProjectRepositoryPort } from "@/repositories/ports/project-repository";

const PRIMARY_LIMIT = 6;
const BROADER_LIMIT = 12;

type IdFactory = (prefix: string) => string;

function defaultIdFactory(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function matchDTO(
  calculation: CandidateSimilarityCalculation,
  rank: number,
): ComparableProjectMatchDTO {
  return Object.freeze({
    project: Object.freeze({
      projectKey: calculation.candidate.businessKey,
      nameEn: calculation.candidate.nameEn,
      nameZhTw: calculation.candidate.nameZhTw,
      subtype: calculation.candidate.subtype,
      location: calculation.candidate.location,
      areaValue: calculation.candidate.areaValue,
      areaUnit: calculation.candidate.areaUnit,
      completedAt: calculation.candidate.completedAt!,
    }),
    rank,
    score: calculation.score,
    displayScore: calculation.displayScore,
    band: calculation.band,
    evidenceCoverage: calculation.evidenceCoverage,
    displayEvidenceCoverage: calculation.displayEvidenceCoverage,
    tier: calculation.tier,
    strongestFactors: calculation.strongestFactors,
    differences: calculation.differences,
    unknowns: calculation.unknowns,
    equivalentWithinTwoPoints: calculation.equivalentWithinTwoPoints,
    policyVersion: SIMILARITY_POLICY_VERSION,
  });
}

function exclusionSummary(
  authorizedCount: number,
  decisions: readonly Readonly<{
    eligible: boolean;
    reasonCodes: readonly EligibilityReasonCode[];
  }>[],
  calculations: readonly CandidateSimilarityCalculation[],
): SafeEligibilitySummary {
  const excludedByReason: Partial<Record<EligibilityReasonCode, number>> = {};
  for (const decision of decisions) {
    if (decision.eligible) continue;
    for (const reason of decision.reasonCodes) {
      excludedByReason[reason] = (excludedByReason[reason] ?? 0) + 1;
    }
  }
  return Object.freeze({
    authorizedCandidatesConsidered: authorizedCount,
    eligibleForScoring: decisions.filter((decision) => decision.eligible).length,
    primaryMatchCount: calculations.filter((calculation) => calculation.tier === "PRIMARY").length,
    broaderMatchCount: calculations.filter((calculation) => calculation.tier === "BROADER").length,
    excludedByReason: Object.freeze(excludedByReason),
  });
}

function persistableCandidate(
  calculation: CandidateSimilarityCalculation,
  rank: number,
): PersistableComparisonCandidate {
  const warnings = [
    ...calculation.unknowns.map((unknown) => `UNKNOWN_FACTOR:${unknown.factorKey}`),
    ...calculation.equivalentWithinTwoPoints.map((key) => `EQUIVALENT_WITH:${key}`),
  ];
  return Object.freeze({
    candidateProjectId: calculation.candidate.internalId,
    candidateProjectKey: calculation.candidate.businessKey,
    rank,
    score: calculation.score,
    band: calculation.band,
    evidenceCoverage: calculation.evidenceCoverage,
    economicsState: "NOT_EVALUATED_STAGE4",
    warnings: Object.freeze(warnings),
    factors: Object.freeze(
      calculation.factors.map((factor) =>
        Object.freeze({
          factorKey: factor.factorKey,
          state: factor.state,
          weight: factor.weight.toFixed(4),
          normalizedValue: factor.normalizedValue,
          contribution: factor.contribution,
          explanation: Object.freeze({
            code: factor.explanationCode,
            state: factor.state,
          }),
          evidenceReferenceIds: factor.evidenceReferenceIds,
        }),
      ),
    ),
  });
}

export class RunComparableProjectAnalysis {
  private readonly activeContext: ActiveProjectContextService;

  constructor(
    private readonly projects: ProjectRepositoryPort,
    private readonly candidates: ComparableProjectRepositoryPort,
    private readonly runs: ComparisonRunRepositoryPort,
    private readonly authorization = new AuthorizationService(),
    private readonly clock: () => Date = () => new Date(),
    private readonly idFactory: IdFactory = defaultIdFactory,
  ) {
    this.activeContext = new ActiveProjectContextService(candidates, clock);
  }

  async execute(
    runtimeContext: RuntimeContext,
    activeProjectKey: string,
  ): Promise<Stage4ComparisonOutcome> {
    try {
      const project = await this.projects.getAuthorizedByBusinessKey(
        runtimeContext,
        activeProjectKey,
      );
      if (!project) return this.unavailable(runtimeContext);

      const permission = this.authorization.canRunComparison(runtimeContext, project.id);
      if (!permission.allowed || project.organizationId !== runtimeContext.organizationId) {
        return this.unavailable(runtimeContext);
      }

      const resolved = await this.activeContext.resolve(runtimeContext, project.id);
      if (!resolved) return this.unavailable(runtimeContext);

      const missingFields = validateActiveComparisonContext(resolved.context);
      if (missingFields.length > 0) {
        return Object.freeze({
          kind: "CONTEXT_INCOMPLETE",
          errorCode: "PROJECT_CONTEXT_INCOMPLETE",
          requestId: runtimeContext.requestId,
          missingFields,
        });
      }

      const batch = await this.candidates.listAuthorizedHistoricalProfiles(
        runtimeContext,
        project.id,
      );
      if (
        batch.profiles.some(
          (candidate) => candidate.organizationId !== runtimeContext.organizationId,
        )
      ) {
        return this.failed(runtimeContext);
      }

      const decisions = batch.profiles.map((candidate) =>
        evaluateCandidateEligibility(resolved.context, candidate),
      );
      const calculations = rankCandidateCalculations(
        batch.profiles
          .map((candidate, index) => ({ candidate, decision: decisions[index]! }))
          .filter(({ decision }) => decision.eligible)
          .map(({ candidate, decision }) =>
            calculateCandidateSimilarity(resolved.context, candidate, decision),
          ),
      );
      const summary = exclusionSummary(batch.profiles.length, decisions, calculations);
      const primary = calculations
        .filter((calculation) => calculation.tier === "PRIMARY")
        .slice(0, PRIMARY_LIMIT);
      const broader = calculations
        .filter((calculation) => calculation.tier === "BROADER")
        .slice(0, BROADER_LIMIT);

      if (primary.length === 0) {
        return Object.freeze({
          kind: "NO_ELIGIBLE_HISTORY",
          errorCode: "COMPARISON_NO_ELIGIBLE_HISTORY",
          requestId: runtimeContext.requestId,
          summary,
        });
      }

      const generatedAt = this.clock().toISOString();
      const intelligenceRunId = this.idFactory("intelrun");
      const comparisonRunId = this.idFactory("cmprun");
      const sourceFingerprint = sha256({
        active: profileFingerprint(resolved.context),
        candidates: calculations.map((calculation) => ({
          projectKey: calculation.candidate.businessKey,
          fingerprint: profileFingerprint(calculation.candidate),
        })),
      });
      const inputFingerprint = sha256({
        sourceFingerprint,
        permissionFingerprint: resolved.context.permissionFingerprint,
        snapshotDate: resolved.context.snapshotDate,
        eligibilityPolicyVersion: ELIGIBILITY_POLICY_VERSION,
        policyVersion: SIMILARITY_POLICY_VERSION,
        calculationVersion: CALCULATION_VERSION,
      });
      const missingOptionalContext = Object.freeze(
        [
          ...(resolved.context.materialIds.length === 0 ? ["MATERIAL_OVERLAP"] : []),
          ...(resolved.context.supplierIds.length === 0 ? ["SUPPLIER_OVERLAP"] : []),
        ] as SimilarityFactorKey[],
      );

      const result: Stage4ComparisonResult = Object.freeze({
        version: "comparable-project-stage4.v1",
        run: Object.freeze({
          id: comparisonRunId,
          generatedAt,
          snapshotDate: resolved.context.snapshotDate,
          status: "COMPLETE",
          eligibilityPolicyVersion: ELIGIBILITY_POLICY_VERSION,
          policyVersion: SIMILARITY_POLICY_VERSION,
          calculationVersion: CALCULATION_VERSION,
          inputFingerprint,
        }),
        activeContext: Object.freeze({
          projectKey: resolved.context.businessKey,
          nameEn: resolved.context.nameEn,
          nameZhTw: resolved.context.nameZhTw,
          comparisonClass: resolved.context.comparisonClass,
          subtype: resolved.context.subtype,
          areaValue: resolved.context.areaValue,
          areaUnit: resolved.context.areaUnit,
          currency: resolved.context.currency,
          location: resolved.context.location,
          activeQuoteVersionId: resolved.context.activeQuoteVersionId,
        }),
        summary: Object.freeze({
          ...summary,
          factorsUsed: FACTOR_ORDER,
          missingOptionalContext,
        }),
        matches: Object.freeze(primary.map((calculation, index) => matchDTO(calculation, index + 1))),
        broaderMatches: Object.freeze(
          broader.map((calculation, index) => matchDTO(calculation, primary.length + index + 1)),
        ),
        defaultSelectedProjectKeys: Object.freeze(
          primary.slice(0, 3).map((calculation) => calculation.candidate.businessKey),
        ),
      });

      await this.runs.persistComplete(
        Object.freeze({
          organizationId: runtimeContext.organizationId,
          requestId: runtimeContext.requestId,
          actorUserId: runtimeContext.userId,
          actorMembershipId: runtimeContext.membershipId,
          intelligenceRunId,
          comparisonRunId,
          activeProjectId: project.id,
          activeProjectKey: project.businessKey,
          activeQuoteVersionId: resolved.activeQuoteVersionInternalId,
          generatedAt,
          snapshotDate: resolved.context.snapshotDate,
          inputFingerprint,
          sourceFingerprint,
          permissionFingerprint: resolved.context.permissionFingerprint,
          result,
          candidates: Object.freeze(
            calculations.map((calculation, index) => persistableCandidate(calculation, index + 1)),
          ),
        }),
      );

      return Object.freeze({ kind: "COMPLETE", result });
    } catch {
      return this.failed(runtimeContext);
    }
  }

  private unavailable(context: RuntimeContext): Stage4ComparisonOutcome {
    return Object.freeze({
      kind: "UNAVAILABLE",
      errorCode: "PROJECT_UNAVAILABLE",
      requestId: context.requestId,
    });
  }

  private failed(context: RuntimeContext): Stage4ComparisonOutcome {
    return Object.freeze({
      kind: "FAILED",
      errorCode: "COMPARISON_FAILED",
      requestId: context.requestId,
    });
  }
}
