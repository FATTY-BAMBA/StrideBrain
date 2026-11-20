import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { ProjectList } from "@/components/projects/project-list";
import {
  createProjectListService,
  createProjectWorkspaceService,
} from "@/lib/server/project-workspace-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import type { ProjectListOutcome } from "@/modules/projects/application/list-authorized-projects";
import { buildHomeIntelligence } from "@/modules/home-intelligence/home-intelligence";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

type ProjectsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) notFound();

  const catalog = getCatalog(rawLocale);
  let outcome: ProjectListOutcome = { kind: "UNAVAILABLE" };
  let memory: ReturnType<typeof buildHomeIntelligence>["memory"] = [];
  try {
    const identity = await resolveServerRuntimeContext();
    if (identity) {
      const runtime = { ...identity, locale: rawLocale };
      outcome = await createProjectListService().execute(runtime);
      if (outcome.kind === "AVAILABLE" && identity.dataMode === "DEMO_SYNTHETIC") {
        const active = outcome.projects.find((project) => project.active);
        if (active) {
          try {
            const result = await createProjectWorkspaceService().execute(
              runtime,
              active.businessKey,
            );
            if (result.kind === "AVAILABLE") {
              memory = buildHomeIntelligence(rawLocale, {
                projects: outcome.projects,
                workspace: result.workspace,
              }).memory;
            }
          } catch {
            // Optional memory enrichment never hides an authorized project list.
          }
        }
      }
    }
  } catch {
    // Failed identity/list reads are non-disclosing.
  }

  return (
    <FoundationPage
      eyebrow={catalog["projects.eyebrow"]}
      title={catalog["projects.title"]}
      description={
        rawLocale === "zh-TW"
          ? "目前工作與公司過往專案，都在同一個地方。"
          : "Current work and the company’s completed project memory in one place."
      }
    >
      <ProjectList locale={rawLocale} outcome={outcome} />
      {memory.length ? (
        <section aria-labelledby="project-memory-title" style={{ marginTop: 32 }}>
          <h2 id="project-memory-title" style={{ fontSize: "1.1rem", marginBottom: 8 }}>
            {rawLocale === "zh-TW" ? "已完成專案" : "Completed project memory"}
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: 14 }}>
            {rawLocale === "zh-TW"
              ? "這些專案會成為比較與判斷的歷史依據。"
              : "These projects form the historical basis for comparisons and decisions."}
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 10,
            }}
          >
            {memory.map((project) => (
              <li
                key={project.name}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-sm)",
                  padding: 14,
                  background: "var(--surface)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span>{project.name}</span>
                {project.score ? (
                  <small style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {project.score}% {rawLocale === "zh-TW" ? "相似度" : "match"}
                  </small>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </FoundationPage>
  );
}
