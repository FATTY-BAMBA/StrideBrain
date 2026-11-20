import { validateCreateProject, type JobErrors } from "@/modules/projects/domain/job-input";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ProjectWriteRepositoryPort,
  CreateProjectResult,
} from "@/repositories/ports/project-repository";

export type CreateProjectOutcome =
  CreateProjectResult | { kind: "INVALID"; errors: JobErrors } | { kind: "FAILED" };
export class CreateProject {
  constructor(private readonly projects: ProjectWriteRepositoryPort) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<CreateProjectOutcome> {
    if (
      !context.capabilities.has("project:create") ||
      !context.capabilities.has("project:read") ||
      context.dataMode !== "DEMO_SYNTHETIC"
    )
      return { kind: "UNAVAILABLE" };
    const validation = validateCreateProject(raw);
    if (validation.kind === "INVALID") return validation;
    try {
      return await this.projects.createWithAudit(context, validation.input);
    } catch {
      return { kind: "FAILED" };
    }
  }
}
