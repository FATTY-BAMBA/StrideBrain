import { AuthorizationService } from "@/modules/authorization/authorization-service";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectListRepositoryPort } from "@/repositories/ports/project-list-repository";

export type ProjectEntryDTO = Readonly<{
  businessKey: string;
  name: string;
  active: boolean;
}>;

export type ProjectListOutcome =
  | Readonly<{ kind: "AVAILABLE"; projects: readonly ProjectEntryDTO[] }>
  | Readonly<{ kind: "UNAVAILABLE" }>;

export class ListAuthorizedProjects {
  constructor(
    private readonly projects: ProjectListRepositoryPort,
    private readonly authorization = new AuthorizationService(),
  ) {}

  async execute(context: RuntimeContext): Promise<ProjectListOutcome> {
    if (!context.capabilities.has("project:read")) return { kind: "UNAVAILABLE" };

    try {
      const rows = await this.projects.listReadableProjects(context);
      const projects = rows
        .filter(
          (row) =>
            row.organizationId === context.organizationId &&
            this.authorization.canReadProject(context, row.id).allowed,
        )
        .map((row) =>
          Object.freeze({
            businessKey: row.businessKey,
            name: context.locale === "zh-TW" ? row.nameZhTw : row.nameEn,
            active: row.status === "ACTIVE",
          }),
        );
      return Object.freeze({ kind: "AVAILABLE", projects: Object.freeze(projects) });
    } catch {
      return { kind: "UNAVAILABLE" };
    }
  }
}
