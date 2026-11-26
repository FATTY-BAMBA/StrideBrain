import { FoundationPage } from "@/components/ui/foundation-page";
import { getCatalog } from "@/modules/localization/catalog";
import { SiteAddressForm } from "@/components/projects/site-address-form";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { AssistantControl } from "@/components/assistant/assistant-control";
import { createAssistantControlServices } from "@/lib/server/assistant-services";
import { notFound } from "next/navigation";

import { ProjectWorkspaceOverview } from "@/components/projects/project-workspace-overview";
import { ProjectActions } from "@/components/internal-review/project-actions";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
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
    if (!context) {
      const catalog = getCatalog(rawLocale);
      return (
        <FoundationPage
          eyebrow={catalog["project.eyebrow"]}
          title={catalog["project.unavailableTitle"]}
          description={catalog["project.unavailableDescription"]}
        />
      );
    }
    if (context) {
      const outcome = await createProjectWorkspaceService().execute(
        { ...context, locale: rawLocale },
        projectKey,
      );
      if (outcome.kind === "AVAILABLE") {
        const [policy, address] = await Promise.all([
          createAssistantControlServices()
            .repository.jobPolicy(context, projectKey)
            .catch(() => null),
          createProjectWriteServices()
            .siteAddress.read(context, projectKey)
            .catch(() => null),
        ]);
        return (
          <div className="foundation-page">
            <ProjectWorkspaceOverview locale={rawLocale} workspace={outcome.workspace} />
            {address && <SiteAddressForm locale={rawLocale} value={address} />}
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

  notFound();
}
