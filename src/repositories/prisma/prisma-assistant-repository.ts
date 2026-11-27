import { mentionsUnreadableIdentity } from "@/modules/assistant/domain/subjects";
import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient, Prisma } from "../../../.generated/prisma/client";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  AssistantRepositoryPort,
  AssistantTurnTimingPort,
  AssistantControlInput,
  AssistantControlOutcome,
} from "@/repositories/ports/assistant-repository";

async function member(tx: Prisma.TransactionClient, c: RuntimeContext) {
  return tx.membership.findFirst({
    where: {
      id: c.membershipId,
      organizationId: c.organizationId,
      personId: c.userId,
      role: c.role,
      active: true,
    },
    select: { id: true },
  });
}
async function job(tx: Prisma.TransactionClient, c: RuntimeContext, key: string) {
  if (!c.capabilities.has("project:read") || !(await member(tx, c))) return null;
  const row = await tx.project.findFirst({
    where: {
      organizationId: c.organizationId,
      businessKey: key,
      deletedAt: null,
      ...(c.role === "ORGANIZATION_ADMIN"
        ? {}
        : {
            assignments: {
              some: { organizationId: c.organizationId, membershipId: c.membershipId },
            },
          }),
    },
    select: { id: true, aiExcluded: true },
  });
  return row && new AuthorizationService().canReadProject(c, row.id).allowed ? row : null;
}
export class PrismaAssistantRepository implements AssistantRepositoryPort, AssistantTurnTimingPort {
  constructor(private readonly db: PrismaClient) {}
  async questionMentionsUnreadableJob(
    c: RuntimeContext,
    question: string,
    onTypedMatch?: (text: string) => void,
  ) {
    if (!c.capabilities.has("project:read") || !(await member(this.db, c))) return true;
    if (c.role === "ORGANIZATION_ADMIN") return false;
    const rows = await this.db.project.findMany({
      where: {
        organizationId: c.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        businessKey: true,
        nameEn: true,
        nameZhTw: true,
        assignments: {
          where: { organizationId: c.organizationId, membershipId: c.membershipId },
          select: { membershipId: true },
        },
      },
    });
    const auth = new AuthorizationService();
    const readable: string[] = [],
      unreadable: string[] = [];
    for (const row of rows) {
      const target =
        row.assignments.length && auth.canReadProject(c, row.id).allowed ? readable : unreadable;
      target.push(row.businessKey, row.nameEn, row.nameZhTw);
    }
    return mentionsUnreadableIdentity(question, readable, unreadable, onTypedMatch);
  }
  async readableReferences(c: RuntimeContext, candidates: readonly string[]) {
    if (!c.capabilities.has("project:read") || !(await member(this.db, c)) || !candidates.length)
      return [];
    const predicate: Prisma.ProjectWhereInput = {
      organizationId: c.organizationId,
      deletedAt: null,
      ...(c.role === "ORGANIZATION_ADMIN"
        ? {}
        : {
            assignments: {
              some: { organizationId: c.organizationId, membershipId: c.membershipId },
            },
          }),
    };
    const projects = await this.db.project.findMany({
      where: { ...predicate, businessKey: { in: [...candidates] } },
      select: { id: true, businessKey: true },
    });
    const quotes = c.capabilities.has("quote:read")
      ? await this.db.quoteVersion.findMany({
          where: {
            organizationId: c.organizationId,
            documentNumber: { in: [...candidates] },
            quote: { organizationId: c.organizationId, project: predicate },
          },
          select: { documentNumber: true, quote: { select: { projectId: true } } },
        })
      : [];
    const auth = new AuthorizationService();
    return [
      ...projects.filter((p) => auth.canReadProject(c, p.id).allowed).map((p) => p.businessKey),
      ...quotes
        .filter((q) => q.documentNumber && auth.canReadProject(c, q.quote.projectId).allowed)
        .map((q) => q.documentNumber!),
    ];
  }
  async enabled(c: RuntimeContext) {
    if (!c.capabilities.has("project:read") || !(await member(this.db, c))) return false;
    return (
      (
        await this.db.organization.findUnique({
          where: { id: c.organizationId },
          select: { assistantEnabled: true },
        })
      )?.assistantEnabled === true
    );
  }
  async jobPolicy(c: RuntimeContext, key: string) {
    const row = await job(this.db, c, key);
    return row ? { id: row.id, excluded: row.aiExcluded } : null;
  }
  async settings(c: RuntimeContext, monthStart: Date, now = new Date()) {
    if (!c.capabilities.has("settings:manage") || !(await member(this.db, c))) return null;
    const [org, usage, unmeteredCalls, failures, timings, recentTimings] = await Promise.all([
      this.db.organization.findUnique({
        where: { id: c.organizationId },
        select: { assistantEnabled: true },
      }),
      this.db.assistantUsage.aggregate({
        where: { organizationId: c.organizationId, createdAt: { gte: monthStart } },
        _count: true,
        _sum: { estimatedUsd: true },
      }),
      this.db.assistantUsage.count({
        where: {
          organizationId: c.organizationId,
          createdAt: { gte: monthStart },
          estimatedUsd: null,
        },
      }),
      this.db.assistantUsage.groupBy({
        by: ["failureCode", "providerHttpStatus"],
        where: {
          organizationId: c.organizationId,
          createdAt: { gte: new Date(now.getTime() - 7 * 86400000), lte: now },
          failureCode: { not: null },
        },
        _count: true,
        orderBy: [{ failureCode: "asc" }, { providerHttpStatus: "asc" }],
      }),
      this.db.assistantTurnTiming.aggregate({
        where: {
          organizationId: c.organizationId,
          completedAt: { gte: new Date(now.getTime() - 7 * 86400000), lte: now },
        },
        _count: true,
        _max: { serverDurationMs: true },
      }),
      this.db.assistantTurnTiming.findMany({
        where: {
          organizationId: c.organizationId,
          completedAt: { gte: new Date(now.getTime() - 7 * 86400000), lte: now },
        },
        orderBy: { completedAt: "desc" },
        take: 20,
        select: { requestId: true, startedAt: true, serverDurationMs: true },
      }),
    ]);
    return org
      ? {
          enabled: org.assistantEnabled,
          calls: usage._count,
          estimatedUsd: usage._sum.estimatedUsd?.toFixed(9) ?? "0.000000000",
          unmeteredCalls,
          turnTimings: {
            count: timings._count,
            latestMs: recentTimings[0]?.serverDurationMs ?? null,
            maximumMs: timings._max.serverDurationMs,
            recent: recentTimings,
          },
          failures: failures.map((row) => ({
            code: row.failureCode!,
            httpStatus: row.providerHttpStatus,
            count: row._count,
          })),
        }
      : null;
  }
  async recordTurnTiming(c: RuntimeContext, startedAt: Date, completedAt: Date) {
    const serverDurationMs = completedAt.getTime() - startedAt.getTime();
    if (
      !c.capabilities.has("project:read") ||
      !Number.isSafeInteger(serverDurationMs) ||
      serverDurationMs < 0 ||
      serverDurationMs > 3600000 ||
      !(await member(this.db, c))
    )
      return;
    await this.db.assistantTurnTiming.upsert({
      where: {
        organizationId_requestId: { organizationId: c.organizationId, requestId: c.requestId },
      },
      create: {
        id: randomUUID(),
        organizationId: c.organizationId,
        membershipId: c.membershipId,
        requestId: c.requestId,
        startedAt,
        completedAt,
        serverDurationMs,
      },
      update: {},
    });
  }
  async setControl(
    c: RuntimeContext,
    input: AssistantControlInput,
  ): Promise<AssistantControlOutcome> {
    if (!c.capabilities.has(input.target === "ORGANIZATION" ? "settings:manage" : "project:update"))
      return { kind: "UNAVAILABLE" };
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${c.organizationId}, 39))::text`;
      if (!(await member(tx, c))) return { kind: "UNAVAILABLE" };
      const target = input.target === "PROJECT" ? await job(tx, c, input.projectKey ?? "") : null;
      if (input.target === "PROJECT" && !target) return { kind: "UNAVAILABLE" };
      const fingerprint = createHash("sha256")
        .update(
          JSON.stringify({ target: input.target, projectId: target?.id, enabled: input.enabled }),
        )
        .digest("hex");
      const replay = await tx.auditEvent.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: c.organizationId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (replay)
        return {
          kind:
            replay.actorMembershipId === c.membershipId &&
            (replay.payload as { fingerprint?: string }).fingerprint === fingerprint
              ? "SAVED"
              : "CONFLICT",
        };
      if (target)
        await tx.project.update({
          where: { id_organizationId: { id: target.id, organizationId: c.organizationId } },
          data: { aiExcluded: input.enabled },
        });
      else
        await tx.organization.update({
          where: { id: c.organizationId },
          data: { assistantEnabled: input.enabled },
        });
      await tx.auditEvent.create({
        data: {
          id: randomUUID(),
          organizationId: c.organizationId,
          actorMembershipId: c.membershipId,
          eventType: target ? "ASSISTANT_JOB_EXCLUSION_CHANGED" : "ASSISTANT_PREFERENCE_CHANGED",
          requestId: c.requestId,
          idempotencyKey: input.idempotencyKey,
          payload: {
            fingerprint,
            enabled: input.enabled,
            ...(target ? { projectId: target.id } : {}),
          },
          result: "SUCCESS",
        },
      });
      return { kind: "SAVED" };
    });
  }
  reserveCall: AssistantRepositoryPort["reserveCall"] = async (c, config, now, sent) => {
    if (!c.capabilities.has("project:read")) return null;
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${c.organizationId}, 39))::text`;
      if (!(await member(tx, c))) return null;
      const org = await tx.organization.findUnique({
        where: { id: c.organizationId },
        select: { assistantEnabled: true },
      });
      if (!org?.assistantEnabled) return null;
      const day = new Date(now);
      day.setUTCHours(0, 0, 0, 0);
      if (
        (await tx.assistantUsage.count({
          where: { organizationId: c.organizationId, createdAt: { gte: day } },
        })) >= config.dailyCalls
      )
        return null;
      const id = randomUUID();
      await tx.assistantUsage.create({
        data: {
          id,
          organizationId: c.organizationId,
          membershipId: c.membershipId,
          requestId: c.requestId,
          provider: config.provider,
          model: config.model,
          toolNames: [...new Set(sent.toolNames)],
          sourceIds: [...new Set(sent.sourceIds)],
          createdAt: now,
        },
      });
      return id;
    });
  };
  meterCall: AssistantRepositoryPort["meterCall"] = async (c, id, usage, estimatedUsd) => {
    if (!c.capabilities.has("project:read")) return;
    await this.db.assistantUsage.updateMany({
      where: {
        id,
        organizationId: c.organizationId,
        membershipId: c.membershipId,
        requestId: c.requestId,
      },
      data: { ...usage, estimatedUsd },
    });
  };
  finishTurn: AssistantRepositoryPort["finishTurn"] = async (c, outcome, failure) => {
    if (!c.capabilities.has("project:read")) return;
    // Record only the failed call, not every earlier successful call in this turn.
    if (failure && /^[A-Z][A-Z_]{0,63}$/.test(failure.code))
      await this.db.assistantUsage.updateMany({
        where: {
          id: failure.callId,
          organizationId: c.organizationId,
          membershipId: c.membershipId,
          requestId: c.requestId,
          outcome: "PENDING",
        },
        data: {
          failureCode: failure.code,
          providerHttpStatus:
            Number.isInteger(failure.httpStatus) &&
            failure.httpStatus! >= 100 &&
            failure.httpStatus! <= 599
              ? failure.httpStatus!
              : null,
        },
      });
    await this.db.assistantUsage.updateMany({
      where: {
        organizationId: c.organizationId,
        membershipId: c.membershipId,
        requestId: c.requestId,
        outcome: "PENDING",
      },
      data: { outcome },
    });
  };
}
