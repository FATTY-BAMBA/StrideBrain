import type {
  PrepareQuoteDraft,
  PrepareDraftOutcome,
} from "@/modules/quote-draft/application/prepare-quote-draft";
import type { GetQuoteDraft } from "@/modules/quote-draft/application/get-quote-draft";
import type { GetHomeComparison } from "@/modules/home-intelligence/application/get-home-comparison";
import type { RunComparableProjectAnalysis } from "@/modules/comparisons/application/run-comparable-project-analysis";
import type { RunHistoricalEconomicsEnrichment } from "@/modules/economics/application/run-historical-economics-enrichment";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import type { MissingContextField } from "@/modules/comparisons/domain/contracts";

export type QuoteComparison =
  | {
      kind: "NOT_RUN" | "OUT_OF_DATE" | "UNAVAILABLE" | "NO_ELIGIBLE_HISTORY";
    }
  | { kind: "CONTEXT_INCOMPLETE"; missingFields: readonly MissingContextField[] }
  | {
      kind: "CURRENT";
      preparation?: Extract<PrepareDraftOutcome, { kind: "PREPARED" }>;
      generatedAt: string;
      href: string;
      jobs: readonly { projectKey: string; name: string; score: number }[];
      findings: readonly { sentence: string; href: string }[];
    };
/** The editor reopens saved results; only an explicit RUN creates a comparison. */
export class QuoteComparisonService {
  constructor(
    private readonly quote: Pick<GetQuoteDraft, "execute">,
    private readonly saved: Pick<GetHomeComparison, "execute">,
    private readonly comparison: Pick<RunComparableProjectAnalysis, "execute">,
    private readonly economics: Pick<RunHistoricalEconomicsEnrichment, "execute">,
    private readonly preparation: Pick<PrepareQuoteDraft, "execute">,
  ) {}
  async execute(
    context: RuntimeContext,
    projectKey: string,
    action: "READ" | "RUN",
  ): Promise<QuoteComparison> {
    if (
      !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(projectKey) ||
      !["READ", "RUN"].includes(action) ||
      !context.capabilities.has("project:compare") ||
      !context.capabilities.has("quote:read")
    )
      return { kind: "UNAVAILABLE" };
    try {
      const view = await this.quote.execute(context, projectKey);
      if (
        view.kind !== "AVAILABLE" ||
        !view.canReadAmounts ||
        view.job.organizationId !== context.organizationId
      )
        return { kind: "UNAVAILABLE" };
      if (action === "RUN") {
        const structural = await this.comparison.execute(context, projectKey);
        if (structural.kind === "CONTEXT_INCOMPLETE")
          return { kind: structural.kind, missingFields: structural.missingFields };
        if (structural.kind !== "COMPLETE")
          return {
            kind: structural.kind === "NO_ELIGIBLE_HISTORY" ? structural.kind : "UNAVAILABLE",
          };
        const enriched = await this.economics.execute(
          context,
          structural.result.run.id,
          structural.result.defaultSelectedProjectKeys,
        );
        if (!("result" in enriched)) return { kind: "UNAVAILABLE" };
      }
      const saved = await this.saved.execute(context, projectKey);
      if (!saved) return { kind: "NOT_RUN" };
      if (saved.kind !== "AVAILABLE") return saved;
      const state = {
        comparisonRunId: saved.comparison.run.id,
        economicsRunId: saved.economics?.run.id,
        selectedProjectKeys:
          saved.economics?.selectedProjectKeys ?? saved.comparison.defaultSelectedProjectKeys,
      };
      const prepared =
        view.canDraft && !view.saved?.lines.some((line) => line.recorded || line.basisUnavailable)
          ? await this.preparation.execute(context, projectKey).catch(() => null)
          : null;
      return {
        kind: "CURRENT",
        ...(prepared?.kind === "PREPARED" ? { preparation: prepared } : {}),
        generatedAt: saved.comparison.run.generatedAt,
        href: comparisonHref(context.locale, projectKey, state),
        jobs: [...saved.comparison.matches, ...saved.comparison.broaderMatches]
          .filter((match) => state.selectedProjectKeys.includes(match.project.projectKey))
          .map((match) => ({
            projectKey: match.project.projectKey,
            name: context.locale === "zh-TW" ? match.project.nameZhTw : match.project.nameEn,
            score: match.displayScore,
          })),
        findings: (saved.economics?.claims ?? []).flatMap((claim) => {
          const sentence = claimFindingText(claim, context.locale, view.job.catalog.workCategories);
          return sentence
            ? [
                {
                  sentence,
                  href: comparisonHref(context.locale, projectKey, {
                    ...state,
                    evidenceClaimKey: claim.claimKey,
                  }),
                },
              ]
            : [];
        }),
      };
    } catch {
      return { kind: "UNAVAILABLE" };
    }
  }
}
