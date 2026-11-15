import { parseComparisonRouteSearch } from "@/modules/comparison-experience/route-state";
import {
  evidenceSelectionParams,
  parseEvidenceSelection,
} from "@/modules/evidence-panel/route-state";
import type { EvidencePanelSelection } from "@/modules/evidence-panel/contracts";
import type { Locale } from "@/modules/localization/config";

export const INTERNAL_REVIEW_QUERY_KEYS = Object.freeze([
  "proposal",
  "action",
  "reviewTitle",
  "reviewRationale",
  "reviewAssignee",
  "reviewDue",
  "reviewReturn",
  "reviewEvidence",
  "reviewError",
  "reviewReplay",
]);
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const SAFE_OPTION = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
type Search = Readonly<Record<string, string | readonly string[] | undefined>>;

export type ReviewDraftSelection = Readonly<{
  titleKey?: string | undefined;
  rationaleKey?: string | undefined;
  assigneeKey?: string | undefined;
  dueDate?: string | undefined;
}>;

export type ReviewReturnContext = Readonly<{
  selectedProjectKeys: readonly string[];
  evidenceSelection?: EvidencePanelSelection | undefined;
  evidenceReturnId?: string | undefined;
}>;

export type InternalReviewRouteState = Readonly<{
  proposalKey?: string | undefined;
  actionKey?: string | undefined;
  returnId?: string | undefined;
  evidenceActive?: boolean | undefined;
  errorKind?: string | undefined;
  replay?: boolean | undefined;
  draft: ReviewDraftSelection;
}>;

function first(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

export function safeReviewKey(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_KEY.test(value) ? value : undefined;
}

function option(value: string | undefined): string | undefined {
  return value && SAFE_OPTION.test(value) ? value : undefined;
}

export function parseInternalReviewRoute(search: Search): InternalReviewRouteState {
  const date = first(search.reviewDue);
  const actionKey = safeReviewKey(first(search.action));
  return Object.freeze({
    proposalKey: actionKey ? undefined : safeReviewKey(first(search.proposal)),
    actionKey,
    returnId: safeReviewKey(first(search.reviewReturn)),
    evidenceActive: first(search.reviewEvidence) === "1",
    replay: first(search.reviewReplay) === "1",
    errorKind: [
      "ACTION_NOT_AUTHORIZED",
      "PROPOSAL_NOT_AUTHORIZED",
      "EVIDENCE_UNAVAILABLE",
      "PROPOSAL_EXPIRED",
    ].includes(first(search.reviewError) ?? "")
      ? first(search.reviewError)
      : undefined,
    draft: Object.freeze({
      titleKey: option(first(search.reviewTitle)),
      rationaleKey: option(first(search.reviewRationale)),
      assigneeKey: safeReviewKey(first(search.reviewAssignee)),
      dueDate: date === "" || (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) ? date : undefined,
    }),
  });
}

export function reviewReturnContext(search: Search): ReviewReturnContext {
  const parsed = parseComparisonRouteSearch(search);
  const selection = parseEvidenceSelection(parsed);
  return Object.freeze({
    selectedProjectKeys: parsed.selectedProjectKeys,
    ...(selection ? { evidenceSelection: selection } : {}),
    ...(parsed.evidenceReturnId ? { evidenceReturnId: parsed.evidenceReturnId } : {}),
  });
}

export function setReviewDraft(params: URLSearchParams, draft: ReviewDraftSelection): void {
  const entries = [
    ["reviewTitle", option(draft.titleKey)],
    ["reviewRationale", option(draft.rationaleKey)],
    ["reviewAssignee", safeReviewKey(draft.assigneeKey)],
    [
      "reviewDue",
      draft.dueDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate ?? "invalid")
        ? draft.dueDate
        : undefined,
    ],
  ] as const;
  for (const [key, value] of entries) {
    if (value !== undefined) params.set(key, value);
    else params.delete(key);
  }
}

function contextParams(
  comparisonRunId: string,
  enrichmentRunId: string,
  context: ReviewReturnContext,
): URLSearchParams {
  const params = new URLSearchParams();
  if (safeReviewKey(comparisonRunId)) params.set("run", comparisonRunId);
  if (safeReviewKey(enrichmentRunId)) params.set("economics", enrichmentRunId);
  const selected = [
    ...new Set(context.selectedProjectKeys.filter((key) => safeReviewKey(key))),
  ].slice(0, 3);
  if (selected.length) params.set("selected", selected.join(","));
  if (context.evidenceSelection) {
    for (const [key, value] of Object.entries(evidenceSelectionParams(context.evidenceSelection))) {
      params.set(key, value);
    }
  }
  if (safeReviewKey(context.evidenceReturnId))
    params.set("evidenceReturn", context.evidenceReturnId!);
  return params;
}

export function internalReviewHref(
  locale: Locale,
  projectKey: string,
  source: Readonly<{
    comparisonRunId: string;
    enrichmentRunId: string;
    returnContext: ReviewReturnContext;
  }>,
  state: Partial<InternalReviewRouteState> = {},
  surface: "compare" | "actions" = "compare",
): string {
  const params = contextParams(
    source.comparisonRunId,
    source.enrichmentRunId,
    source.returnContext,
  );
  if (safeReviewKey(state.actionKey)) params.set("action", state.actionKey!);
  else if (safeReviewKey(state.proposalKey)) {
    params.set("proposal", state.proposalKey!);
    if (state.draft) setReviewDraft(params, state.draft);
  }
  if (safeReviewKey(state.returnId)) params.set("reviewReturn", state.returnId!);
  if (state.actionKey && state.replay) params.set("reviewReplay", "1");
  const query = params.toString();
  return `/${locale}/projects/${encodeURIComponent(projectKey)}/${surface}${query ? `?${query}` : ""}`;
}

export function projectActionsHref(locale: Locale, projectKey: string, actionKey?: string): string {
  const params = new URLSearchParams();
  if (safeReviewKey(actionKey)) params.set("action", actionKey!);
  return `/${locale}/projects/${encodeURIComponent(projectKey)}/actions${params.size ? `?${params}` : ""}`;
}
