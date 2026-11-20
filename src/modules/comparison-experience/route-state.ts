import type { Locale } from "@/modules/localization/config";

const SAFE_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const MAX_SELECTED_PROJECTS = 3;

export type ComparisonRouteSearch = Readonly<{
  comparisonRunId?: string | undefined;
  economicsRunId?: string | undefined;
  selectedProjectKeys: readonly string[];
  outcome?: string | undefined;
  requestId?: string | undefined;
  missingFields: readonly string[];
  evidenceMode?: string | undefined;
  evidenceClaimKey?: string | undefined;
  evidenceCandidateProjectKey?: string | undefined;
  evidenceFactorKey?: string | undefined;
  evidenceSourceKey?: string | undefined;
  evidenceConflictKey?: string | undefined;
  evidenceReturnId?: string | undefined;
}>;

type SearchParams = Readonly<Record<string, string | readonly string[] | undefined>>;

function first(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

function safeIdentifier(value: string | undefined): string | undefined {
  if (!value || !SAFE_IDENTIFIER.test(value)) return undefined;
  return value;
}

function parseList(value: string | undefined, limit = MAX_SELECTED_PROJECTS): readonly string[] {
  if (!value) return Object.freeze([]);
  const result: string[] = [];
  for (const item of value.split(",")) {
    const safe = safeIdentifier(item.trim());
    if (!safe || result.includes(safe)) continue;
    result.push(safe);
    if (result.length === limit) break;
  }
  return Object.freeze(result);
}

export function parseComparisonRouteSearch(search: SearchParams): ComparisonRouteSearch {
  return Object.freeze({
    comparisonRunId: safeIdentifier(first(search.run)),
    economicsRunId: safeIdentifier(first(search.economics)),
    selectedProjectKeys: parseList(first(search.selected)),
    outcome: safeIdentifier(first(search.outcome)),
    requestId: safeIdentifier(first(search.requestId)),
    missingFields: parseList(first(search.missing), 20),
    evidenceMode: safeIdentifier(first(search.evidenceMode)),
    evidenceClaimKey: safeIdentifier(first(search.evidenceClaim)),
    evidenceCandidateProjectKey: safeIdentifier(first(search.evidenceCandidate)),
    evidenceFactorKey: safeIdentifier(first(search.evidenceFactor)),
    evidenceSourceKey: safeIdentifier(first(search.evidenceSource)),
    evidenceConflictKey: safeIdentifier(first(search.evidenceConflict)),
    evidenceReturnId: safeIdentifier(first(search.evidenceReturn)),
  });
}

export function sanitizeSelectedProjectKeys(
  requested: readonly string[],
  authorizedProjectKeys: readonly string[],
  fallback: readonly string[],
): readonly string[] {
  const authorized = new Set(authorizedProjectKeys);
  const selected: string[] = [];
  for (const key of requested) {
    if (!authorized.has(key) || selected.includes(key)) continue;
    selected.push(key);
    if (selected.length === MAX_SELECTED_PROJECTS) break;
  }
  if (selected.length > 0) return Object.freeze(selected);

  for (const key of fallback) {
    if (!authorized.has(key) || selected.includes(key)) continue;
    selected.push(key);
    if (selected.length === MAX_SELECTED_PROJECTS) break;
  }
  return Object.freeze(selected);
}

export function comparisonHref(
  locale: Locale,
  projectKey: string,
  state: Readonly<{
    comparisonRunId?: string | undefined;
    economicsRunId?: string | undefined;
    selectedProjectKeys?: readonly string[] | undefined;
    outcome?: string | undefined;
    requestId?: string | undefined;
    missingFields?: readonly string[] | undefined;
    evidenceClaimKey?: string | undefined;
  }> = {},
): string {
  const params = new URLSearchParams();
  if (state.comparisonRunId) params.set("run", state.comparisonRunId);
  if (state.economicsRunId) params.set("economics", state.economicsRunId);
  if (state.selectedProjectKeys?.length) {
    params.set("selected", state.selectedProjectKeys.slice(0, MAX_SELECTED_PROJECTS).join(","));
  }
  if (state.outcome) params.set("outcome", state.outcome);
  if (state.requestId) params.set("requestId", state.requestId);
  if (state.missingFields?.length) params.set("missing", state.missingFields.join(","));
  if (state.evidenceClaimKey && SAFE_IDENTIFIER.test(state.evidenceClaimKey)) {
    params.set("evidenceMode", "claim");
    params.set("evidenceClaim", state.evidenceClaimKey);
  }
  const query = params.toString();
  return `/${locale}/projects/${encodeURIComponent(projectKey)}/compare${query ? `?${query}` : ""}`;
}

export function selectedKeysFromFormData(formData: FormData): readonly string[] {
  const values = formData
    .getAll("selectedProjectKey")
    .map((value) => (typeof value === "string" ? value : ""));
  return parseList(values.join(","));
}

/** Validate a user command before any route-reader truncation or default fallback. */
export function submittedSelectedProjectKeys(
  formData: FormData,
  authorizedProjectKeys: readonly string[],
): readonly string[] | null {
  const values = formData.getAll("selectedProjectKey");
  if (values.length === 0 || values.length > MAX_SELECTED_PROJECTS) return null;
  if (values.some((key) => typeof key !== "string" || !SAFE_IDENTIFIER.test(key))) return null;
  const requested = new Set(values as string[]);
  const selected = authorizedProjectKeys.filter((key) => requested.has(key));
  if (selected.length !== requested.size || selected.length === 0) return null;
  return Object.freeze(selected);
}
