import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../../.generated/prisma/client";
import { ListProjectClients } from "@/modules/projects/application/list-project-clients";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import { jobContext } from "./job-fixture";

describe("Client choices for job creation", () => {
  it.each(["en", "zh-TW"] as const)("localizes the minimal choices in %s", async (locale) => {
    const listActiveClients = vi
      .fn()
      .mockResolvedValue([
        { businessKey: "CLIENT", nameEn: "Synthetic client", nameZhTw: "合成客戶" },
      ]);
    const context = jobContext({ locale });
    expect(await new ListProjectClients({ listActiveClients }).execute(context)).toEqual({
      kind: "AVAILABLE",
      clients: [{ businessKey: "CLIENT", name: locale === "en" ? "Synthetic client" : "合成客戶" }],
    });
    expect(listActiveClients).toHaveBeenCalledExactlyOnceWith(context);
  });
  it.each([
    roleBundle("VIEWER"),
    new Set(["project:create"] as const),
    new Set(["project:read"] as const),
  ])("checks capabilities before reading", async (capabilities) => {
    const listActiveClients = vi.fn();
    const findMany = vi.fn();
    const context = jobContext({ capabilities });
    expect(await new ListProjectClients({ listActiveClients }).execute(context)).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(
      await new PrismaProjectWriteRepository({
        client: { findMany },
      } as unknown as PrismaClient).listActiveClients(context),
    ).toEqual([]);
    expect(listActiveClients).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });
  it("scopes and bounds the selected data without a feature data-mode gate", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await new PrismaProjectWriteRepository({
      client: { findMany },
    } as unknown as PrismaClient).listActiveClients(
      jobContext({ organizationId: "foreign", dataMode: "TENANT_PRIVATE" }),
    );
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: { organizationId: "foreign", active: true },
      orderBy: { businessKey: "asc" },
      select: { businessKey: true, nameEn: true, nameZhTw: true },
    });
  });
  it("contains storage failures", async () => {
    expect(
      await new ListProjectClients({
        listActiveClients: vi.fn().mockRejectedValue(new Error("private")),
      }).execute(jobContext()),
    ).toEqual({ kind: "UNAVAILABLE" });
  });
});
