import { AuthorizationService } from "@/modules/authorization/authorization-service";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  LatestProjectComparison,
  LatestProjectComparisonRepositoryPort,
} from "@/repositories/ports/latest-project-comparison-repository";
export type PrismaLatestProjectComparisonDatabase = {
  comparisonRun: {
    findFirst(
      args: unknown,
    ): Promise<{
      id: string;
      organizationId: string;
      activeProjectId: string;
      economicsEnrichment: readonly { id: string }[];
    } | null>;
  };
};
export class PrismaLatestProjectComparisonRepository implements LatestProjectComparisonRepositoryPort {
  constructor(
    private readonly database: PrismaLatestProjectComparisonDatabase,
    private readonly authorization = new AuthorizationService(),
  ) {}
  async findLatest(
    context: RuntimeContext,
    projectId: string,
  ): Promise<LatestProjectComparison | null> {
    if (!this.authorization.canRunComparison(context, projectId).allowed) return null;
    const row = await this.database.comparisonRun.findFirst({
      where: {
        organizationId: context.organizationId,
        activeProjectId: projectId,
        status: "COMPLETED",
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        organizationId: true,
        activeProjectId: true,
        economicsEnrichment: {
          where: {
            organizationId: context.organizationId,
            activeProjectId: projectId,
            status: "COMPLETED",
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          select: { id: true },
        },
      },
    });
    if (!row || row.organizationId !== context.organizationId || row.activeProjectId !== projectId)
      return null;
    return {
      comparisonRunId: row.id,
      ...(row.economicsEnrichment[0] ? { enrichmentRunId: row.economicsEnrichment[0].id } : {}),
    };
  }
}
