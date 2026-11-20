import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ProjectListRecord,
  ProjectListRepositoryPort,
} from "@/repositories/ports/project-list-repository";

export type PrismaProjectListReader = {
  project: {
    findMany(args: {
      where: {
        organizationId: string;
        deletedAt: null;
        id?: { in: string[] };
      };
      orderBy: [{ status: "asc" }, { businessKey: "asc" }];
      select: {
        id: true;
        organizationId: true;
        businessKey: true;
        nameEn: true;
        nameZhTw: true;
        status: true;
        stage: true;
      };
    }): Promise<ProjectListRecord[]>;
  };
};

export class PrismaProjectListRepository implements ProjectListRepositoryPort {
  constructor(private readonly database: PrismaProjectListReader) {}

  async listReadableProjects(context: RuntimeContext): Promise<readonly ProjectListRecord[]> {
    if (!context.capabilities.has("project:read")) return [];
    const organizationWide = context.role === "ORGANIZATION_ADMIN";
    const assignedIds = [...(context.assignedProjectIds ?? [])];
    if (!organizationWide && assignedIds.length === 0) return [];

    // Match the existing workspace read boundary before fetching names. The
    // application also applies AuthorizationService before creating any DTO.
    return this.database.project.findMany({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        ...(organizationWide ? {} : { id: { in: assignedIds } }),
      },
      orderBy: [{ status: "asc" }, { businessKey: "asc" }],
      select: {
        id: true,
        organizationId: true,
        businessKey: true,
        nameEn: true,
        nameZhTw: true,
        status: true,
        stage: true,
      },
    });
  }
}
