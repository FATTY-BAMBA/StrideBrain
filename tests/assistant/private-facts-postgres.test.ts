import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "./database-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { getPrismaClient } from "@/lib/server/prisma";
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import { FakeAssistantModel } from "./fake-model";

(process.env.DATABASE_URL ? it : it.skip)(
  "private-detail facts do not depend on stored clients or addresses and never leak them through model, logs or chips",
  async () => {
    const db = await assistantDatabase();
    try {
      const prisma = getPrismaClient();
      const jobs = await prisma.project.findMany({
        where: { businessKey: { in: ["PRJ-XINYI-026", "PRJ-ACTIVE-001", "PRJ-ACTIVE-002"] } },
        include: { client: true },
        orderBy: { businessKey: "asc" },
      });
      expect(jobs).toHaveLength(3);
      const other = await prisma.client.findFirstOrThrow({
        where: { organizationId: jobs[0]!.organizationId, id: { not: jobs[0]!.clientId } },
      });
      await prisma.project.update({ where: { id: jobs[1]!.id }, data: { clientId: other.id } });
      const secrets = [
        "PRIVATE CLIENT ALPHA",
        "私人客戶甲",
        "PRIVATE CLIENT BETA",
        "私人客戶乙",
        "PRIVATE CONTACT",
        "PRIVATE SITE",
      ] as const;
      await prisma.client.update({
        where: { id: jobs[0]!.clientId },
        data: { nameEn: secrets[0], nameZhTw: secrets[1], contactPerson: secrets[4] },
      });
      await prisma.client.update({
        where: { id: other.id },
        data: { nameEn: secrets[2], nameZhTw: secrets[3], contactPerson: secrets[4] },
      });
      for (let i = 0; i < jobs.length; i++)
        await prisma.project.update({
          where: { id: jobs[i]!.id },
          data: { aiExcluded: false, siteAddress: i === 2 ? null : secrets[5] },
        });
      for (const member of ["membership_horizon_admin", "membership_horizon_viewer"]) {
        // Viewer sees only assigned jobs; grant these fixtures the same explicit read access.
        if (member.endsWith("viewer"))
          for (const job of jobs)
            await prisma.projectAssignment.upsert({
              where: {
                organizationId_projectId_membershipId: {
                  organizationId: job.organizationId,
                  projectId: job.id,
                  membershipId: member,
                },
              },
              create: {
                id: `private-facts-${job.id}`,
                organizationId: job.organizationId,
                projectId: job.id,
                membershipId: member,
              },
              update: {},
            });
        const base = await db.actor(member);
        for (const locale of ["en", "zh-TW"] as const) {
          const texts: string[] = [];
          for (const job of jobs) {
            const real = createAssistantServices();
            const finish = vi.spyOn(real.repository, "finishTurn");
            const reserve = vi.spyOn(real.repository, "reserveCall");
            const model = new FakeAssistantModel([
              {
                usage: { inputTokens: 0, outputTokens: 0 },
                result: {
                  kind: "TOOLS",
                  calls: [{ name: "get_job", arguments: { projectKey: job.businessKey } }],
                },
              },
              (request) => {
                const data = JSON.parse(
                  request.messages.filter((m) => m.role === "data").at(-1)!.text,
                );
                const entries = data.sources[0].facts.filter((f: { ref: string }) =>
                  f.ref.endsWith("Availability"),
                );
                expect(entries).toHaveLength(3);
                texts.push(JSON.stringify(entries));
                return {
                  usage: { inputTokens: 0, outputTokens: 0 },
                  result: {
                    kind: "ANSWER",
                    answer: {
                      parts: [
                        { say: "RECORDS_SHOW" },
                        ...entries.map((f: { ref: string }) => ({ show: f.ref })),
                      ],
                      followUps: [
                        "Who is the client?",
                        "Contact details?",
                        "What is the site address?",
                      ],
                    },
                  },
                };
              },
            ]);
            const out = await new AskAssistant(
              model,
              { ...real.config, enabled: true },
              real.repository,
              real.tools,
            ).execute(
              { ...base, locale },
              { question: `${job.businessKey} client, contact and site address?` },
            );
            expect(out).toMatchObject({ kind: "ANSWER", answer: { followUps: [] } });
            const sent = JSON.stringify({
              requests: model.requests,
              logs: [finish.mock.calls, reserve.mock.calls],
              out,
            });
            for (const secret of secrets) expect(sent).not.toContain(secret);
          }
          expect(texts[0]).toBe(texts[1]);
          expect(texts[0]).toBe(texts[2]);
        }
      }
    } finally {
      await db.close();
    }
  },
  60000,
);
