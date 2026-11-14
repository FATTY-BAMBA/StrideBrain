import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ProjectRepositoryPort,
  ProjectWorkspaceRecord,
} from "@/repositories/ports/project-repository";

type PrismaProjectRow = {
  id: string;
  businessKey: string;
  organizationId: string;
  updatedAt: Date;
};

export type PrismaProjectReader = {
  project: {
    findFirst(args: {
      where: {
        organizationId: string;
        businessKey: string;
        deletedAt: null;
      };
      select: {
        id: true;
        businessKey: true;
        organizationId: true;
        updatedAt: true;
      };
    }): Promise<PrismaProjectRow | null>;
  };
};

/**
 * Stage 1 repository foundation.
 *
 * The adapter receives a trusted RuntimeContext and always applies the
 * organization boundary in the database query. Business keys supplied by a
 * route or model never select a tenant by themselves.
 */
export class PrismaProjectRepository implements ProjectRepositoryPort {
  constructor(private readonly database: PrismaProjectReader) {}

  async getAuthorizedByBusinessKey(
    context: RuntimeContext,
    projectKey: string,
  ): Promise<ProjectWorkspaceRecord | null> {
    if (!context.capabilities.has("project:read")) return null;

    const row = await this.database.project.findFirst({
      where: {
        organizationId: context.organizationId,
        businessKey: projectKey,
        deletedAt: null,
      },
      select: {
        id: true,
        businessKey: true,
        organizationId: true,
        updatedAt: true,
      },
    });

    if (!row) return null;
    if (
      context.assignedProjectIds &&
      !context.assignedProjectIds.has(row.id) &&
      context.role !== "ORGANIZATION_ADMIN" &&
      context.role !== "FINANCIAL_REVIEWER"
    ) {
      return null;
    }

    return {
      id: row.id,
      businessKey: row.businessKey,
      organizationId: row.organizationId,
      recordVersion: row.updatedAt.getTime(),
    };
  }
}
