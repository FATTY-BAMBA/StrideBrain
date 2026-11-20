import type { Route } from "next";
import styles from "@/components/projects/job-form.module.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { ProjectList } from "@/components/projects/project-list";
import { createProjectListService } from "@/lib/server/project-workspace-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import type { ProjectListOutcome } from "@/modules/projects/application/list-authorized-projects";
import { getCatalog } from "@/modules/localization/catalog";
import { jobsCopy } from "@/modules/localization/jobs";
import { isSupportedLocale } from "@/modules/localization/config";

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const catalog = getCatalog(locale);
  const copy = jobsCopy(locale);
  let outcome: ProjectListOutcome = { kind: "UNAVAILABLE" };
  let canCreate = false;
  let canUpdate = false;
  try {
    const identity = await resolveServerRuntimeContext();
    if (identity) {
      outcome = await createProjectListService().execute({ ...identity, locale });
      const readable =
        identity.dataMode === "DEMO_SYNTHETIC" && identity.capabilities.has("project:read");
      canCreate = readable && identity.capabilities.has("project:create");
      canUpdate = readable && identity.capabilities.has("project:update");
    }
  } catch {
    /* Identity/list failures remain non-disclosing. */
  }
  return (
    <FoundationPage
      eyebrow={catalog["projects.eyebrow"]}
      title={catalog["projects.title"]}
      description={copy.groupDescription}
    >
      {canCreate ? (
        <p style={{ marginBottom: 24 }}>
          <Link className={styles.primary} href={`/${locale}/projects/new` as Route}>
            {copy.newJob}
          </Link>
        </p>
      ) : null}
      <ProjectList locale={locale} outcome={outcome} canUpdate={canUpdate} />
    </FoundationPage>
  );
}
