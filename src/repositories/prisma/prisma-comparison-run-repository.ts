import { sha256 } from "@/modules/comparisons/application/fingerprints";
import {
  SIMILARITY_POLICY_VERSION,
  type PersistCompleteComparisonInput,
  type Stage4ComparisonResult,
} from "@/modules/comparisons/domain/contracts";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";

type ComparisonRunReadRow = Readonly<{
  id: string;
  organizationId: string;
  activeProjectId: string;
  status: "COMPLETED" | "PENDING" | "RUNNING" | "FAILED" | "STALE";
  resultSnapshot: unknown;
}>;

type PrismaComparisonTransaction = {
  intelligenceRun: {
    create(args: unknown): Promise<unknown>;
  };
  comparisonRun: {
    create(args: unknown): Promise<unknown>;
  };
};

export type PrismaComparisonRunDatabase = {
  $transaction<T>(work: (transaction: PrismaComparisonTransaction) => Promise<T>): Promise<T>;
  comparisonRun: {
    findFirst(args: unknown): Promise<ComparisonRunReadRow | null>;
  };
};

type StoredResultSnapshot = Readonly<{
  schemaVersion: "comparison-run-snapshot.v1";
  result: Stage4ComparisonResult;
  fingerprints: Readonly<{
    source: string;
    permission: string;
    input: string;
  }>;
}>;

function boundedId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(value).slice(0, 28)}`;
}

function decimal4(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error("INVALID_COMPARISON_DECIMAL");
  return number.toFixed(4);
}

function storedSnapshot(input: PersistCompleteComparisonInput): StoredResultSnapshot {
  return Object.freeze({
    schemaVersion: "comparison-run-snapshot.v1",
    result: input.result,
    fingerprints: Object.freeze({
      source: input.sourceFingerprint,
      permission: input.permissionFingerprint,
      input: input.inputFingerprint,
    }),
  });
}

function isStage4Result(value: unknown): value is Stage4ComparisonResult {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === "comparable-project-stage4.v1" &&
    typeof record.run === "object" &&
    Array.isArray(record.matches) &&
    Array.isArray(record.broaderMatches)
  );
}

function resultFromSnapshot(value: unknown): Stage4ComparisonResult | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== "comparison-run-snapshot.v1") return null;
  return isStage4Result(record.result) ? record.result : null;
}

export class PrismaComparisonRunRepository implements ComparisonRunRepositoryPort {
  constructor(
    private readonly database: PrismaComparisonRunDatabase,
    private readonly authorization = new AuthorizationService(),
  ) {}

  async persistComplete(input: PersistCompleteComparisonInput): Promise<void> {
    const completedAt = new Date(input.generatedAt);
    const snapshot = storedSnapshot(input);

    await this.database.$transaction(async (transaction) => {
      await transaction.intelligenceRun.create({
        data: {
          id: input.intelligenceRunId,
          organizationId: input.organizationId,
          projectId: input.activeProjectId,
          requestId: input.requestId,
          intent: "COMPARABLE_PROJECT_ANALYSIS",
          status: "COMPLETED",
          policyVersion: SIMILARITY_POLICY_VERSION,
          activeContextSnapshot: {
            activeProjectKey: input.activeProjectKey,
            activeQuoteVersionId: input.activeQuoteVersionId ?? null,
            snapshotDate: input.snapshotDate,
            actorUserId: input.actorUserId,
            actorMembershipId: input.actorMembershipId,
            sourceFingerprint: input.sourceFingerprint,
            permissionFingerprint: input.permissionFingerprint,
          },
          resultSnapshot: snapshot,
          startedAt: completedAt,
          completedAt,
        },
      });

      await transaction.comparisonRun.create({
        data: {
          id: input.comparisonRunId,
          organizationId: input.organizationId,
          intelligenceRunId: input.intelligenceRunId,
          activeProjectId: input.activeProjectId,
          activeQuoteVersionId: input.activeQuoteVersionId ?? null,
          policyVersion: input.result.run.policyVersion,
          calculationVersion: input.result.run.calculationVersion,
          status: "COMPLETED",
          inputFingerprint: input.inputFingerprint,
          resultVersion: 1,
          resultSnapshot: snapshot,
          createdAt: completedAt,
          completedAt,
          candidates: {
            create: input.candidates.map((candidate) => ({
              id: boundedId("cmpcand", {
                run: input.comparisonRunId,
                project: candidate.candidateProjectId,
              }),
              organizationId: input.organizationId,
              candidateProjectId: candidate.candidateProjectId,
              rank: candidate.rank,
              score: decimal4(candidate.score),
              band: candidate.band,
              evidenceCoverage: decimal4(candidate.evidenceCoverage),
              economicsState: candidate.economicsState,
              warnings: [...candidate.warnings],
              factors: {
                create: candidate.factors.map((factor) => ({
                  id: boundedId("cmpfactor", {
                    run: input.comparisonRunId,
                    project: candidate.candidateProjectId,
                    factor: factor.factorKey,
                  }),
                  organizationId: input.organizationId,
                  factorKey: factor.factorKey,
                  state: factor.state,
                  weight: decimal4(factor.weight),
                  normalizedValue: decimal4(factor.normalizedValue) ?? null,
                  contribution: decimal4(factor.contribution) ?? null,
                  explanation: factor.explanation,
                  evidenceReferenceIds: [...factor.evidenceReferenceIds],
                })),
              },
            })),
          },
        },
      });
    });
  }

  async getAuthorizedResult(
    context: RuntimeContext,
    comparisonRunId: string,
  ): Promise<Stage4ComparisonResult | null> {
    if (!context.capabilities.has("project:compare")) return null;
    const row = await this.database.comparisonRun.findFirst({
      where: {
        id: comparisonRunId,
        organizationId: context.organizationId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        organizationId: true,
        activeProjectId: true,
        status: true,
        resultSnapshot: true,
      },
    });
    if (!row || row.organizationId !== context.organizationId) return null;

    const decision = this.authorization.canRunComparison(context, row.activeProjectId);
    if (!decision.allowed) return null;
    return resultFromSnapshot(row.resultSnapshot);
  }
}
