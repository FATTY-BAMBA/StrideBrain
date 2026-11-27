import type { Route } from "next";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { redirect } from "next/navigation";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import { notFound } from "next/navigation";

import { ComparisonExperienceClient } from "@/components/comparisons/comparison-experience-client";
import { ComparisonStart } from "@/components/comparisons/comparison-start";
import { ComparisonState } from "@/components/comparisons/comparison-state";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { buildComparisonExperience } from "@/modules/comparison-experience/build-comparison-experience";
import { parseComparisonRouteSearch } from "@/modules/comparison-experience/route-state";
import { parseEvidenceSelection } from "@/modules/evidence-panel/route-state";
import type { EvidencePanelOutcome } from "@/modules/evidence-panel/contracts";
import { isSupportedLocale } from "@/modules/localization/config";
import {
  parseInternalReviewRoute,
  reviewReturnContext,
} from "@/modules/internal-review-experience/route-state";

type ComparisonPageProps = Readonly<{
  params: Promise<{
    locale: string;
    projectKey: string;
  }>;
  searchParams: Promise<Readonly<Record<string, string | readonly string[] | undefined>>>;
}>;

const SAFE_STATE_KINDS = new Set([
  "SESSION_REQUIRED",
  "CONTEXT_INCOMPLETE",
  "NO_ELIGIBLE_HISTORY",
  "UNAVAILABLE",
  "FAILED",
  "ECONOMICS_UNAVAILABLE",
  "ECONOMICS_FAILED",
] as const);

type SafeStateKind = Parameters<typeof ComparisonState>[0]["kind"];

function safeStateKind(value: string | undefined): SafeStateKind | null {
  return value && SAFE_STATE_KINDS.has(value as SafeStateKind) ? (value as SafeStateKind) : null;
}

export default async function ComparisonPage({ params, searchParams }: ComparisonPageProps) {
  const { locale: rawLocale, projectKey } = await params;
  if (!isSupportedLocale(rawLocale)) notFound();

  const search = await searchParams;
  const route = parseComparisonRouteSearch(search);
  const actionRoute = parseInternalReviewRoute(search);
  const context = await resolveServerRuntimeContext();

  const workspace = context
    ? await createProjectWorkspaceService().execute({ ...context, locale: rawLocale }, projectKey)
    : null;
  const closed =
    workspace?.kind === "AVAILABLE" && workspace.workspace.project.stage === "COMPLETE";
  if (closed && context && !route.comparisonRunId) {
    const saved = await createComparisonServices().getHomeComparison.execute(context, projectKey);
    if (saved?.kind === "AVAILABLE")
      redirect(
        comparisonHref(rawLocale, projectKey, {
          comparisonRunId: saved.comparison.run.id,
          economicsRunId: saved.economics?.run.id,
          selectedProjectKeys:
            saved.economics?.selectedProjectKeys ?? saved.comparison.defaultSelectedProjectKeys,
        }) as Route,
      );
  }
  return (
    <div className="foundation-page">
      {await (async () => {
        if (!context?.firmLists) {
          return (
            <ComparisonState
              closed={closed}
              locale={rawLocale}
              projectKey={projectKey}
              kind="SESSION_REQUIRED"
            />
          );
        }

        if (!route.comparisonRunId) {
          const stateKind = safeStateKind(route.outcome);
          if (stateKind) {
            return (
              <ComparisonState
                closed={closed}
                locale={rawLocale}
                projectKey={projectKey}
                kind={stateKind}
                requestId={route.requestId}
                missingFields={route.missingFields}
              />
            );
          }
          return <ComparisonStart closed={closed} locale={rawLocale} projectKey={projectKey} />;
        }

        const services = createComparisonServices();
        const structural = await services.getComparison.execute(context, route.comparisonRunId);
        if (structural.kind !== "COMPLETE") {
          return (
            <ComparisonState
              closed={closed}
              locale={rawLocale}
              projectKey={projectKey}
              kind="UNAVAILABLE"
              requestId={structural.requestId}
            />
          );
        }
        if (structural.result.activeContext.projectKey !== projectKey) {
          return (
            <ComparisonState
              closed={closed}
              locale={rawLocale}
              projectKey={projectKey}
              kind="UNAVAILABLE"
              requestId={context.requestId}
            />
          );
        }

        const economics = route.economicsRunId
          ? await services.getEconomics.execute(context, route.economicsRunId)
          : null;
        if (economics && economics.run.comparisonRunId !== structural.result.run.id) {
          return (
            <ComparisonState
              closed={closed}
              locale={rawLocale}
              projectKey={projectKey}
              kind="UNAVAILABLE"
              requestId={context.requestId}
            />
          );
        }

        if (!economics && (route.outcome === "FAILED" || route.outcome === "ECONOMICS_FAILED")) {
          return (
            <ComparisonState
              closed={closed}
              locale={rawLocale}
              projectKey={projectKey}
              kind="ECONOMICS_FAILED"
              requestId={route.requestId}
            />
          );
        }

        const freshness = await services.getFreshness.check(context, structural.result, economics);
        const view = buildComparisonExperience({
          catalog: context.firmLists,
          stage4: structural.result,
          ...(economics ? { economics } : {}),
          locale: rawLocale,
          requestedSelectedProjectKeys: route.selectedProjectKeys,
        });
        const evidenceSelection = parseEvidenceSelection({
          comparisonRunId: route.comparisonRunId,
          economicsRunId: route.economicsRunId,
          evidenceMode: route.evidenceMode,
          evidenceClaimKey: route.evidenceClaimKey,
          evidenceCandidateProjectKey: route.evidenceCandidateProjectKey,
          evidenceFactorKey: route.evidenceFactorKey,
          evidenceSourceKey: route.evidenceSourceKey,
          evidenceConflictKey: route.evidenceConflictKey,
        });
        let evidencePanel: EvidencePanelOutcome | undefined;
        if (
          route.evidenceMode &&
          ((!actionRoute.proposalKey && !actionRoute.actionKey && !actionRoute.errorKind) ||
            actionRoute.evidenceActive)
        ) {
          evidencePanel = evidenceSelection
            ? await services.getEvidencePanel.execute(
                context,
                evidenceSelection,
                rawLocale,
                freshness,
              )
            : Object.freeze({ kind: "UNAVAILABLE" as const, requestId: context.requestId });
        }
        const actionServices = createInternalReviewServices();
        const [availability, prepared, receipt] = await Promise.all([
          economics && freshness.state === "CURRENT"
            ? actionServices.availability(context, projectKey, {
                comparisonRunId: structural.result.run.id,
                enrichmentRunId: economics.run.id,
              })
            : Promise.resolve(
                !structural.result.activeContext.activeQuoteVersionKey
                  ? ("NO_QUOTE_VERSION" as const)
                  : ("UNAVAILABLE" as const),
              ),
          actionRoute.proposalKey
            ? actionServices.reopenProposal(context, actionRoute.proposalKey, rawLocale)
            : Promise.resolve(undefined),
          actionRoute.actionKey
            ? actionServices.getReceipt(context, actionRoute.actionKey, rawLocale)
            : Promise.resolve(undefined),
        ]);
        const safeProposal =
          prepared?.kind === "PREPARED" &&
          (prepared.proposal.project.projectKey !== projectKey ||
            prepared.proposal.comparisonRunId !== route.comparisonRunId ||
            prepared.proposal.enrichmentRunId !== route.economicsRunId)
            ? { kind: "PROPOSAL_NOT_AUTHORIZED" as const, requestId: context.requestId }
            : prepared;
        const safeReceipt =
          receipt?.kind === "AVAILABLE" &&
          (receipt.receipt.project.projectKey !== projectKey ||
            receipt.receipt.comparisonRunId !== route.comparisonRunId ||
            receipt.receipt.enrichmentRunId !== route.economicsRunId)
            ? { kind: "ACTION_NOT_AUTHORIZED" as const, requestId: context.requestId }
            : receipt;
        return (
          <ComparisonExperienceClient
            closed={closed}
            view={view}
            freshness={freshness}
            evidencePanel={evidencePanel}
            evidenceSelection={evidenceSelection}
            evidenceReturnId={route.evidenceReturnId}
            internalReview={{
              locale: rawLocale,
              projectKey,
              comparisonRunId: route.comparisonRunId,
              enrichmentRunId: route.economicsRunId ?? "",
              canPrepare: availability === "READY",
              unavailableReason:
                availability === "NO_QUOTE_VERSION" || availability === "NOTHING_TO_REVIEW"
                  ? availability
                  : undefined,
              returnContext: reviewReturnContext(search),
              route: actionRoute,
              proposalOutcome: safeProposal,
              receiptOutcome: safeReceipt,
            }}
          />
        );
      })()}
    </div>
  );
}
