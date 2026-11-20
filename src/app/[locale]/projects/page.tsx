import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { ProjectList } from "@/components/projects/project-list";
import { loadDemoValueContext } from "@/lib/server/demo-value-context";
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
  const context = await loadDemoValueContext(rawLocale);
  const intelligence = buildHomeIntelligence(rawLocale, context);
  const outcome =
    context.projects.length > 0
      ? ({ kind: "AVAILABLE" as const, projects: context.projects })
      : ({ kind: "UNAVAILABLE" as const });

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
      {intelligence.memory.length ? (
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
            {intelligence.memory.map((project) => (
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
