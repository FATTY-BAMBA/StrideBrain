import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "./database-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import {
  createProjectListService,
  createProjectWorkspaceService,
} from "@/lib/server/project-workspace-services";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { GetQuoteIssue } from "@/modules/quote-issue/application/issue-services";
import { PrismaQuoteIssueRepository } from "@/repositories/prisma/prisma-quote-issue-repository";
import { GetQuotedHistory } from "@/modules/quote-draft/application/get-quoted-history";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { getPrismaClient } from "@/lib/server/prisma";
import { projectStageLabel, categoryLabel } from "@/modules/localization/jobs";
import { cityLabel } from "@/modules/projects/domain/taiwan-cities";
import { stageGroups, inStageGroup } from "@/modules/projects/domain/stage-groups";
import { assistantQuoteStatus, assistantFactCopy } from "@/modules/localization/assistant";
import { formatMoney } from "@/modules/finance/format-money";
import { formatQuoteRate } from "@/modules/quote-draft/presentation";
import { closedLessonText } from "@/modules/home-desk/presentation";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
import { modelFacts } from "@/modules/assistant/domain/redaction";
import { prepareEvaluation } from "./evaluation-fixture";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
let db: Awaited<ReturnType<typeof assistantDatabase>>;
beforeAll(async () => {
  if (process.env.DATABASE_URL) {
    db = await assistantDatabase();
    await prepareEvaluation(db);
  }
}, 30000);
afterAll(async () => {
  await db?.close();
});
const roles = [
  ["owner", "membership_horizon_admin", true],
  ["assigned manager", "membership_horizon_mei", true],
  ["unassigned manager", "membership_horizon_mei", false],
  ["finance", "membership_horizon_finance", true],
  ["Viewer", "membership_horizon_viewer", true],
] as const;
const names = [
  "list_jobs",
  "get_job",
  "get_quote_status",
  "list_awaiting_client",
  "get_saved_comparison",
  "get_past_prices",
  "get_closed_job_lessons",
] as const;
suite("each assistant tool mirrors its page's authorized read", () => {
  it.each(
    roles.flatMap(([role, member, assigned]) =>
      names.map((name) => ({ role, member, assigned, name })),
    ),
  )("$role / $name", async ({ member, assigned, name }) => {
    const actor = await db.actor(member),
      c = actor,
      key = assigned ? "PRJ-XINYI-026" : "PRJ-ACTIVE-004";
    const tool = await createAssistantServices().tools.execute(c, {
      name,
      arguments: ["list_jobs", "list_awaiting_client", "get_closed_job_lessons"].includes(name)
        ? {}
        : { projectKey: key },
    });
    if (name === "list_jobs") {
      const page = await createProjectListService().execute(c);
      if (page.kind !== "AVAILABLE") {
        expect(tool.sources).toEqual([]);
        return;
      }
      const permitted = [];
      for (const j of page.projects) {
        const p = await createAssistantServices().repository.jobPolicy(c, j.businessKey);
        if (p && !p.excluded) permitted.push(j);
      }
      expect(tool.sources.filter((s) => s.countSourceId).map((s) => s.facts)).toEqual(
        permitted.slice(0, 20).map((j) => ({
          reference: j.businessKey,
          name: j.name,
          stage: projectStageLabel(c.locale, j.stage),
          stageGroup: stageGroups.find((g) => inStageGroup(j.stage, g.key))?.[c.locale],
        })),
      );
      expect(tool.sources.at(-1)?.facts.matchingCount).toBe(permitted.length);
    } else if (name === "get_job") {
      const page = await createProjectWorkspaceService().execute(c, key);
      if (page.kind !== "AVAILABLE") {
        expect(tool.sources).toEqual([]);
        return;
      }
      const j = page.workspace.project;
      expect(tool.sources[0]?.facts).toEqual({
        reference: key,
        name: j.name.display,
        stage: projectStageLabel(c.locale, j.stage as Parameters<typeof projectStageLabel>[1]),
        city: cityLabel(c.locale, j.location.city),
        area: { value: j.area.displayValue, unit: j.area.displayUnit },
        scopeCategories: j.scopeCategories.map((s) => s.name.display),
      });
    } else if (name === "get_quote_status") {
      const page = await new GetQuoteIssue(
        new PrismaQuoteIssueRepository(getPrismaClient()),
      ).execute(c, key);
      if (page.kind !== "AVAILABLE") {
        expect(tool.sources).toEqual([]);
        return;
      }
      const copy = assistantFactCopy(c.locale),
        issued = page.latestIssued ?? page.issued;
      expect(modelFacts(tool.sources[0]?.facts)).toEqual({
        reference: key,
        status: assistantQuoteStatus(c.locale, page.status),
        amounts: page.amounts
          ? {
              amountBeforeTax: formatMoney(page.amounts.amountBeforeTax, page.amounts.currency),
              taxAmount: formatMoney(page.amounts.taxAmount, page.amounts.currency),
              totalAmount: formatMoney(page.amounts.totalAmount, page.amounts.currency),
            }
          : copy.noAmounts,
        issued: issued
          ? {
              status: assistantQuoteStatus(c.locale, issued.status),
              documentNumber: issued.documentNumber,
              validUntil: issued.validUntil,
              acceptedOn: issued.acceptedOn ?? copy.notAccepted,
            }
          : copy.noIssued,
      });
    } else if (name === "list_awaiting_client" || name === "get_closed_job_lessons") {
      const page = await createHomeDeskService().execute(c);
      if (
        page.kind !== "AVAILABLE" ||
        !c.capabilities.has("quote:read") ||
        (name === "get_closed_job_lessons" && !c.capabilities.has("commercial:actual-read"))
      ) {
        expect(tool.sources).toEqual([]);
        return;
      }
      const rows = tool.sources.filter((s) => s.countSourceId);
      if (name === "list_awaiting_client") {
        const expected = page.decisions.filter((d) => d.kind === "AWAITING_CLIENT");
        expect(rows.map((r) => r.facts)).toEqual(
          expected.map((r) => ({
            name: r.project.name,
            reference: r.project.businessKey,
            documentNumber: r.documentNumber,
            validUntil: r.validUntil,
            status: assistantFactCopy(c.locale).issued,
            acceptedOn: assistantFactCopy(c.locale).notAccepted,
          })),
        );
      } else {
        expect(rows.map((r) => modelFacts(r.facts))).toEqual(
          page.closedJobs
            .filter((r) => r.lesson && r.financialState === "AVAILABLE")
            .map((r) => ({
              name: r.project.name,
              category: categoryLabel(c.locale, r.lesson!.categoryId, c.firmLists!.workCategories),
              costComparison: closedLessonText(r.lesson!, c.locale, c.firmLists!.workCategories),
              quotedPrice: formatMoney(r.lesson!.quoteBeforeTax, r.lesson!.currency),
              reconciledActualCost: formatMoney(r.lesson!.actualCost, r.lesson!.currency),
            })),
        );
      }
    } else if (name === "get_saved_comparison") {
      const page = await createComparisonServices().getHomeComparison.execute(c, key);
      if (page?.kind !== "AVAILABLE") {
        expect(tool.sources).toEqual([]);
        return;
      }
      const text =
        page.economics?.claims
          .filter((claim) => claim.evidenceReferenceIds.length)
          .map((claim) => claimFindingText(claim, c.locale, c.firmLists!.workCategories))
          .filter(Boolean) ?? [];
      expect((tool.sources[0]?.facts.findings as { text: string }[]).map((f) => f.text)).toEqual(
        text,
      );
      const keys =
        page.economics?.selectedProjectKeys ?? page.comparison.defaultSelectedProjectKeys;
      expect(tool.sources[0]?.facts.pastJobs).toEqual(
        page.comparison.matches
          .filter((m) => keys.includes(m.project.projectKey))
          .map((m) => ({
            name: c.locale === "en" ? m.project.nameEn : m.project.nameZhTw,
            score: `${m.displayScore}/100`,
          })),
      );
    } else {
      const page = await new GetQuotedHistory(
        new PrismaQuoteDraftRepository(getPrismaClient()),
      ).execute(c, key);
      if (page.kind !== "AVAILABLE") {
        expect(tool.sources).toEqual([]);
        return;
      }
      expect(tool.sources).toHaveLength(page.baselines.length);
      for (const b of page.baselines) {
        const row = tool.sources.find((s) => s.facts.categoryId === b.categoryId)!;
        expect(row.facts.count).toBe(b.history.eligibleObservationCount);
        for (const [field, rate] of [
          ["displayMedian", b.history.medianNormalizedAmount],
          ["displayLow", b.history.minimumNormalizedAmount],
          ["displayHigh", b.history.maximumNormalizedAmount],
        ] as const) {
          expect(row.facts[field]).toBe(
            rate
              ? `${formatQuoteRate(rate, page.job.currency, c.firmLists!.areaDisplayUnit)}/m²`
              : undefined,
          );
        }
      }
    }
    if (c.role === "VIEWER")
      expect(JSON.stringify(modelFacts(tool.sources.map((s) => s.facts)))).not.toMatch(
        /NT\$|totalAmount|unitPrice/,
      );
  });
});
