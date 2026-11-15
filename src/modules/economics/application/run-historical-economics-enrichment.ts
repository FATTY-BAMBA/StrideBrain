import { randomUUID } from "node:crypto";

import { permissionFingerprint, sha256 } from "@/modules/comparisons/application/fingerprints";
import { HistoricalEconomicsService } from "@/modules/economics/domain/historical-economics-service";
import type {
  Stage5EconomicsOutcome,
  Stage5EconomicsResult,
} from "@/modules/economics/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";
import type { EconomicsEnrichmentRunRepositoryPort } from "@/repositories/ports/economics-enrichment-run-repository";
import type { EconomicsObservationRepositoryPort } from "@/repositories/ports/economics-observation-repository";

function snapshotDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function sourceFingerprint(
  batch: Awaited<ReturnType<EconomicsObservationRepositoryPort["loadAuthorizedBatch"]>>,
) {
  if (!batch) throw new Error("ECONOMICS_BATCH_MISSING");
  return sha256({
    projects: batch.projects.map((project) => ({
      id: project.internalId,
      key: project.businessKey,
      status: project.status,
      areaValue: project.areaValue,
      areaUnit: project.areaUnit,
      currency: project.currency,
      programmeWeeks: project.programmeWeeks ?? null,
      classification: project.dataClassification,
      evidence: [...project.evidenceReferenceIds].sort(),
    })),
    records: batch.records.map((record) => ({
      id: record.id,
      projectId: record.projectId,
      recordKey: record.recordKey,
      versionNumber: record.versionNumber ?? null,
      observationType: record.observationType,
      authorityState: record.authorityState,
      totalAmount: record.totalAmount,
      currency: record.currency,
      effectiveAt: record.effectiveAt ?? null,
      validUntil: record.validUntil ?? null,
      supersededById: record.supersededById ?? null,
      conflictIds: [...record.conflictIds].sort(),
      evidence: [...record.evidenceReferenceIds].sort(),
      lines: record.lines.map((line) => ({
        id: line.id,
        categoryId: line.categoryId,
        amount: line.amount,
        quantity: line.quantity,
        unitRate: line.unitRate,
        unit: line.unit,
        authorityState: line.authorityState,
        evidence: [...line.evidenceReferenceIds].sort(),
      })),
    })),
    evidence: batch.evidence.map((reference) => ({
      id: reference.id,
      subjectType: reference.subjectType,
      subjectId: reference.subjectId,
      authorityState: reference.authorityState,
      observationType: reference.observationType ?? null,
      effectiveAt: reference.effectiveAt ?? null,
      staleAt: reference.staleAt ?? null,
      conflictIds: [...reference.conflictIds].sort(),
    })),
  });
}

function permissionFingerprintForEconomics(
  context: RuntimeContext,
  activeProjectId: string,
  accessScope: string,
  selectedProjectIds: readonly string[],
): string {
  return sha256({
    base: permissionFingerprint(context, activeProjectId),
    accessScope,
    selectedProjectIds: [...selectedProjectIds].sort(),
  });
}

function outcomeKind(result: Stage5EconomicsResult): Stage5EconomicsOutcome["kind"] {
  if (result.states.includes("CONFLICTED_EVIDENCE")) return "CONFLICTED_EVIDENCE";
  if (result.states.includes("INSUFFICIENT_ACTUAL_EVIDENCE")) {
    return "INSUFFICIENT_ACTUAL_EVIDENCE";
  }
  if (result.states.includes("STALE_SUPPLIER_EVIDENCE")) return "STALE_SUPPLIER_EVIDENCE";
  return result.run.status === "COMPLETE" ? "COMPLETE" : "PARTIAL_ECONOMICS";
}

export class RunHistoricalEconomicsEnrichment {
  constructor(
    private readonly comparisonRuns: ComparisonRunRepositoryPort,
    private readonly observations: EconomicsObservationRepositoryPort,
    private readonly enrichmentRuns: EconomicsEnrichmentRunRepositoryPort,
    private readonly economics = new HistoricalEconomicsService(),
    private readonly clock: () => Date = () => new Date(),
    private readonly idFactory: (prefix: string) => string = (prefix) =>
      `${prefix}_${randomUUID()}`,
  ) {}

  async execute(
    context: RuntimeContext,
    comparisonRunId: string,
    selectedProjectKeys?: readonly string[],
  ): Promise<Stage5EconomicsOutcome> {
    try {
      const stage4 = await this.comparisonRuns.getAuthorizedResult(context, comparisonRunId);
      if (!stage4) return this.unavailable(context);

      const batch = await this.observations.loadAuthorizedBatch(
        context,
        comparisonRunId,
        stage4,
        selectedProjectKeys,
      );
      if (!batch) return this.unavailable(context);

      const generatedAt = this.clock().toISOString();
      const enrichmentRunId = this.idFactory("econrun");
      const structuralResultFingerprint = sha256(stage4);
      const source = sourceFingerprint(batch);
      const permission = permissionFingerprintForEconomics(
        context,
        batch.activeProjectId,
        batch.accessScope,
        batch.selectedProjectIds,
      );
      const input = sha256({
        comparisonRunId,
        stage4InputFingerprint: stage4.run.inputFingerprint,
        selectedProjectKeys: [...batch.selectedProjectKeys],
        source,
        permission,
        snapshotDate: stage4.run.snapshotDate || snapshotDate(this.clock()),
        authorityPolicyVersion: "EVIDENCE-AUTHORITY-1.0",
        calculationVersion: "CPI-ECON-1.0",
      });

      const assembly = this.economics.assemble({
        stage4,
        batch,
        enrichmentRunId,
        generatedAt,
        snapshotDate: stage4.run.snapshotDate,
        inputFingerprint: input,
        sourceFingerprint: source,
        permissionFingerprint: permission,
        structuralResultFingerprint,
      });

      await this.enrichmentRuns.persistComplete({
        organizationId: context.organizationId,
        requestId: context.requestId,
        actorUserId: context.userId,
        actorMembershipId: context.membershipId,
        enrichmentRunId,
        comparisonRunId,
        activeProjectId: batch.activeProjectId,
        generatedAt,
        inputFingerprint: input,
        sourceFingerprint: source,
        permissionFingerprint: permission,
        accessScope: batch.accessScope,
        result: assembly.result,
        decisions: assembly.decisions,
        claims: assembly.result.claims,
      });

      return Object.freeze({
        kind: outcomeKind(assembly.result),
        result: assembly.result,
      }) as Stage5EconomicsOutcome;
    } catch {
      return this.failed(context);
    }
  }

  private unavailable(context: RuntimeContext): Stage5EconomicsOutcome {
    return Object.freeze({
      kind: "UNAVAILABLE",
      errorCode: "ECONOMICS_UNAVAILABLE",
      requestId: context.requestId,
    });
  }

  private failed(context: RuntimeContext): Stage5EconomicsOutcome {
    return Object.freeze({
      kind: "FAILED",
      errorCode: "ECONOMICS_FAILED",
      requestId: context.requestId,
    });
  }
}
