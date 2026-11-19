import { notFound } from "next/navigation";

import { FoundationPage } from "@/components/ui/foundation-page";
import { ProjectList } from "@/components/projects/project-list";
import { createProjectListService } from "@/lib/server/project-workspace-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import type { ProjectListOutcome } from "@/modules/projects/application/list-authorized-projects";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

type ProjectsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) {
    notFound();
  }

  const catalog = getCatalog(rawLocale);
  let outcome: ProjectListOutcome = { kind: "UNAVAILABLE" };
  try {
    const context = await resolveServerRuntimeContext();
    if (context) {
      outcome = await createProjectListService().execute({ ...context, locale: rawLocale });
    }
  } catch {
    // Session/storage failure uses the same non-disclosing unavailable surface.
  }

  return (
    <FoundationPage
      eyebrow={catalog["projects.eyebrow"]}
      title={catalog["projects.title"]}
      description={catalog["projects.description"]}
    >
      <ProjectList locale={rawLocale} outcome={outcome} />
    </FoundationPage>
  );
}
