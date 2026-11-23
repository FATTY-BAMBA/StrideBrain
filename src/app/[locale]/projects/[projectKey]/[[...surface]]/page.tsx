import { AssistantControl } from "@/components/assistant/assistant-control";
import { createAssistantControlServices } from "@/lib/server/assistant-services";
import { notFound } from "next/navigation";

import { ProjectLocalNav } from "@/components/projects/project-local-nav";
import { ProjectWorkspaceOverview } from "@/components/projects/project-workspace-overview";
import { ProjectActions } from "@/components/internal-review/project-actions";
import { FoundationPage } from "@/components/ui/foundation-page";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";
import { projectNavigation, type ProjectSurfaceKey } from "@/modules/navigation/project-navigation";
import { parseInternalReviewRoute } from "@/modules/internal-review-experience/route-state";

type ProjectWorkspacePageProps = {
  params: Promise<{
    locale: string;
    projectKey: string;
    surface?: string[];
  }>;
  searchParams: Promise<Readonly<Record<string, string | readonly string[] | undefined>>>;
};

function resolveSurface(segments: string[] | undefined): ProjectSurfaceKey | null {
  if (!segments?.length) return "overview";
  if (segments.length !== 1) return null;
  const item = projectNavigation.find((candidate) => candidate.segment === segments[0]);
  return item?.key ?? null;
}

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: ProjectWorkspacePageProps) {
  const { locale: rawLocale, projectKey, surface: surfaceSegments } = await params;
  if (!isSupportedLocale(rawLocale)) notFound();

  const surface = resolveSurface(surfaceSegments);
  if (!surface) notFound();

  const catalog = getCatalog(rawLocale);
  const surfaceLabel = catalog[`nav.${surface}`];

  if (surface === "actions") {
    const context = await resolveServerRuntimeContext();
    const route = parseInternalReviewRoute(await searchParams);
    const services = context ? createInternalReviewServices() : null;
    const [listOutcome, receiptOutcome] =
      context && services
        ? await Promise.all([
            services.listProjectActions(context, projectKey, rawLocale),
            route.actionKey
              ? services.getReceipt(context, route.actionKey, rawLocale)
              : Promise.resolve(undefined),
          ])
        : [{ kind: "ACTION_NOT_AUTHORIZED" as const, requestId: "" }, undefined];
    const safeReceipt =
      receiptOutcome?.kind === "AVAILABLE" &&
      receiptOutcome.receipt.project.projectKey !== projectKey
        ? { kind: "ACTION_NOT_AUTHORIZED" as const, requestId: context?.requestId ?? "" }
        : receiptOutcome;
    return (
      <div className="foundation-page">
        <ProjectLocalNav locale={rawLocale} projectKey={projectKey} labels={catalog} />
        <ProjectActions
          locale={rawLocale}
          projectKey={projectKey}
          listOutcome={listOutcome}
          receiptOutcome={safeReceipt}
          route={route}
        />
      </div>
    );
  }

  if (surface === "overview") {
    const context = await resolveServerRuntimeContext();
    if (context) {
      const outcome = await createProjectWorkspaceService().execute(
        { ...context, locale: rawLocale },
        projectKey,
      );
      if (outcome.kind === "AVAILABLE") {
        const policy = await createAssistantControlServices()
          .repository.jobPolicy(context, projectKey)
          .catch(() => null);
        return (
          <div className="foundation-page">
            <ProjectLocalNav locale={rawLocale} projectKey={projectKey} labels={catalog} />
            <ProjectWorkspaceOverview locale={rawLocale} workspace={outcome.workspace} />
            {policy && (
              <AssistantControl
                locale={rawLocale}
                enabled={policy.excluded}
                projectKey={projectKey}
                canManage={context.capabilities.has("project:update")}
              />
            )}
          </div>
        );
      }
    }
  }

  return (
    <FoundationPage
      eyebrow={catalog["project.eyebrow"]}
      title={catalog["project.unavailableTitle"]}
      description={catalog["project.unavailableDescription"]}
    >
      <ProjectLocalNav locale={rawLocale} projectKey={projectKey} labels={catalog} />
      <section className="project-unavailable" aria-labelledby="project-state-title">
        <div>
          <span className="state-label">{catalog["state.notConnected"]}</span>
          <h2 id="project-state-title">{surfaceLabel}</h2>
          <p>{catalog["project.foundationDescription"]}</p>
        </div>
        <dl>
          <div>
            <dt>{catalog["project.requestedKey"]}</dt>
            <dd>
              <code>{projectKey}</code>
            </dd>
          </div>
          <div>
            <dt>{rawLocale === "zh-TW" ? "目前區域" : "Current area"}</dt>
            <dd>{surfaceLabel}</dd>
          </div>
        </dl>
      </section>
    </FoundationPage>
  );
}
