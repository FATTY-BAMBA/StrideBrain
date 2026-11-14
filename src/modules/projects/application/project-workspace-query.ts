import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ProjectRepositoryPort,
  ProjectWorkspaceRecord,
} from "@/repositories/ports/project-repository";

export type ProjectWorkspaceOutcome =
  { kind: "AVAILABLE"; project: ProjectWorkspaceRecord } | { kind: "UNAVAILABLE" };

export class ProjectWorkspaceQuery {
  constructor(private readonly projects: ProjectRepositoryPort) {}

  async execute(context: RuntimeContext, projectKey: string): Promise<ProjectWorkspaceOutcome> {
    const project = await this.projects.getAuthorizedByBusinessKey(context, projectKey);
    return project ? { kind: "AVAILABLE", project } : { kind: "UNAVAILABLE" };
  }
}
