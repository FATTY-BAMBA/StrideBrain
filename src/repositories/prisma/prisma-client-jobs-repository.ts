import type { PrismaClient } from "../../../.generated/prisma/client";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ClientJobsRepository } from "@/repositories/ports/client-jobs-repository";
export class PrismaClientJobsRepository implements ClientJobsRepository {
  constructor(private readonly db: PrismaClient) {}
  async list(context: RuntimeContext, clientKey: string, page: number) {
    if (!context.capabilities.has("client:read") || !context.capabilities.has("project:read"))
      return null;
    if (
      !(await this.db.membership.findFirst({
        where: {
          id: context.membershipId,
          organizationId: context.organizationId,
          personId: context.userId,
          active: true,
        },
        select: { id: true },
      }))
    )
      return null;
    const client = await this.db.client.findFirst({
      where: { organizationId: context.organizationId, businessKey: clientKey },
      select: { id: true },
    });
    if (!client) return null;
    const rows = await this.db.project.findMany({
      where: {
        organizationId: context.organizationId,
        clientId: client.id,
        deletedAt: null,
        ...(context.role === "ORGANIZATION_ADMIN"
          ? {}
          : { id: { in: [...(context.assignedProjectIds ?? [])] } }),
      },
      orderBy: { businessKey: "asc" },
      skip: (page - 1) * 50,
      take: 51,
      select: { businessKey: true, nameEn: true, nameZhTw: true, stage: true },
    });
    return {
      jobs: rows.slice(0, 50).map((row) => ({
        businessKey: row.businessKey,
        stage: row.stage,
        name: context.locale === "zh-TW" ? row.nameZhTw : row.nameEn,
      })),
      hasMore: rows.length > 50,
    };
  }
}
