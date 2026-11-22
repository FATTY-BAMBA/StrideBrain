import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { randomUUID } from "node:crypto";
import { assistantDatabase } from "./database-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { getPrismaClient } from "@/lib/server/prisma";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import { PrepareQuoteDraft } from "@/modules/quote-draft/application/prepare-quote-draft";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
let db: Awaited<ReturnType<typeof assistantDatabase>>;
beforeAll(async () => {
  if (process.env.DATABASE_URL) db = await assistantDatabase();
}, 30000);
afterAll(async () => {
  await db?.close();
});
suite("assistant PostgreSQL access, controls and metadata", () => {
  it("defaults new organizations off and enables only the fixture sample", async () => {
    const org = await getPrismaClient().organization.create({
      data: {
        id: "assistant_new_org",
        businessKey: "ASSISTANT-NEW",
        nameEn: "New",
        nameZhTw: "新公司",
      },
    });
    expect(org.assistantEnabled).toBe(false);
    expect(await createAssistantServices().repository.enabled(await db.actor())).toBe(true);
  });
  it("supports owner, assigned manager and finance; denies Viewer amounts and foreign jobs", async () => {
    const services = createAssistantServices(),
      owner = await db.actor();
    const rows = await services.tools.execute(owner, { name: "list_jobs", arguments: {} });
    expect(rows.sources.length).toBeGreaterThan(1);
    for (const membership of [
      "membership_horizon_mei",
      "membership_horizon_finance",
      "membership_horizon_viewer",
    ]) {
      const c = await db.actor(membership),
        out = await services.tools.execute(c, { name: "list_jobs", arguments: {} });
      const allowed = await getPrismaClient().project.findMany({
        where: { id: { in: [...(c.assignedProjectIds ?? [])] } },
        select: { businessKey: true },
      });
      expect(
        out.sources
          .flatMap((s) => s.projectKeys)
          .every((k) => allowed.some((p) => p.businessKey === k)),
      ).toBe(true);
      if (c.role === "VIEWER")
        for (const name of [
          "get_quote_status",
          "get_past_prices",
          "get_closed_job_lessons",
        ] as const) {
          const output = await services.tools.execute(c, {
            name,
            arguments:
              name === "get_closed_job_lessons" ? {} : { projectKey: allowed[0]!.businessKey },
          });
          expect(output.sources).toEqual([]);
        }
    }
    const job = rows.sources[0]!.projectKeys[0]!;
    const foreign = { ...owner, organizationId: "assistant_new_org" };
    for (const name of [
      "get_job",
      "get_quote_status",
      "get_saved_comparison",
      "get_past_prices",
    ] as const)
      expect(
        (await services.tools.execute(foreign, { name, arguments: { projectKey: job } })).status,
      ).toBe("UNAVAILABLE");
    expect(await services.repository.settings(foreign, new Date("2026-01-01"))).toBeNull();
  });
  it("audits idempotent controls, rejects reused keys and denies Viewer/cross-tenant writes", async () => {
    const service = createAssistantServices(),
      owner = await db.actor(),
      key = randomUUID(),
      input = { target: "ORGANIZATION", enabled: false, idempotencyKey: key };
    expect((await service.control.execute(owner, input)).kind).toBe("SAVED");
    expect((await service.control.execute(owner, input)).kind).toBe("SAVED");
    expect((await service.control.execute(owner, { ...input, enabled: true })).kind).toBe(
      "CONFLICT",
    );
    expect(
      await getPrismaClient().auditEvent.count({
        where: { organizationId: owner.organizationId, idempotencyKey: key },
      }),
    ).toBe(1);
    expect(
      (
        await service.control.execute(await db.actor("membership_horizon_viewer"), {
          ...input,
          idempotencyKey: randomUUID(),
        })
      ).kind,
    ).toBe("UNAVAILABLE");
    expect(
      (
        await service.control.execute(
          { ...owner, organizationId: "assistant_new_org" },
          { ...input, idempotencyKey: randomUUID() },
        )
      ).kind,
    ).toBe("UNAVAILABLE");
    expect(
      (
        await service.control.execute(
          { ...owner, requestId: randomUUID() },
          { ...input, enabled: true, idempotencyKey: randomUUID() },
        )
      ).kind,
    ).toBe("SAVED");
  });
  it("keeps saved comparison freshness and the exact Quote-tab price basis", async () => {
    const c = await db.actor(),
      service = createAssistantServices(),
      comparisons = createComparisonServices();
    const project = await getPrismaClient().project.findFirstOrThrow({
      where: { organizationId: c.organizationId, status: "ACTIVE", stage: "QUOTE_REVIEW" },
      orderBy: { businessKey: "asc" },
    });
    const run = await comparisons.runComparison.execute(c, project.businessKey);
    expect(run.kind).toBe("COMPLETE");
    if (run.kind !== "COMPLETE") throw new Error("RUN");
    await comparisons.runEconomics.execute(
      c,
      run.result.run.id,
      run.result.defaultSelectedProjectKeys,
    );
    const read = await service.tools.execute(c, {
      name: "get_saved_comparison",
      arguments: { projectKey: project.businessKey },
    });
    expect(read.status).toBe("OK");
    const history = await service.tools.execute(c, {
      name: "get_past_prices",
      arguments: { projectKey: project.businessKey },
    });
    expect(history.status).toBe("OK");
    const prepared = await new PrepareQuoteDraft(
      new PrismaQuoteDraftRepository(getPrismaClient()),
      new SignedDraftPreparationCodec("assistant-prepare-synthetic-secret-32-bytes"),
    ).execute(c, project.businessKey);
    expect(prepared.kind).toBe("PREPARED");
    if (prepared.kind !== "PREPARED") throw new Error("PREPARE");
    for (const line of prepared.preparation.suggestions) {
      const facts = history.sources.find((s) => s.facts.categoryId === line.categoryId)?.facts;
      expect(facts?.count).toBe(line.basis.count);
      expect(facts?.median).toBe(line.basis.medianRate);
      expect(facts?.low).toBe(line.basis.lowRate);
      expect(facts?.high).toBe(line.basis.highRate);
    }
    const other = await db.actor("membership_horizon_mei");
    expect(
      (
        await service.tools.execute(other, {
          name: "get_saved_comparison",
          arguments: { projectKey: project.businessKey },
        })
      ).status,
    ).not.toBe("OK");
    await getPrismaClient().project.update({
      where: { id: project.id },
      data: { areaQuantity: "777" },
    });
    expect(
      (
        await service.tools.execute(c, {
          name: "get_saved_comparison",
          arguments: { projectKey: project.businessKey },
        })
      ).status,
    ).toBe("OUT_OF_DATE");
    await getPrismaClient().project.update({
      where: { id: project.id },
      data: { areaQuantity: project.areaQuantity },
    });
  });
  it("excludes jobs from every tool and protects historical dependencies", async () => {
    const c = await db.actor(),
      service = createAssistantServices();
    const list = await service.tools.execute(c, { name: "list_jobs", arguments: {} }),
      key = list.sources[0]!.projectKeys[0]!;
    expect(
      (
        await service.control.execute(c, {
          target: "PROJECT",
          projectKey: key,
          enabled: true,
          idempotencyKey: randomUUID(),
        })
      ).kind,
    ).toBe("SAVED");
    for (const name of [
      "get_job",
      "get_quote_status",
      "get_saved_comparison",
      "get_past_prices",
    ] as const)
      expect(await service.tools.execute(c, { name, arguments: { projectKey: key } })).toEqual({
        status: "EXCLUDED",
        sources: [],
      });
    expect(
      (await service.tools.execute(c, { name: "list_jobs", arguments: {} })).sources.flatMap(
        (s) => s.projectKeys,
      ),
    ).not.toContain(key);
    expect(
      await service.tools.canSend(c, [
        { sourceId: "s", label: "aggregate", href: "/en", facts: {}, projectKeys: [key] },
      ]),
    ).toBe(false);
    const viewer = await db.actor("membership_horizon_viewer");
    expect(
      (
        await service.control.execute(viewer, {
          target: "PROJECT",
          projectKey: key,
          enabled: false,
          idempotencyKey: randomUUID(),
        })
      ).kind,
    ).toBe("UNAVAILABLE");
  });
  it("reserves the daily cap atomically and counts exact cost without content", async () => {
    const c = await db.actor(),
      service = createAssistantServices(),
      config = { ...service.config, dailyCalls: 3 };
    const ids = await Promise.all(
      Array.from({ length: 12 }, () =>
        service.repository.reserveCall(c, config, new Date(), {
          toolNames: ["list_jobs"],
          sourceIds: ["source"],
        }),
      ),
    );
    expect(ids.filter(Boolean)).toHaveLength(3);
    await service.repository.meterCall(
      c,
      ids.find((id) => id !== null)!,
      { inputTokens: 1000, outputTokens: 200 },
      "0.000800000",
    );
    await service.repository.finishTurn(c, "ANSWERED");
    const settings = await service.repository.settings(c, new Date("2026-01-01"));
    expect(settings).toMatchObject({ calls: 3, estimatedUsd: "0.000800000", unmeteredCalls: 2 });
    const rows = await getPrismaClient().assistantUsage.findMany({
      where: { organizationId: c.organizationId },
    });
    expect(rows.every((r) => r.outcome === "ANSWERED")).toBe(true);
    expect(rows[0]).not.toHaveProperty("question");
    expect(rows[0]).not.toHaveProperty("answer");
    const viewer = { ...c, role: "VIEWER" as const, capabilities: roleBundle("VIEWER") };
    expect(await service.repository.settings(viewer, new Date("2026-01-01"))).toBeNull();
  });
});
