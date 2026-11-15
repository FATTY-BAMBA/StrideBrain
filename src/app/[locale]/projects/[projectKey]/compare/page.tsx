import { notFound } from "next/navigation";

import { ComparisonExperienceClient } from "@/components/comparisons/comparison-experience-client";
import { ComparisonStart } from "@/components/comparisons/comparison-start";
import { ComparisonState } from "@/components/comparisons/comparison-state";
import { ProjectLocalNav } from "@/components/projects/project-local-nav";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { buildComparisonExperience } from "@/modules/comparison-experience/build-comparison-experience";
import { parseComparisonRouteSearch } from "@/modules/comparison-experience/route-state";
import { parseEvidenceSelection } from "@/modules/evidence-panel/route-state";
import type { EvidencePanelOutcome } from "@/modules/evidence-panel/contracts";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

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

  const catalog = getCatalog(rawLocale);
  const route = parseComparisonRouteSearch(await searchParams);
  const context = await resolveServerRuntimeContext();

  return (
    <div className="foundation-page">
      <ProjectLocalNav locale={rawLocale} projectKey={projectKey} labels={catalog} />
      {await (async () => {
        if (!context) {
          return (
            <ComparisonState locale={rawLocale} projectKey={projectKey} kind="SESSION_REQUIRED" />
          );
        }

        if (!route.comparisonRunId) {
          const stateKind = safeStateKind(route.outcome);
          if (stateKind) {
            return (
              <ComparisonState
                locale={rawLocale}
                projectKey={projectKey}
                kind={stateKind}
                requestId={route.requestId}
                missingFields={route.missingFields}
              />
            );
          }
          return <ComparisonStart locale={rawLocale} projectKey={projectKey} />;
        }

        const services = createComparisonServices();
        const structural = await services.getComparison.execute(context, route.comparisonRunId);
        if (structural.kind !== "COMPLETE") {
          return (
            <ComparisonState
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
              locale={rawLocale}
              projectKey={projectKey}
              kind="UNAVAILABLE"
              requestId={context.requestId}
            />
          );
        }

        const view = buildComparisonExperience({
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
        if (route.evidenceMode) {
          evidencePanel = evidenceSelection
            ? await services.getEvidencePanel.execute(context, evidenceSelection, rawLocale)
            : Object.freeze({ kind: "UNAVAILABLE" as const, requestId: context.requestId });
        }
        return (
          <ComparisonExperienceClient
            view={view}
            evidencePanel={evidencePanel}
            evidenceReturnId={route.evidenceReturnId}
          />
        );
      })()}
    </div>
  );
}
