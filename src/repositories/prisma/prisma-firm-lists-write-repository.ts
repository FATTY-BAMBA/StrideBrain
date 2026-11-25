import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "../../../.generated/prisma/client";
import type {
  FirmListsWriter,
  FirmListChangeResult,
} from "@/repositories/ports/firm-lists-repository";
import { canManageFirmLists } from "@/modules/firm-lists/application/manage-firm-lists";
import {
  validateFirmListChange,
  validateFirmListReferences,
  type FirmListChange,
} from "@/modules/firm-lists/domain/list-change";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { PrismaFirmListsRepository } from "./prisma-firm-lists-repository";

export class PrismaFirmListsWriteRepository implements FirmListsWriter {
  constructor(private readonly database: PrismaClient) {}
  async changeWithAudit(
    context: RuntimeContext,
    raw: FirmListChange,
  ): Promise<FirmListChangeResult> {
    if (!canManageFirmLists(context)) return { kind: "UNAVAILABLE" };
    const parsed = validateFirmListChange(raw);
    if (parsed.kind === "INVALID") return parsed;
    const input = parsed.input,
      organizationId = context.organizationId;
    const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const key = input.kind === "AREA_UNIT" ? null : (input.key ?? randomUUID());
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.database.$transaction(
          async (tx): Promise<FirmListChangeResult> => {
            if (
              !(await tx.membership.findFirst({
                where: {
                  id: context.membershipId,
                  organizationId,
                  personId: context.userId,
                  role: "ORGANIZATION_ADMIN",
                  active: true,
                },
                select: { id: true },
              }))
            )
              return { kind: "UNAVAILABLE" };
            const replay = await tx.auditEvent.findUnique({
              where: {
                organizationId_idempotencyKey: {
                  organizationId,
                  idempotencyKey: input.idempotencyKey,
                },
              },
            });
            if (replay) {
              const payload = replay.payload as Record<string, unknown>;
              return replay.actorMembershipId === context.membershipId &&
                replay.eventType === "FIRM_LIST_CHANGED" &&
                replay.result === "SAVED" &&
                payload.fingerprint === fingerprint &&
                (payload.key === null || typeof payload.key === "string")
                ? { kind: "SAVED", key: payload.key }
                : { kind: "CONFLICT" };
            }
            const lists = await new PrismaFirmListsRepository(tx).read(context);
            if (!lists) return { kind: "UNAVAILABLE" };
            if (lists.revision !== input.expectedRevision) return { kind: "CHANGED" };
            const fields = validateFirmListReferences(input, lists);
            if (fields.length) return { kind: "INVALID", fields };
            if (input.kind === "AREA_UNIT") {
              await tx.organization.update({
                where: { id: organizationId },
                data: { areaDisplayUnit: input.areaDisplayUnit },
              });
            } else {
              const entries =
                input.kind === "JOB_TYPE"
                  ? lists.jobTypes
                  : input.kind === "WORK_CATEGORY"
                    ? lists.workCategories
                    : input.kind === "CLIENT_TYPE"
                      ? lists.clientTypes
                      : lists.quoteUnits;
              if (input.key !== null && !entries.some((entry) => entry.key === input.key))
                return { kind: "UNAVAILABLE" };
              if (input.key === null && entries.length >= (input.kind === "CLIENT_TYPE" ? 30 : 500))
                return { kind: "LIMIT" };
              const data = {
                nameEn: input.nameEn,
                nameZhTw: input.nameZhTw,
                sortOrder: input.sortOrder,
                active: input.active,
              };
              const where = { organizationId_key: { organizationId, key: key! } };
              if (input.kind === "WORK_CATEGORY") {
                const previous = lists.workCategories.find((entry) => entry.key === input.key);
                if (previous && previous.pricedUnderKey !== input.pricedUnderKey) {
                  const used = await new PrismaFirmListsRepository(tx).referencedCategories(
                    context,
                  );
                  if (!used) return { kind: "UNAVAILABLE" };
                  if (used.includes(previous.key)) return { kind: "MAPPING_IN_USE" };
                }
                const parent = input.pricedUnderKey
                  ? await tx.firmWorkCategory.findFirst({
                      where: { organizationId, key: input.pricedUnderKey },
                      select: { id: true },
                    })
                  : null;
                if (input.pricedUnderKey && !parent)
                  return { kind: "INVALID", fields: ["pricedUnderKey"] };
                const categoryData = { ...data, pricedUnderId: parent?.id ?? null };
                if (input.key) await tx.firmWorkCategory.update({ where, data: categoryData });
                else
                  await tx.firmWorkCategory.create({
                    data: {
                      id: randomUUID(),
                      organizationId,
                      key: key!,
                      ...categoryData,
                      scopeSelectable: true,
                    },
                  });
              } else if (input.kind === "CLIENT_TYPE") {
                if (input.key) await tx.firmClientType.update({ where, data });
                else
                  await tx.firmClientType.create({
                    data: { id: randomUUID(), organizationId, key: key!, ...data },
                  });
              } else if (input.kind === "QUOTE_UNIT") {
                if (input.key) await tx.firmQuoteUnit.update({ where, data });
                else
                  await tx.firmQuoteUnit.create({
                    data: { id: randomUUID(), organizationId, key: key!, ...data },
                  });
              } else {
                const row = input.key
                  ? await tx.firmJobType.update({ where, data, select: { id: true } })
                  : await tx.firmJobType.create({
                      data: { id: randomUUID(), organizationId, key: key!, ...data },
                      select: { id: true },
                    });
                const related = await tx.firmJobType.findMany({
                  where: { organizationId, key: { in: [...input.relatedKeys] } },
                  select: { id: true },
                });
                await tx.firmJobTypeRelation.deleteMany({
                  where: { organizationId, fromTypeId: row.id },
                });
                if (related.length)
                  await tx.firmJobTypeRelation.createMany({
                    data: related.map((to) => ({
                      id: randomUUID(),
                      organizationId,
                      fromTypeId: row.id,
                      toTypeId: to.id,
                    })),
                  });
              }
            }
            await tx.auditEvent.create({
              data: {
                id: randomUUID(),
                organizationId,
                actorMembershipId: context.membershipId,
                requestId: context.requestId,
                idempotencyKey: input.idempotencyKey,
                eventType: "FIRM_LIST_CHANGED",
                result: "SAVED",
                payload: {
                  fingerprint,
                  key,
                  list: input.kind,
                  operation:
                    input.kind === "AREA_UNIT"
                      ? "UPDATE"
                      : input.key === null
                        ? "ADD"
                        : input.active
                          ? "UPDATE"
                          : "RETIRE",
                  previousRevision: lists.revision,
                  changedFields:
                    input.kind === "AREA_UNIT"
                      ? ["areaDisplayUnit"]
                      : [
                          "nameEn",
                          "nameZhTw",
                          "sortOrder",
                          "active",
                          ...(input.kind === "JOB_TYPE"
                            ? ["relatedKeys"]
                            : input.kind === "WORK_CATEGORY"
                              ? ["pricedUnderKey"]
                              : []),
                        ],
                },
              },
            });
            return { kind: "SAVED", key };
          },
          { isolationLevel: "Serializable", timeout: 10000 },
        );
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error ? String(error.code) : "";
        if (attempt < 2 && ["P2034", "P2002"].includes(code)) continue;
        throw error;
      }
    }
  }
}
