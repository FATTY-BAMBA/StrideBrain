import { createHash } from "node:crypto";
import type { ListAuthorizedProjects } from "@/modules/projects/application/list-authorized-projects";
import type { GetProjectWorkspace } from "@/modules/projects/application/get-project-workspace";
import type { GetQuoteIssue } from "@/modules/quote-issue/application/issue-services";
import type { GetHomeComparison } from "@/modules/home-intelligence/application/get-home-comparison";
import type { GetHomeDesk } from "@/modules/home-desk/application/get-home-desk";
import type { GetQuotedHistory } from "@/modules/quote-draft/application/get-quoted-history";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { AssistantRepositoryPort } from "@/repositories/ports/assistant-repository";
import { inStageGroup, parseStageGroup } from "@/modules/projects/domain/stage-groups";
import { PROJECT_STAGES } from "@/modules/projects/domain/job-input";
import { categoryLabel, projectStageLabel } from "@/modules/localization/jobs";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
import { formatQuoteRate } from "@/modules/quote-draft/presentation";
import { formatMoney } from "@/modules/finance/format-money";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import { record } from "../domain/grounding";
import type { AssistantSource, ToolCall, ToolDefinition, ToolResult } from "../domain/contracts";

const keySchema = {
  type: "string",
  description: "Exact job reference returned by list_jobs, never a database id.",
  maxLength: 128,
};
const jobParameters = {
  type: "object",
  properties: { projectKey: keySchema },
  required: ["projectKey"],
  additionalProperties: false,
};
export const assistantTools: readonly ToolDefinition[] = [
  {
    name: "list_jobs",
    description:
      "Find authorized jobs by stage group or name/reference. Use query to find a named job. Excluded jobs are skipped. Bounded page, use offset when truncated.",
    parameters: {
      type: "object",
      properties: {
        stageGroup: { type: "string", enum: ["inquiry", "quote", "confirmed", "work", "closed"] },
        query: { type: "string", maxLength: 128 },
        offset: { type: "integer", minimum: 0, maximum: 1000 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_job",
    description: "Read a job overview; no financial amounts.",
    parameters: jobParameters,
  },
  {
    name: "get_quote_status",
    description:
      "Read current quote status, latest issued document number, validity, acceptance and server-formatted quote amounts (latest issued, otherwise current draft). Restricted without quote access.",
    parameters: jobParameters,
  },
  {
    name: "list_awaiting_client",
    description: "Issued quotes not yet accepted, as on Home. No draft or accepted quotes.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_saved_comparison",
    description:
      "Read only the reader's current saved comparison and exact finding sentences. Never runs a new comparison.",
    parameters: jobParameters,
  },
  {
    name: "get_past_prices",
    description:
      "Per pricing category, quoted history count, median and range using the Quote tab's calculation and current saved comparison. These are quoted prices, never actual costs.",
    parameters: {
      ...jobParameters,
      properties: { projectKey: keySchema, categoryId: { type: "string", maxLength: 64 } },
    },
  },
  {
    name: "get_closed_job_lessons",
    description:
      "Read the same recent closed-job lessons as Home; reconciled actual cost is distinct from quote price.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
];
export type AssistantReadServices = Readonly<{
  projects: Pick<ListAuthorizedProjects, "execute">;
  workspace: Pick<GetProjectWorkspace, "execute">;
  quote: Pick<GetQuoteIssue, "execute">;
  comparison: Pick<GetHomeComparison, "execute">;
  history: Pick<GetQuotedHistory, "execute">;
  home: Pick<GetHomeDesk, "execute">;
}>;
const empty = (status: ToolResult["status"]): ToolResult => ({ status, sources: [] });
export class AssistantReadTools {
  constructor(
    private readonly services: AssistantReadServices,
    private readonly policies: Pick<AssistantRepositoryPort, "jobPolicy">,
  ) {}
  async canSend(c: RuntimeContext, sources: readonly AssistantSource[]) {
    for (const key of new Set(sources.flatMap((s) => s.projectKeys))) {
      const policy = await this.policies.jobPolicy(c, key);
      if (!policy || policy.excluded) return false;
    }
    return true;
  }
  async execute(c: RuntimeContext, call: ToolCall): Promise<ToolResult> {
    if (!c.capabilities.has("project:read")) return empty("UNAVAILABLE");
    const definition = assistantTools.find((t) => t.name === call.name),
      args = record(call.arguments);
    if (!definition || !args) return empty("UNAVAILABLE");
    const properties = definition.parameters.properties as Record<string, unknown>;
    if (Object.keys(args).some((k) => !Object.hasOwn(properties, k))) return empty("UNAVAILABLE");
    const projectKey = args.projectKey;
    if (
      "projectKey" in properties &&
      (typeof projectKey !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(projectKey))
    )
      return empty("UNAVAILABLE");
    if (typeof projectKey === "string") {
      const policy = await this.policies.jobPolicy(c, projectKey);
      if (!policy) return empty("UNAVAILABLE");
      if (policy.excluded) return empty("EXCLUDED");
    }
    const href = (key: string, suffix = "") =>
      `/${c.locale}/projects/${encodeURIComponent(key)}${suffix}`;
    const source = (
      identity: string,
      label: string,
      link: string,
      facts: Record<string, unknown>,
      projectKeys: readonly string[],
      typedFactPaths: readonly string[] = [],
    ): AssistantSource => ({
      sourceId: `src_${createHash("sha256")
        .update(`${call.name}:${identity}:${JSON.stringify(facts)}`)
        .digest("hex")
        .slice(0, 24)}`,
      label,
      href: link,
      facts,
      projectKeys,
      typedFactPaths,
    });
    const finish = (sources: AssistantSource[]): ToolResult =>
      sources.length ? { status: "OK", sources } : empty("NO_RECORDS");
    const list = async () => {
      const result = await this.services.projects.execute(c);
      return result.kind === "AVAILABLE" ? result.projects : null;
    };
    if (call.name === "list_jobs") {
      if (
        (args.stageGroup !== undefined && !parseStageGroup(args.stageGroup)) ||
        (args.query !== undefined && (typeof args.query !== "string" || args.query.length > 128)) ||
        (args.offset !== undefined &&
          (!Number.isInteger(args.offset) || Number(args.offset) < 0 || Number(args.offset) > 1000))
      )
        return empty("UNAVAILABLE");
      const jobs = await list();
      if (!jobs) return empty("UNAVAILABLE");
      const query = typeof args.query === "string" ? args.query.toLocaleLowerCase() : "",
        group = parseStageGroup(args.stageGroup);
      const alternate = query
        ? await this.services.projects.execute({ ...c, locale: c.locale === "en" ? "zh-TW" : "en" })
        : null;
      const alternateNames = new Map(
        alternate?.kind === "AVAILABLE"
          ? alternate.projects.map((j) => [j.businessKey, j.name])
          : [],
      );
      const candidates = jobs.filter(
        (j) =>
          (!group || inStageGroup(j.stage, group)) &&
          (!query ||
            `${j.name} ${j.businessKey} ${alternateNames.get(j.businessKey) ?? ""}`
              .toLocaleLowerCase()
              .includes(query)),
      );
      const allowed = [];
      let excludedMatch = false;
      for (const j of candidates) {
        const p = await this.policies.jobPolicy(c, j.businessKey);
        if (p && !p.excluded) allowed.push(j);
        else if (p?.excluded) excludedMatch = true;
      }
      if (query && !allowed.length && excludedMatch) return empty("EXCLUDED");
      const offset = Number(args.offset ?? 0),
        page = allowed.slice(offset, offset + 20);
      const sources = page.map((j) =>
        source(
          j.businessKey,
          j.name,
          href(j.businessKey),
          { reference: j.businessKey, name: j.name, stage: projectStageLabel(c.locale, j.stage) },
          [j.businessKey],
          ["reference", "stage"],
        ),
      );
      if (sources.length)
        sources.push(
          source(
            "page",
            c.locale === "zh-TW" ? "專案" : "Jobs",
            `/${c.locale}/projects`,
            {
              count: page.length,
              truncated: allowed.length > offset + 20,
              ...(allowed.length > offset + 20 ? { nextOffset: offset + 20 } : {}),
            },
            page.map((j) => j.businessKey),
            ["count", "nextOffset"],
          ),
        );
      return finish(sources);
    }
    if (call.name === "get_job" && typeof projectKey === "string") {
      const result = await this.services.workspace.execute(c, projectKey);
      if (result.kind !== "AVAILABLE") return empty("UNAVAILABLE");
      const j = result.workspace.project;
      const stage = PROJECT_STAGES.find((stage) => stage === j.stage);
      return finish([
        source(
          projectKey,
          j.name.display,
          href(projectKey),
          {
            reference: projectKey,
            name: j.name.display,
            stage: stage ? projectStageLabel(c.locale, stage) : j.stage,
            city: j.location.city,
            area: j.area,
            scopeCategories: j.scopeCategories.map((s) => s.name.display),
          },
          [projectKey],
          ["reference", "stage", "area"],
        ),
      ]);
    }
    if (call.name === "get_quote_status" && typeof projectKey === "string") {
      if (!c.capabilities.has("quote:read")) return empty("UNAVAILABLE");
      const q = await this.services.quote.execute(c, projectKey);
      if (q.kind !== "AVAILABLE") return empty("UNAVAILABLE");
      const issued = q.latestIssued ?? q.issued;
      return finish([
        source(
          projectKey,
          projectKey,
          href(projectKey, "/quote"),
          {
            reference: projectKey,
            status: q.status,
            amounts: q.amounts
              ? {
                  ...q.amounts,
                  amountBeforeTax: formatMoney(q.amounts.amountBeforeTax, q.amounts.currency),
                  taxAmount: formatMoney(q.amounts.taxAmount, q.amounts.currency),
                  totalAmount: formatMoney(q.amounts.totalAmount, q.amounts.currency),
                }
              : null,
            issued: issued
              ? {
                  status: issued.status,
                  documentNumber: issued.documentNumber,
                  validUntil: issued.validUntil,
                  acceptedOn: issued.acceptedOn,
                }
              : null,
          },
          [projectKey],
          ["reference", "status", "issued", "amounts"],
        ),
      ]);
    }
    if (call.name === "list_awaiting_client" || call.name === "get_closed_job_lessons") {
      const home = await this.services.home.execute(c);
      if (home.kind !== "AVAILABLE") return empty("UNAVAILABLE");
      const sources: AssistantSource[] = [];
      if (call.name === "list_awaiting_client") {
        if (!c.capabilities.has("quote:read") || home.decisionsUnavailable)
          return empty("UNAVAILABLE");
        for (const row of home.decisions.filter((d) => d.kind === "AWAITING_CLIENT").slice(0, 20)) {
          const p = await this.policies.jobPolicy(c, row.project.businessKey);
          if (!p || p.excluded) continue;
          sources.push(
            source(
              row.key,
              row.project.name,
              href(row.project.businessKey, "/quote"),
              {
                name: row.project.name,
                reference: row.project.businessKey,
                documentNumber: row.documentNumber,
                validUntil: row.validUntil,
                status: "ISSUED",
                acceptedOn: null,
              },
              [row.project.businessKey],
              ["reference", "documentNumber", "validUntil", "status", "acceptedOn"],
            ),
          );
        }
      } else {
        if (home.closedJobsUnavailable) return empty("UNAVAILABLE");
        for (const row of home.closedJobs) {
          const p = await this.policies.jobPolicy(c, row.project.businessKey);
          if (!p || p.excluded || !row.lesson || row.financialState !== "AVAILABLE") continue;
          sources.push(
            source(
              row.project.businessKey,
              row.project.name,
              href(row.project.businessKey),
              {
                name: row.project.name,
                category: categoryLabel(c.locale, row.lesson.categoryId),
                ...row.lesson,
                quotedPrice: formatMoney(row.lesson.quoteBeforeTax, row.lesson.currency),
                reconciledActualCost: formatMoney(row.lesson.actualCost, row.lesson.currency),
              },
              [row.project.businessKey],
              [
                "category",
                "quoteBeforeTax",
                "actualCost",
                "difference",
                "currency",
                "quotedPrice",
                "reconciledActualCost",
              ],
            ),
          );
        }
      }
      if (sources.length)
        sources.push(
          source(
            "count",
            c.locale === "zh-TW" ? "紀錄" : "Records",
            `/${c.locale}`,
            { count: sources.length },
            sources.flatMap((s) => s.projectKeys),
            ["count"],
          ),
        );
      return finish(sources);
    }
    if (call.name === "get_saved_comparison" && typeof projectKey === "string") {
      const saved = await this.services.comparison.execute(c, projectKey);
      if (!saved) return empty("NO_RECORDS");
      if (saved.kind !== "AVAILABLE") return empty(saved.kind);
      const selected =
        saved.economics?.selectedProjectKeys ?? saved.comparison.defaultSelectedProjectKeys;
      const keys = [projectKey, ...selected];
      const link = comparisonHref(c.locale, projectKey, {
        comparisonRunId: saved.comparison.run.id,
        ...(saved.economics ? { economicsRunId: saved.economics.run.id } : {}),
        selectedProjectKeys: selected,
      });
      const findings =
        saved.economics?.claims.flatMap((claim) => {
          const text = claimFindingText(claim, c.locale);
          return text && claim.evidenceReferenceIds.length
            ? [{ text, evidenceReferenceIds: claim.evidenceReferenceIds }]
            : [];
        }) ?? [];
      const sources = [
        source(
          saved.comparison.run.id,
          projectKey,
          link,
          {
            pastJobs: saved.comparison.matches
              .filter((m) => selected.includes(m.project.projectKey))
              .map((m) => ({
                name: c.locale === "zh-TW" ? m.project.nameZhTw : m.project.nameEn,
                score: `${m.displayScore}/100`,
              })),
            findings,
          },
          keys,
          ["pastJobs.*.score", "findings.*.text"],
        ),
      ];
      if (!(await this.canSend(c, sources))) return empty("UNAVAILABLE");
      return finish(sources);
    }
    if (call.name === "get_past_prices" && typeof projectKey === "string") {
      if (
        args.categoryId !== undefined &&
        (typeof args.categoryId !== "string" || !/^[A-Z_]{1,64}$/.test(args.categoryId))
      )
        return empty("UNAVAILABLE");
      const result = await this.services.history.execute(c, projectKey);
      if (result.kind !== "AVAILABLE") return empty(result.kind);
      const keys = [projectKey, ...result.projectKeys];
      const sources = result.baselines
        .filter((b) => !args.categoryId || args.categoryId === b.categoryId)
        .map((b) =>
          source(
            `${result.comparisonRunId}:${b.categoryId}`,
            categoryLabel(c.locale, b.categoryId),
            href(projectKey, "/quote"),
            {
              categoryId: b.categoryId,
              category: categoryLabel(c.locale, b.categoryId),
              observationType: "QUOTED_PRICE",
              count: b.history.eligibleObservationCount,
              median: b.history.medianNormalizedAmount,
              low: b.history.minimumNormalizedAmount,
              high: b.history.maximumNormalizedAmount,
              unit: `${result.job.currency}/${result.job.areaUnit}`,
              evidenceReferenceIds: b.history.evidenceReferenceIds,
              ...(b.history.medianNormalizedAmount
                ? {
                    displayMedian: formatQuoteRate(
                      b.history.medianNormalizedAmount,
                      result.job.currency,
                    ),
                    displayLow: formatQuoteRate(
                      b.history.minimumNormalizedAmount!,
                      result.job.currency,
                    ),
                    displayHigh: formatQuoteRate(
                      b.history.maximumNormalizedAmount!,
                      result.job.currency,
                    ),
                  }
                : {}),
            },
            keys,
            [
              "category",
              "observationType",
              "count",
              "median",
              "low",
              "high",
              "unit",
              "displayMedian",
              "displayLow",
              "displayHigh",
            ],
          ),
        );
      if (!(await this.canSend(c, sources))) return empty("UNAVAILABLE");
      return finish(sources);
    }
    return empty("UNAVAILABLE");
  }
}
