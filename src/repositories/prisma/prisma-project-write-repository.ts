import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient, Prisma } from "../../../.generated/prisma/client";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { CreateProjectInput, UpdateStageInput } from "@/modules/projects/domain/job-input";
import { JOB_FIELDS, validateStageUpdate } from "@/modules/projects/domain/job-input";
import { categoryLabel } from "@/modules/localization/jobs";
import type {
  CreateProjectResult,
  ProjectClientRepositoryPort,
  ProjectWriteRepositoryPort,
  UpdateProjectStageResult,
} from "@/repositories/ports/project-repository";

function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
}

export class PrismaProjectWriteRepository
  implements ProjectWriteRepositoryPort, ProjectClientRepositoryPort
{
  constructor(private readonly database: PrismaClient) {}

  async listActiveClients(context: RuntimeContext) {
    if (!context.capabilities.has("project:create") || !context.capabilities.has("project:read"))
      return [];
    return this.database.client.findMany({
      where: { organizationId: context.organizationId, active: true },
      orderBy: { businessKey: "asc" },
      select: { businessKey: true, nameEn: true, nameZhTw: true },
    });
  }

  private async transaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
    retryUnique = false,
  ): Promise<T> {
    // Serializable retries handle concurrent client/key or stage changes without
    // leaving a client, assignment, project, or audit outside the transaction.
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.database.$transaction(work, {
          isolationLevel: "Serializable",
          timeout: 10_000,
        });
      } catch (error) {
        if (
          attempt >= 2 ||
          (errorCode(error) !== "P2034" && !(retryUnique && errorCode(error) === "P2002"))
        )
          throw error;
      }
    }
  }

  async createWithAudit(
    context: RuntimeContext,
    input: CreateProjectInput,
  ): Promise<CreateProjectResult> {
    if (!context.capabilities.has("project:create") || !context.capabilities.has("project:read"))
      return { kind: "UNAVAILABLE" };
    const organizationId = context.organizationId;
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify(
          [...JOB_FIELDS, "commercialCategoryIds" as const].map((key) => [key, input[key]]),
        ),
      )
      .digest("hex");
    try {
      return await this.transaction(async (tx): Promise<CreateProjectResult> => {
        const member = await tx.membership.findFirst({
          where: { id: context.membershipId, organizationId, active: true },
          select: { id: true },
        });
        if (!member) return { kind: "UNAVAILABLE" };
        const replay = await tx.auditEvent.findUnique({
          where: {
            organizationId_idempotencyKey: { organizationId, idempotencyKey: input.idempotencyKey },
          },
        });
        if (replay) {
          const payload = replay.payload as Record<string, unknown>;
          if (
            replay.actorMembershipId !== context.membershipId ||
            replay.eventType !== "PROJECT_CREATED" ||
            replay.result !== "CREATED" ||
            payload.inputFingerprint !== fingerprint
          )
            return { kind: "CONFLICT" };
          const original = await tx.project.findFirst({
            where: {
              organizationId,
              businessKey: input.businessKey,
              deletedAt: null,
              ...(context.role === "ORGANIZATION_ADMIN"
                ? {}
                : {
                    assignments: { some: { organizationId, membershipId: context.membershipId } },
                  }),
            },
            select: { id: true, businessKey: true },
          });
          return original && original.id === payload.projectId
            ? { kind: "CREATED", businessKey: original.businessKey }
            : { kind: "UNAVAILABLE" };
        }
        const duplicate = await tx.project.findUnique({
          where: { organizationId_businessKey: { organizationId, businessKey: input.businessKey } },
          select: { id: true },
        });
        if (duplicate) return { kind: "DUPLICATE" };
        let client = await tx.client.findUnique({
          where: {
            organizationId_businessKey: { organizationId, businessKey: input.clientBusinessKey },
          },
          select: { id: true, active: true },
        });
        if (input.clientMode === "existing" && !client?.active)
          return { kind: "CLIENT_UNAVAILABLE" };
        if (input.clientMode === "new") {
          if (client) return { kind: "CLIENT_DUPLICATE" };
          client = await tx.client.create({
            data: {
              id: randomUUID(),
              organizationId,
              businessKey: input.clientBusinessKey,
              nameEn: input.clientName,
              nameZhTw: input.clientName,
              clientType: input.clientType,
            },
            select: { id: true, active: true },
          });
        }
        if (!client) return { kind: "CLIENT_UNAVAILABLE" };
        const projectId = randomUUID();
        await tx.project.create({
          data: {
            id: projectId,
            organizationId,
            clientId: client.id,
            businessKey: input.businessKey,
            nameEn: input.name,
            nameZhTw: input.name,
            comparisonClass: input.comparisonClass,
            subtype: input.subtype,
            areaQuantity: input.areaQuantity,
            areaUnit: input.areaUnit,
            currency: input.currency,
            locationCity: input.locationCity,
            locationDistrict: input.locationDistrict || null,
            commercialCategoryIds: [...input.commercialCategoryIds],
            status: "ACTIVE",
            stage: "QUOTE_REVIEW",
            metadataAuthority: "HUMAN_REVIEWED",
            dataClassification: context.dataMode,
            scopes: {
              create: input.scopeCategoryIds.map((categoryId) => ({
                id: randomUUID(),
                organizationId,
                categoryId,
                labelEn: categoryLabel("en", categoryId),
                labelZhTw: categoryLabel("zh-TW", categoryId),
                sourceState: "HUMAN_REVIEWED",
              })),
            },
            assignments: {
              create: {
                id: randomUUID(),
                organizationId,
                membershipId: context.membershipId,
                canReadActuals: false,
                canCreateAction: context.capabilities.has("action:internal-review:create"),
              },
            },
          },
        });
        await tx.auditEvent.create({
          data: {
            id: randomUUID(),
            organizationId,
            actorMembershipId: context.membershipId,
            eventType: "PROJECT_CREATED",
            requestId: context.requestId,
            idempotencyKey: input.idempotencyKey,
            payload: {
              projectId,
              businessKey: input.businessKey,
              clientId: client.id,
              stage: "QUOTE_REVIEW",
              metadataAuthority: "HUMAN_REVIEWED",
              inputFingerprint: fingerprint,
            },
            result: "CREATED",
          },
        });
        return { kind: "CREATED", businessKey: input.businessKey };
      }, true);
    } catch (error) {
      // Unique constraints are the final concurrent-creation guard. No raw SQL
      // diagnostics or other tenant's key ownership crosses this boundary.
      if (errorCode(error) === "P2002") return { kind: "DUPLICATE" };
      throw error;
    }
  }

  async updateStageWithAudit(
    context: RuntimeContext,
    input: UpdateStageInput,
  ): Promise<UpdateProjectStageResult> {
    if (!context.capabilities.has("project:update") || !context.capabilities.has("project:read"))
      return { kind: "UNAVAILABLE" };
    if (!validateStageUpdate(input)) return { kind: "INVALID" };
    const organizationId = context.organizationId;
    try {
      return await this.transaction(async (tx): Promise<UpdateProjectStageResult> => {
        const row = await tx.project.findFirst({
          where: {
            organizationId,
            businessKey: input.businessKey,
            deletedAt: null,
            ...(context.role === "ORGANIZATION_ADMIN"
              ? {}
              : {
                  assignments: {
                    some: {
                      organizationId,
                      membershipId: context.membershipId,
                      membership: { organizationId, active: true },
                    },
                  },
                }),
          },
          select: { id: true, stage: true, updatedAt: true },
        });
        if (!row) return { kind: "UNAVAILABLE" };
        const member = await tx.membership.findFirst({
          where: { id: context.membershipId, organizationId, active: true },
          select: { id: true },
        });
        if (!member) return { kind: "UNAVAILABLE" };
        const replay = await tx.auditEvent.findUnique({
          where: {
            organizationId_idempotencyKey: { organizationId, idempotencyKey: input.idempotencyKey },
          },
        });
        if (replay) {
          const payload = replay.payload as Record<string, unknown>;
          return {
            kind:
              replay.actorMembershipId === context.membershipId &&
              replay.eventType === "PROJECT_STAGE_UPDATED" &&
              payload.projectId === row.id &&
              payload.stage === input.stage &&
              payload.previousStage === input.expectedStage
                ? "UPDATED"
                : "CONFLICT",
          };
        }
        if (row.stage !== input.expectedStage) return { kind: "CONFLICT" };
        const updated = await tx.project.updateMany({
          where: {
            id: row.id,
            organizationId,
            deletedAt: null,
            stage: input.expectedStage,
            updatedAt: row.updatedAt,
          },
          data: { stage: input.stage },
        });
        if (updated.count !== 1) return { kind: "CONFLICT" };
        await tx.auditEvent.create({
          data: {
            id: randomUUID(),
            organizationId,
            actorMembershipId: context.membershipId,
            eventType: "PROJECT_STAGE_UPDATED",
            requestId: context.requestId,
            idempotencyKey: input.idempotencyKey,
            payload: {
              projectId: row.id,
              businessKey: input.businessKey,
              previousStage: row.stage,
              stage: input.stage,
            },
            result: "UPDATED",
          },
        });
        return { kind: "UPDATED" };
      });
    } catch (error) {
      if (errorCode(error) === "P2002" || errorCode(error) === "P2034") return { kind: "CONFLICT" };
      throw error;
    }
  }
}
