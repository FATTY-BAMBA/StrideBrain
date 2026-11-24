import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { basisSourceIds } from "@/modules/quote-draft/domain/draft-policy";
import { sourceView } from "@/modules/evidence-panel/application/get-evidence-panel";
import { getEvidencePanelCopy } from "@/modules/evidence-panel/copy";
import {
  EVIDENCE_PANEL_VERSION,
  type EvidencePanelOutcome,
  type EvidencePanelSelection,
} from "@/modules/evidence-panel/contracts";
import { categoryLabel } from "@/modules/localization/jobs";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  DraftPreparationCodec,
  QuoteDraftRepositoryPort,
} from "@/repositories/ports/quote-draft-repository";
export type DraftEvidenceInput = Readonly<{
  projectKey: string;
  categoryId: string;
  preparationToken: string | null;
  selection?: EvidencePanelSelection | undefined;
}>;
export class GetQuoteDraftEvidence {
  constructor(
    private readonly repository: QuoteDraftRepositoryPort,
    private readonly codec: DraftPreparationCodec,
  ) {}
  execute(context: RuntimeContext, input: DraftEvidenceInput): Promise<EvidencePanelOutcome> {
    const unavailable = { kind: "UNAVAILABLE" as const, requestId: context.requestId };
    if (!context.capabilities.has("quote:read") || !context.capabilities.has("evidence:read"))
      return Promise.resolve(unavailable);
    return this.repository.transaction(async (tx) => {
      const job = await tx.getJob(context, input.projectKey);
      if (!job || !new AuthorizationService().canReadCommercial(context, job.id, "QUOTE").allowed)
        return unavailable;
      const prepared = input.preparationToken ? this.codec.open(input.preparationToken) : null;
      if (
        input.preparationToken &&
        (!prepared ||
          prepared.organizationId !== context.organizationId ||
          prepared.membershipId !== context.membershipId ||
          prepared.projectId !== job.id)
      )
        return unavailable;
      const saved = prepared ? null : await tx.getSaved(context, job);
      const basis =
        prepared?.suggestions.find((line) => line.categoryId === input.categoryId)?.basis ??
        saved?.lines.find((line) => line.categoryId === input.categoryId && line.recorded)?.recorded?.basis;
      const runId =
        prepared?.comparisonRunId ??
        saved?.lines.find((line) => line.categoryId === input.categoryId && line.recorded)?.recorded
          ?.comparisonRunId;
      if (!basis || !runId) return unavailable;
      if (
        basis.actualExceeded &&
        !new AuthorizationService().canReadCommercial(context, job.id, "ACTUAL").allowed
      )
        return { kind: "ACCESS_CHANGED", requestId: context.requestId };
      const stage4 = await tx.getStoredComparison(context, runId);
      if (!stage4 || stage4.activeContext.projectKey !== job.businessKey) return unavailable;
      const result = await tx.getSources(context, runId, basisSourceIds(basis));
      if (result.kind !== "COMPLETE")
        return { kind: "ACCESS_CHANGED", requestId: context.requestId };
      const copy = getEvidencePanelCopy(context.locale);
      const base: EvidencePanelSelection = {
        mode: "SOURCE",
        comparisonRunId: runId,
        sourceKey: "",
      };
      let sources = [...result.sources]
        .sort(
          (a, b) =>
            Number(b.observationType === "QUOTED_PRICE") -
              Number(a.observationType === "QUOTED_PRICE") ||
            a.referenceId.localeCompare(b.referenceId),
        )
        .map((source) => sourceView(source, base, stage4, context.locale, copy, job.catalog));
      let conflict;
      const selection = input.selection;
      if (selection && selection.comparisonRunId !== runId) return unavailable;
      if (selection?.mode === "SOURCE") {
        if (!sources.some((source) => source.sourceKey === selection.sourceKey)) return unavailable;
        sources = sources.filter((source) => source.sourceKey === selection.sourceKey);
      } else if (selection?.mode === "CONFLICT") {
        if (!sources.some((source) => source.conflictKeys.includes(selection.conflictKey)))
          return unavailable;
        const record = await tx.getConflict(context, runId, selection.conflictKey);
        if (!record) return unavailable;
        const records = record.sources.map((source) =>
          sourceView(source, base, stage4, context.locale, copy, job.catalog),
        );
        conflict = {
          conflictKey: record.conflictKey,
          statusLabel: context.locale === "zh-TW" ? "尚未解決" : "Open",
          impactLabel:
            context.locale === "zh-TW"
              ? "此來源有衝突，未納入建議金額。"
              : "This conflicted source is excluded from suggested amounts.",
          records,
        };
        sources = records;
      } else if (selection) return unavailable;
      return {
        kind: "READY",
        view: {
          catalog: job.catalog,
          version: EVIDENCE_PANEL_VERSION,
          locale: context.locale,
          mode: conflict ? "CONFLICT" : "CLAIM",
          context: {
            projectKey: job.businessKey,
            projectName: job.name,
            comparisonRunId: runId,
            snapshotLabel: basis.calculatedAt.slice(0, 10),
            recordedQuoteBasis: true,
            stale: false,
            freshness: { comparisonRunId: runId, state: "UNVERIFIED", changedSources: [] },
          },
          heading: {
            eyebrow: copy.eyebrow,
            title: categoryLabel(context.locale, input.categoryId, job.catalog.workCategories),
            description:
              context.locale === "zh-TW"
                ? "此建議金額及其提示的來源紀錄。"
                : "Source records for this suggestion and its flags.",
          },
          sources,
          notices: [],
          ...(conflict ? { conflict } : {}),
        },
      };
    });
  }
}
