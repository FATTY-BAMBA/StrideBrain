import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "./database-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { getPrismaClient } from "@/lib/server/prisma";
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import { FakeAssistantModel } from "./fake-model";
(process.env.DATABASE_URL ? it : it.skip)(
  "same reader/question with an unreadable record present or absent has identical chips, boundary, calls and metadata",
  async () => {
    const db = await assistantDatabase();
    try {
      const context = { ...(await db.actor("membership_horizon_mei")), locale: "zh-TW" as const };
      const results = [];
      for (const exists of [true, false]) {
        await getPrismaClient().project.update({
          where: { id: "prj_active_001" },
          data: { deletedAt: exists ? null : new Date() },
        });
        const real = createAssistantServices();
        const finish = vi.spyOn(real.repository, "finishTurn");
        const reserve = vi.spyOn(real.repository, "reserveCall");
        const model = new FakeAssistantModel([
          {
            usage: { inputTokens: 0, outputTokens: 0 },
            result: {
              kind: "TOOLS",
              calls: [{ name: "list_jobs", arguments: { query: "進行中設計專案01" } }],
            },
          },
        ]);
        const result = await new AskAssistant(
          model,
          { ...real.config, enabled: true },
          real.repository,
          real.tools,
        ).execute(context, {
          question: "進行中設計專案01的報價總額是多少？",
          projectKey: "PRJ-XINYI-026",
        });
        results.push({
          result,
          calls: model.requests.length,
          finish: finish.mock.calls.map((r) => r.slice(1)),
          reserve: reserve.mock.calls.map((r) => r[3]),
          modelData: model.requests.map((r) => r.messages),
        });
        expect(result).toMatchObject({
          kind: "ANSWER",
          answer: { text: "找不到這個名稱的專案。" },
          sources: [],
        });
        expect(JSON.stringify(result)).not.toMatch(/PRJ-ACTIVE-001|Active Design Project 01/);
      }
      expect(results[0]).toEqual(results[1]);
    } finally {
      await db.close();
    }
  },
  60000,
);
