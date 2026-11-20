import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectClientRepositoryPort } from "@/repositories/ports/project-repository";

export type ProjectClientOption = Readonly<{ businessKey: string; name: string }>;
export type ProjectClientsOutcome =
  { kind: "AVAILABLE"; clients: readonly ProjectClientOption[] } | { kind: "UNAVAILABLE" };

export class ListProjectClients {
  constructor(private readonly clients: ProjectClientRepositoryPort) {}
  async execute(context: RuntimeContext): Promise<ProjectClientsOutcome> {
    if (!context.capabilities.has("project:create") || !context.capabilities.has("project:read"))
      return { kind: "UNAVAILABLE" };
    try {
      const rows = await this.clients.listActiveClients(context);
      return {
        kind: "AVAILABLE",
        clients: rows.map((row) => ({
          businessKey: row.businessKey,
          name: context.locale === "zh-TW" ? row.nameZhTw : row.nameEn,
        })),
      };
    } catch {
      return { kind: "UNAVAILABLE" };
    }
  }
}
