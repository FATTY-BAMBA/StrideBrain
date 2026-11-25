import type { FirmLists } from "@/modules/firm-lists/domain/contracts";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import {
  ClosedJobEconomicsService,
  type ClosedJobLesson,
} from "@/modules/economics/domain/closed-job-economics-service";
import { quoteReviewFinding } from "../domain/quote-review-finding";
import type { StructuredEconomicsClaimDTO } from "@/modules/economics/domain/contracts";
import type { GetHomeComparison } from "@/modules/home-intelligence/application/get-home-comparison";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectEntryDTO } from "@/modules/projects/application/list-authorized-projects";
import {
  inStageGroup,
  stageGroups,
  type StageGroupKey,
} from "@/modules/projects/domain/stage-groups";
import type { HomeDeskRepositoryPort } from "@/repositories/ports/home-desk-repository";

export type HomeDecision = Readonly<{
  key: string;
  kind: "CONFIRM_REVIEW" | "REVIEW_QUOTE" | "ISSUE_QUOTE" | "AWAITING_CLIENT" | "DRAFT_QUOTE";
  project: ProjectEntryDTO;
  documentNumber?: string;
  validUntil?: string;
  canAccept?: boolean;
  claim?: StructuredEconomicsClaimDTO | undefined;
  additionalFindingCount?: number | undefined;
  comparisonRunId?: string | undefined;
  enrichmentRunId?: string | undefined;
  proposalKey?: string | undefined;
  selectedProjectKeys?: readonly string[] | undefined;
}>;
export type HomeDesk = Readonly<{
  catalog: FirmLists;
  kind: "AVAILABLE";
  projects: readonly ProjectEntryDTO[];
  canCreate: boolean;
  stageCounts: readonly Readonly<{ key: StageGroupKey; count: number }>[];
  decisions: readonly HomeDecision[];
  findingsNotices: readonly Readonly<{
    project: ProjectEntryDTO;
    kind: "OUT_OF_DATE" | "UNAVAILABLE";
  }>[];
  decisionsUnavailable: boolean;
  closedJobsUnavailable: boolean;
  closedJobs: readonly Readonly<{
    project: ProjectEntryDTO;
    lesson: ClosedJobLesson | null;
    financialState: "AVAILABLE" | "RESTRICTED" | "UNAVAILABLE";
  }>[];
}>;
export type HomeDeskOutcome = HomeDesk | Readonly<{ kind: "UNAVAILABLE" }>;
const priority = {
  CONFIRM_REVIEW: 0,
  REVIEW_QUOTE: 1,
  ISSUE_QUOTE: 2,
  AWAITING_CLIENT: 3,
  DRAFT_QUOTE: 4,
} as const;

export class GetHomeDesk {
  constructor(
    private readonly repository: HomeDeskRepositoryPort,
    private readonly comparisons: Pick<GetHomeComparison, "execute">,
    private readonly clock = () => new Date(),
    private readonly authorization = new AuthorizationService(),
    private readonly economics = new ClosedJobEconomicsService(),
  ) {}
  async execute(context: RuntimeContext): Promise<HomeDeskOutcome> {
    if (!context.capabilities.has("project:read") || !context.firmLists)
      return { kind: "UNAVAILABLE" };
    let records;
    try {
      records = (await this.repository.listReadableProjects(context)).filter(
        (row) =>
          row.organizationId === context.organizationId &&
          this.authorization.canReadProject(context, row.id).allowed,
      );
    } catch {
      return { kind: "UNAVAILABLE" };
    }
    const entry = (row: (typeof records)[number]): ProjectEntryDTO => ({
      businessKey: row.businessKey,
      name: context.locale === "zh-TW" ? row.nameZhTw : row.nameEn,
      stage: row.stage,
      active: row.status === "ACTIVE",
    });
    const projects = records.map(entry);
    const decisions: HomeDecision[] = [];
    const findingsNotices: { project: ProjectEntryDTO; kind: "OUT_OF_DATE" | "UNAVAILABLE" }[] = [];
    const closedJobs: HomeDesk["closedJobs"][number][] = [];
    let decisionsUnavailable = false;
    let closedJobsUnavailable = false;
    const now = this.clock();
    const active = records.filter((row) => row.status === "ACTIVE");
    try {
      const proposals = await this.repository.listDecisionSources(
        context,
        active.map((row) => row.id),
        now,
      );
      for (const proposal of proposals) {
        const job = active.find((row) => row.id === proposal.projectId);
        if (proposal.kind === "ISSUE_QUOTE" || proposal.kind === "AWAITING_CLIENT") {
          if (
            job &&
            proposal.organizationId === context.organizationId &&
            this.authorization.canReadCommercial(context, job.id, "QUOTE").allowed &&
            (proposal.kind !== "ISSUE_QUOTE" || context.capabilities.has("quote:issue"))
          )
            decisions.push({
              key: proposal.key,
              kind: proposal.kind,
              project: entry(job),
              ...(proposal.kind === "AWAITING_CLIENT"
                ? {
                    documentNumber: proposal.documentNumber,
                    validUntil: proposal.validUntil,
                    canAccept: context.capabilities.has("project:update"),
                  }
                : {}),
            });
          continue;
        }
        if (proposal.kind === "DRAFT_QUOTE") {
          if (
            job &&
            proposal.organizationId === context.organizationId &&
            context.capabilities.has("quote:draft") &&
            context.capabilities.has("quote:read") &&
            ["DISCOVERY", "DESIGN", "QUOTE_REVIEW"].includes(job.stage)
          )
            decisions.push({ key: proposal.key, kind: "DRAFT_QUOTE", project: entry(job) });
          continue;
        }
        if (
          !job ||
          proposal.organizationId !== context.organizationId ||
          proposal.membershipId !== context.membershipId ||
          !(Date.parse(proposal.expiresAt) > now.getTime()) ||
          !this.authorization.canCreateInternalReview(context, job.id).allowed
        )
          continue;
        decisions.push({
          key: proposal.key,
          kind: "CONFIRM_REVIEW",
          project: entry(job),
          proposalKey: proposal.key,
          comparisonRunId: proposal.comparisonRunId,
          enrichmentRunId: proposal.enrichmentRunId,
        });
      }
    } catch {
      decisionsUnavailable = true;
    }
    if (context.capabilities.has("project:compare")) {
      try {
        const compared = new Set(
          await this.repository.listComparedProjectIds(
            context,
            active.map((row) => row.id),
          ),
        );
        // Sequential bounded per-job reads avoid an unbounded database fan-out.
        for (const job of active) {
          const project = entry(job);
          if (
            decisions.some(
              (decision) =>
                decision.kind === "DRAFT_QUOTE" && decision.project.businessKey === job.businessKey,
            )
          )
            continue;
          if (!compared.has(job.id)) continue;
          try {
            const saved = await this.comparisons.execute(context, job.businessKey);
            if (!saved || saved.kind !== "AVAILABLE") {
              findingsNotices.push({ project, kind: saved?.kind ?? "UNAVAILABLE" });
              continue;
            }
            const issueIndex = decisions.findIndex(
              (decision) =>
                decision.kind === "ISSUE_QUOTE" && decision.project.businessKey === job.businessKey,
            );
            if (job.stage !== "QUOTE_REVIEW" && issueIndex < 0) continue;
            const commercial =
              this.authorization.canReadProject(context, job.id).commercialScope !== "NONE";
            if (!commercial || saved.economics?.accessScope === "STRUCTURAL_ONLY") continue;
            if (!saved.economics) {
              findingsNotices.push({ project, kind: "UNAVAILABLE" });
              continue;
            }
            const finding = quoteReviewFinding(saved.economics.claims);
            if (finding && issueIndex >= 0) {
              decisions[issueIndex] = { ...decisions[issueIndex]!, ...finding };
            } else if (finding && !context.capabilities.has("quote:issue"))
              decisions.push({
                key: `review:${job.businessKey}`,
                kind: "REVIEW_QUOTE",
                project,
                ...finding,
                comparisonRunId: saved.comparison.run.id,
                enrichmentRunId: saved.economics?.run.id,
                selectedProjectKeys: saved.economics?.selectedProjectKeys,
              });
          } catch {
            findingsNotices.push({ project, kind: "UNAVAILABLE" });
          }
        }
      } catch {
        decisionsUnavailable = true;
      }
    }
    try {
      const rows = await this.repository.listClosedJobs(
        context,
        records.map((row) => row.id),
      );
      for (const row of rows
        .filter(
          (row) =>
            row.organizationId === context.organizationId &&
            records.some((job) => job.id === row.id) &&
            row.stage === "COMPLETE",
        )
        .sort(
          (a, b) =>
            b.completedAt.localeCompare(a.completedAt) ||
            a.businessKey.localeCompare(b.businessKey),
        )
        .slice(0, 3)) {
        const authorized =
          this.authorization.canReadCommercial(context, row.id, "QUOTE").allowed &&
          this.authorization.canReadCommercial(context, row.id, "ACTUAL").allowed &&
          this.authorization.canReadEvidence(context, row.id).allowed;
        const lesson =
          authorized && row.financials
            ? this.economics.calculate(row.financials, now.toISOString().slice(0, 10))
            : null;
        closedJobs.push({
          project: entry(row),
          lesson,
          financialState: !authorized ? "RESTRICTED" : lesson ? "AVAILABLE" : "UNAVAILABLE",
        });
      }
    } catch {
      closedJobsUnavailable = true;
    }
    decisions.sort(
      (a, b) =>
        priority[a.kind] - priority[b.kind] ||
        a.project.businessKey.localeCompare(b.project.businessKey) ||
        a.key.localeCompare(b.key),
    );
    return {
      kind: "AVAILABLE",
      catalog: context.firmLists,
      projects,
      canCreate: context.capabilities.has("project:create"),
      stageCounts: stageGroups.map((group) => ({
        key: group.key,
        count: projects.filter((job) => inStageGroup(job.stage, group.key)).length,
      })),
      // A job occupies its highest-priority row only.
      decisions: decisions.filter(
        (decision, index) =>
          decisions.findIndex(
            (item) => item.project.businessKey === decision.project.businessKey,
          ) === index,
      ),
      findingsNotices,
      decisionsUnavailable,
      closedJobsUnavailable,
      closedJobs,
    };
  }
}
