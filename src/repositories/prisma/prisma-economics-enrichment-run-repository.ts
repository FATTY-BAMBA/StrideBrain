import { sha256 } from "@/modules/comparisons/application/fingerprints";
import { decimalFromString, decimalToString } from "@/modules/finance/fixed-decimal";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import {
  ECONOMICS_CALCULATION_VERSION,
  EVIDENCE_AUTHORITY_POLICY_VERSION,
  type EconomicsAccessScope,
  type PersistStage5EconomicsInput,
  type Stage5EconomicsResult,
} from "@/modules/economics/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { EconomicsEnrichmentRunRepositoryPort } from "@/repositories/ports/economics-enrichment-run-repository";

type EnrichmentReadRow = Readonly<{
  id: string;
  organizationId: string;
  activeProjectId: string;
  status: "COMPLETED" | "PENDING" | "RUNNING" | "FAILED" | "STALE";
  accessScope: string;
  resultSnapshot: unknown;
  claims?: readonly Readonly<{
    claimKey: string;
    originalClaimKey: string | null;
    categoryId: string | null;
  }>[];
}>;

type PrismaEconomicsTransaction = {
  economicsEnrichmentRun: {
    create(args: unknown): Promise<unknown>;
  };
  comparisonClaim: {
    createMany(args: unknown): Promise<unknown>;
  };
};

export type PrismaEconomicsEnrichmentDatabase = {
  $transaction<T>(work: (transaction: PrismaEconomicsTransaction) => Promise<T>): Promise<T>;
  economicsEnrichmentRun: {
    findFirst(args: unknown): Promise<EnrichmentReadRow | null>;
  };
};

type StoredEconomicsSnapshot = Readonly<{
  schemaVersion: "economics-enrichment-snapshot.v1";
  result: Stage5EconomicsResult;
  fingerprints: Readonly<{
    source: string;
    permission: string;
    input: string;
  }>;
}>;

function boundedId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(value).slice(0, 28)}`;
}

function decimal6(value: string | undefined): string | null {
  if (value === undefined) return null;
  return decimalToString(decimalFromString(value, 6));
}

function storedSnapshot(input: PersistStage5EconomicsInput): StoredEconomicsSnapshot {
  return Object.freeze({
    schemaVersion: "economics-enrichment-snapshot.v1",
    result: input.result,
    fingerprints: Object.freeze({
      source: input.sourceFingerprint,
      permission: input.permissionFingerprint,
      input: input.inputFingerprint,
    }),
  });
}

function isStage5Result(value: unknown): value is Stage5EconomicsResult {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === "comparable-project-stage5.v1" &&
    typeof record.run === "object" &&
    typeof record.overall === "object" &&
    Array.isArray(record.categories) &&
    Array.isArray(record.claims) &&
    Array.isArray(record.evidenceBundles)
  );
}

function resultFromSnapshot(value: unknown): Stage5EconomicsResult | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== "economics-enrichment-snapshot.v1") return null;
  return isStage5Result(record.result) ? record.result : null;
}

function currentScope(
  context: RuntimeContext,
  activeProjectId: string,
  authorization: AuthorizationService,
): EconomicsAccessScope | null {
  if (!authorization.canRunComparison(context, activeProjectId).allowed) return null;
  if (authorization.canReadCommercial(context, activeProjectId, "ACTUAL").allowed) {
    return "FULL_ACTUAL";
  }
  if (authorization.canReadCommercial(context, activeProjectId, "FORECAST").allowed) {
    return "QUOTE_AND_FORECAST";
  }
  if (authorization.canReadCommercial(context, activeProjectId, "QUOTE").allowed) {
    return "QUOTE_ONLY";
  }
  return "STRUCTURAL_ONLY";
}

const ACCESS_RANK: Readonly<Record<EconomicsAccessScope, number>> = Object.freeze({
  STRUCTURAL_ONLY: 0,
  QUOTE_ONLY: 1,
  QUOTE_AND_FORECAST: 2,
  FULL_ACTUAL: 3,
});

function isAccessScope(value: string): value is EconomicsAccessScope {
  return value in ACCESS_RANK;
}

export class PrismaEconomicsEnrichmentRunRepository implements EconomicsEnrichmentRunRepositoryPort {
  constructor(
    private readonly database: PrismaEconomicsEnrichmentDatabase,
    private readonly authorization = new AuthorizationService(),
  ) {}

  async persistComplete(input: PersistStage5EconomicsInput): Promise<void> {
    const completedAt = new Date(input.generatedAt);
    const snapshot = storedSnapshot(input);

    await this.database.$transaction(async (transaction) => {
      await transaction.economicsEnrichmentRun.create({
        data: {
          id: input.enrichmentRunId,
          organizationId: input.organizationId,
          comparisonRunId: input.comparisonRunId,
          activeProjectId: input.activeProjectId,
          status: "COMPLETED",
          accessScope: input.accessScope,
          authorityPolicyVersion: EVIDENCE_AUTHORITY_POLICY_VERSION,
          calculationVersion: ECONOMICS_CALCULATION_VERSION,
          inputFingerprint: input.inputFingerprint,
          sourceFingerprint: input.sourceFingerprint,
          permissionFingerprint: input.permissionFingerprint,
          structuralResultFingerprint: input.result.structuralResultFingerprint,
          resultVersion: 1,
          resultSnapshot: snapshot,
          createdAt: completedAt,
          completedAt,
          observationDecisions: {
            create: input.decisions.map((decision) => ({
              id: boundedId("econdecision", {
                enrichmentRunId: input.enrichmentRunId,
                observationId: decision.observationId,
                categoryId: decision.categoryId ?? null,
              }),
              organizationId: input.organizationId,
              projectId: decision.projectId,
              decisionKey: `${decision.observationId}:${decision.categoryId ?? "TOTAL"}`,
              observationId: decision.observationId,
              categoryId: decision.categoryId ?? null,
              observationType: decision.observationType,
              authorityState: decision.authorityState,
              included: decision.included,
              reasonCodes: [...decision.reasonCodes],
              normalizedAmount: decimal6(decision.normalizedAmount),
              normalizedUnit: decision.normalizedUnit ?? null,
              evidenceReferenceIds: [...decision.evidenceReferenceIds],
            })),
          },
        },
      });

      if (input.claims.length > 0) {
        await transaction.comparisonClaim.createMany({
          data: input.claims.map((claim) => ({
            id: boundedId("econclaim", {
              enrichmentRunId: input.enrichmentRunId,
              claimKey: claim.claimKey,
            }),
            organizationId: input.organizationId,
            comparisonRunId: input.comparisonRunId,
            claimKey: claim.claimKey,
            enrichmentRunId: input.enrichmentRunId,
            claimType: claim.kind,
            categoryId: claim.categoryId ?? null,
            titleEn: claim.titleEn,
            titleZhTw: claim.titleZhTw,
            value: claim.value,
            observationType: claim.observationType ?? null,
            authorityState: claim.authorityState ?? null,
            sufficiencyCode: claim.sufficiencyCode ?? null,
            evidenceReferenceIds: [...claim.evidenceReferenceIds],
          })),
        });
      }
    });
  }

  async getAuthorizedResult(
    context: RuntimeContext,
    enrichmentRunId: string,
  ): Promise<Stage5EconomicsResult | null> {
    if (!context.capabilities.has("project:compare")) return null;
    const row = await this.database.economicsEnrichmentRun.findFirst({
      where: {
        id: enrichmentRunId,
        organizationId: context.organizationId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        organizationId: true,
        activeProjectId: true,
        status: true,
        accessScope: true,
        resultSnapshot: true,
      },
    });
    if (!row || row.organizationId !== context.organizationId || !isAccessScope(row.accessScope)) {
      return null;
    }

    const available = currentScope(context, row.activeProjectId, this.authorization);
    if (!available || ACCESS_RANK[available] < ACCESS_RANK[row.accessScope]) return null;

    const result = resultFromSnapshot(row.resultSnapshot);
    if (!result) return null;
    if (result.evidenceBundles.length > 0 && !context.capabilities.has("evidence:read"))
      return null;
    const needsIdentity = result.claims.some(
      (claim) =>
        (claim.kind === "CATEGORY_QUOTED_VARIANCE" ||
          claim.kind === "CATEGORY_FORECAST_ACTUAL_VARIANCE" ||
          claim.kind === "CATEGORY_ACTUAL_INSUFFICIENT") &&
        !claim.categoryId,
    );
    const identityRow = needsIdentity
      ? await this.database.economicsEnrichmentRun.findFirst({
          where: {
            id: enrichmentRunId,
            organizationId: context.organizationId,
            activeProjectId: row.activeProjectId,
            status: "COMPLETED",
          },
          select: {
            organizationId: true,
            claims: { select: { claimKey: true, originalClaimKey: true, categoryId: true } },
          },
        })
      : null;
    if (needsIdentity && identityRow?.organizationId !== context.organizationId) return null;
    // Historical snapshots keep their original keys so receipts retain their
    // link targets. Attach category metadata without decoding a key or rewriting history.
    return {
      ...result,
      claims: result.claims.map((claim) => {
        if (claim.categoryId) return claim;
        const identity = identityRow?.claims?.find(
          (stored) =>
            stored.claimKey === claim.claimKey || stored.originalClaimKey === claim.claimKey,
        );
        return identity?.categoryId ? { ...claim, categoryId: identity.categoryId } : claim;
      }),
    };
  }
}
