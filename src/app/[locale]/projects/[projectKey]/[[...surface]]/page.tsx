import { notFound } from "next/navigation";

import { ProjectLocalNav } from "@/components/projects/project-local-nav";
import { ProjectWorkspaceOverview } from "@/components/projects/project-workspace-overview";
import { FoundationPage } from "@/components/ui/foundation-page";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";
import { projectNavigation, type ProjectSurfaceKey } from "@/modules/navigation/project-navigation";

type ProjectWorkspacePageProps = {
  params: Promise<{
    locale: string;
    projectKey: string;
    surface?: string[];
  }>;
};

function resolveSurface(segments: string[] | undefined): ProjectSurfaceKey | null {
  if (!segments?.length) return "overview";
  if (segments.length !== 1) return null;
  const item = projectNavigation.find((candidate) => candidate.segment === segments[0]);
  return item?.key ?? null;
}

export default async function ProjectWorkspacePage({ params }: ProjectWorkspacePageProps) {
  const { locale: rawLocale, projectKey, surface: surfaceSegments } = await params;
  if (!isSupportedLocale(rawLocale)) notFound();

  const surface = resolveSurface(surfaceSegments);
  if (!surface) notFound();

  const catalog = getCatalog(rawLocale);
  const surfaceLabel = catalog[`nav.${surface}`];

  if (surface === "overview") {
    const context = await resolveServerRuntimeContext();
    if (context) {
      const outcome = await createProjectWorkspaceService().execute(context, projectKey);
      if (outcome.kind === "AVAILABLE") {
        return (
          <div className="foundation-page">
            <ProjectLocalNav locale={rawLocale} projectKey={projectKey} labels={catalog} />
            <ProjectWorkspaceOverview locale={rawLocale} workspace={outcome.workspace} />
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
