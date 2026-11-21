import { StageCounts } from "@/components/home-desk/stage-counts";
import { inStageGroup, parseStageGroup, stageGroups } from "@/modules/projects/domain/stage-groups";
import { homeDeskCopy } from "@/modules/localization/home-desk";
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

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const catalog = getCatalog(locale);
  const copy = jobsCopy(locale);
  const search = await searchParams;
  const activeGroup = parseStageGroup(search?.group);
  const homeCopy = homeDeskCopy(locale);
  let outcome: ProjectListOutcome = { kind: "UNAVAILABLE" };
  let canCreate = false;
  let canUpdate = false;
  try {
    const identity = await resolveServerRuntimeContext();
    if (identity) {
      outcome = await createProjectListService().execute({ ...identity, locale });
      const readable = identity.capabilities.has("project:read");
      canCreate = readable && identity.capabilities.has("project:create");
      canUpdate = readable && identity.capabilities.has("project:update");
    }
  } catch {
    /* Identity/list failures remain non-disclosing. */
  }
  const counts = stageGroups.map((group) => ({
    key: group.key,
    count:
      outcome.kind === "AVAILABLE"
        ? outcome.projects.filter((job) => inStageGroup(job.stage, group.key)).length
        : 0,
  }));
  const filtered =
    outcome.kind === "AVAILABLE" && activeGroup
      ? {
          ...outcome,
          projects: outcome.projects.filter((job) => inStageGroup(job.stage, activeGroup)),
        }
      : outcome;
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
      {outcome.kind === "AVAILABLE" ? (
        <>
          <StageCounts locale={locale} counts={counts} active={activeGroup} />
          {activeGroup ? (
            <Link href={`/${locale}/projects` as Route}>{homeCopy.allJobs}</Link>
          ) : null}
          {search?.group !== undefined && !activeGroup ? (
            <p role="status">{homeCopy.invalidGroup}</p>
          ) : null}
        </>
      ) : null}
      <ProjectList locale={locale} outcome={filtered} canUpdate={canUpdate} />
    </FoundationPage>
  );
}
