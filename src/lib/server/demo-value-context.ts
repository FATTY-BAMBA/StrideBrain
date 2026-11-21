import { createComparisonServices } from "./comparison-services";
import type { HomeComparisonOutcome } from "@/modules/home-intelligence/application/get-home-comparison";
import type { Locale } from "@/modules/localization/config";
import type { ProjectEntryDTO } from "@/modules/projects/application/list-authorized-projects";
import type { ProjectWorkspaceDTO } from "@/modules/projects/domain/project-workspace";
import { resolveServerRuntimeContext } from "./runtime-context";
import {
  createProjectListService,
  createProjectWorkspaceService,
} from "./project-workspace-services";

export type DemoValueContext = Readonly<{
  projects: readonly ProjectEntryDTO[];
  workspace: ProjectWorkspaceDTO | null;
  intelligence?: HomeComparisonOutcome | null | undefined;
}>;

/** Read-only presentation composition. A URL can select only an already-authorized project. */
export async function loadDemoValueContext(
  locale: Locale,
  requestedProject?: string,
): Promise<DemoValueContext> {
  try {
    const identity = await resolveServerRuntimeContext();
    if (!identity) return { projects: [], workspace: null };
    const context = { ...identity, locale };
    const list = await createProjectListService().execute(context);
    if (list.kind !== "AVAILABLE") return { projects: [], workspace: null };
    const project = requestedProject
      ? list.projects.find((item) => item.businessKey === requestedProject)
      : (list.projects.find((item) => item.active) ?? list.projects[0]);
    if (!project) return { projects: list.projects, workspace: null };
    const result = await createProjectWorkspaceService().execute(context, project.businessKey);
    let intelligence: HomeComparisonOutcome | null = null;
    if (result.kind === "AVAILABLE") {
      try {
        intelligence = await createComparisonServices().getHomeComparison.execute(
          context,
          result.workspace.project.businessKey,
        );
      } catch {
        intelligence = { kind: "UNAVAILABLE" };
      }
    }
    return {
      projects: list.projects,
      workspace: result.kind === "AVAILABLE" ? result.workspace : null,
      intelligence,
    };
  } catch {
    return { projects: [], workspace: null };
  }
}
