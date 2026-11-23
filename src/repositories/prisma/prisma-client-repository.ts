import { createHash, randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "../../../.generated/prisma/client";
import {
  CLIENT_DETAIL_FIELDS,
  validateClientSearch,
  validateClientUpdate,
  type UpdateClientInput,
} from "@/modules/clients/domain/client-input";
import { BUSINESS_KEY } from "@/modules/projects/domain/job-input";
import type { Capability, RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ClientRepositoryPort,
  ClientUpdateResult,
} from "@/repositories/ports/client-repository";

const summarySelect = {
  businessKey: true,
  nameEn: true,
  nameZhTw: true,
  clientType: true,
  active: true,
} as const;
const detailsSelect = {
  ...summarySelect,
  contactPerson: true,
  phone: true,
  email: true,
  address: true,
  taxId: true,
  note: true,
  updatedAt: true,
} as const;
type Database = PrismaClient | Prisma.TransactionClient;
const code = (error: unknown) =>
  error && typeof error === "object" && "code" in error ? String(error.code) : undefined;

export class PrismaClientRepository implements ClientRepositoryPort {
  constructor(private readonly database: PrismaClient) {}
  private async authorized(database: Database, context: RuntimeContext, capability: Capability) {
    if (!context.capabilities.has(capability)) return false;
    return !!(await database.membership.findFirst({
      where: {
        id: context.membershipId,
        organizationId: context.organizationId,
        personId: context.userId,
        active: true,
      },
      select: { id: true },
    }));
  }
  async list(context: RuntimeContext, raw: Readonly<{ search: string; page: number }>) {
    if (!(await this.authorized(this.database, context, "client:read"))) return null;
    const input = validateClientSearch(raw);
    if (!input) return null;
    const rows = await this.database.client.findMany({
      where: {
        organizationId: context.organizationId,
        ...(input.search
          ? {
              OR: [
                { nameEn: { contains: input.search, mode: "insensitive" as const } },
                { nameZhTw: { contains: input.search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [
        { [context.locale === "zh-TW" ? "nameZhTw" : "nameEn"]: "asc" },
        { businessKey: "asc" },
      ],
      skip: (input.page - 1) * 50,
      take: 51,
      select: summarySelect,
    });
    return { clients: rows.slice(0, 50), hasMore: rows.length > 50 };
  }
  async get(context: RuntimeContext, businessKey: string) {
    if (
      !BUSINESS_KEY.test(businessKey) ||
      !(await this.authorized(this.database, context, "client:read"))
    )
      return null;
    const row = await this.database.client.findFirst({
      where: { organizationId: context.organizationId, businessKey },
      select: detailsSelect,
    });
    return row ? { ...row, updatedAt: row.updatedAt.toISOString() } : null;
  }
  async updateWithAudit(
    context: RuntimeContext,
    input: UpdateClientInput,
  ): Promise<ClientUpdateResult> {
    if (
      !context.capabilities.has("client:read") ||
      !context.capabilities.has("client:write") ||
      validateClientUpdate(input).kind !== "VALID"
    )
      return { kind: "UNAVAILABLE" };
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify([
          input.businessKey,
          input.expectedUpdatedAt,
          ...CLIENT_DETAIL_FIELDS.map((field) => [field, input[field]]),
        ]),
      )
      .digest("hex");
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.database.$transaction(
          async (tx): Promise<ClientUpdateResult> => {
            if (!(await this.authorized(tx, context, "client:write")))
              return { kind: "UNAVAILABLE" };
            const replay = await tx.auditEvent.findUnique({
              where: {
                organizationId_idempotencyKey: {
                  organizationId: context.organizationId,
                  idempotencyKey: input.idempotencyKey,
                },
              },
            });
            if (replay) {
              const payload = replay.payload as Record<string, unknown>;
              return replay.actorMembershipId === context.membershipId &&
                replay.eventType === "CLIENT_UPDATED" &&
                replay.result === "SAVED" &&
                payload.inputFingerprint === fingerprint &&
                typeof payload.updatedAt === "string"
                ? { kind: "SAVED", businessKey: input.businessKey, updatedAt: payload.updatedAt }
                : { kind: "CONFLICT" };
            }
            const row = await tx.client.findFirst({
              where: { organizationId: context.organizationId, businessKey: input.businessKey },
              select: { id: true, ...detailsSelect },
            });
            if (!row) return { kind: "UNAVAILABLE" };
            if (row.updatedAt.toISOString() !== input.expectedUpdatedAt) return { kind: "CHANGED" };
            const details = Object.fromEntries(
              CLIENT_DETAIL_FIELDS.map((field) => [field, input[field]]),
            );
            const updatedAt = new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1));
            const updated = await tx.client.updateMany({
              where: {
                id: row.id,
                organizationId: context.organizationId,
                updatedAt: row.updatedAt,
              },
              data: { ...details, updatedAt },
            });
            if (updated.count !== 1) return { kind: "CHANGED" };
            await tx.auditEvent.create({
              data: {
                id: randomUUID(),
                organizationId: context.organizationId,
                actorMembershipId: context.membershipId,
                requestId: context.requestId,
                idempotencyKey: input.idempotencyKey,
                eventType: "CLIENT_UPDATED",
                result: "SAVED",
                payload: {
                  clientId: row.id,
                  businessKey: input.businessKey,
                  inputFingerprint: fingerprint,
                  changedFields: CLIENT_DETAIL_FIELDS.filter(
                    (field) => row[field] !== input[field],
                  ),
                  updatedAt: updatedAt.toISOString(),
                },
              },
            });
            return {
              kind: "SAVED",
              businessKey: input.businessKey,
              updatedAt: updatedAt.toISOString(),
            };
          },
          { isolationLevel: "Serializable", timeout: 10000 },
        );
      } catch (error) {
        if (attempt < 2 && ["P2034", "P2002"].includes(code(error) ?? "")) continue;
        throw error;
      }
    }
  }
}
