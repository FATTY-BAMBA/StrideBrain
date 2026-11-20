import { validateStageUpdate } from "@/modules/projects/domain/job-input";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ProjectWriteRepositoryPort,
  UpdateProjectStageResult,
} from "@/repositories/ports/project-repository";

export class UpdateProjectStage {
  constructor(private readonly projects: ProjectWriteRepositoryPort) {}
  async execute(
    context: RuntimeContext,
    raw: unknown,
  ): Promise<UpdateProjectStageResult | { kind: "INVALID" | "FAILED" }> {
    if (
      !context.capabilities.has("project:update") ||
      !context.capabilities.has("project:read") ||
      context.dataMode !== "DEMO_SYNTHETIC"
    )
      return { kind: "UNAVAILABLE" };
    const input = validateStageUpdate(raw);
    if (!input) return { kind: "INVALID" };
    try {
      return await this.projects.updateStageWithAudit(context, input);
    } catch {
      return { kind: "FAILED" };
    }
  }
}
