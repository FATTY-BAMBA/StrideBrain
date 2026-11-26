import { it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "./database-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { getPrismaClient } from "@/lib/server/prisma";
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import { FakeAssistantModel } from "./fake-model";
(process.env.DATABASE_URL ? it : it.skip)(
  "allows a readable phase-two name but refuses an unreadable longer or separate name after final validation",
  async () => {
    const db = await assistantDatabase();
    try {
      const client = getPrismaClient();
      const ids = ["prj_xinyi_026", "prj_active_002"];
      const saved = await client.project.findMany({
        where: { id: { in: ids } },
        select: { id: true, nameZhTw: true },
      });
      expect(saved).toHaveLength(2);
      try {
        for (const member of ["membership_horizon_mei", "membership_horizon_viewer"]) {
          const context = { ...(await db.actor(member)), locale: "zh-TW" as const };
          for (const [readable, unreadable, question, denied] of [
            ["信義旗艦店裝修二期", "信義旗艦店裝修", "信義旗艦店裝修二期目前在哪個階段？", false],
            ["信義旗艦店裝修", "信義旗艦店裝修二期", "信義旗艦店裝修二期目前在哪個階段？", true],
            [
              "信義旗艦店裝修二期",
              "信義旗艦店裝修",
              "信義旗艦店裝修二期，以及信義旗艦店裝修目前在哪個階段？",
              true,
            ],
          ] as const) {
            await client.project.update({ where: { id: ids[0]! }, data: { nameZhTw: readable } });
            await client.project.update({ where: { id: ids[1]! }, data: { nameZhTw: unreadable } });
            const real = createAssistantServices();
            const guard = vi.spyOn(real.repository, "questionMentionsUnreadableJob");
            const usage = { inputTokens: 0, outputTokens: 0 };
            const fake = new FakeAssistantModel([
              {
                usage,
                result: {
                  kind: "TOOLS",
                  calls: [{ name: "get_job", arguments: { projectKey: "PRJ-XINYI-026" } }],
                },
              },
              (request) => {
                expect(guard).not.toHaveBeenCalled();
                const data = JSON.parse(
                  request.messages.filter((m) => m.role === "data").at(-1)!.text,
                );
                const ref = data.sources[0].facts.find((f: { ref: string }) =>
                  f.ref.endsWith(".stage"),
                ).ref;
                return {
                  usage,
                  result: {
                    kind: "ANSWER",
                    answer: { parts: [{ say: "RECORDS_SHOW" }, { show: ref }], followUps: [] },
                  },
                };
              },
            ]);
            const result = await new AskAssistant(
              fake,
              { ...real.config, enabled: true },
              real.repository,
              real.tools,
            ).execute(context, { question });
            expect(fake.requests).toHaveLength(2);
            expect(guard).toHaveBeenCalledTimes(1);
            if (denied)
              expect(result).toMatchObject({ kind: "ANSWER", refusal: "UNAVAILABLE", sources: [] });
            else {
              expect(result.kind).toBe("ANSWER");
              expect(result).not.toHaveProperty("refusal");
              if (result.kind === "ANSWER")
                expect(result.answer.text).toContain("信義旗艦店裝修二期");
            }
          }
        }
      } finally {
        for (const row of saved)
          await client.project.update({ where: { id: row.id }, data: { nameZhTw: row.nameZhTw } });
      }
    } finally {
      await db.close();
    }
  },
  60000,
);
