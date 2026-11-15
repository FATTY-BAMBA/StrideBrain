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
}>;

type SearchParams = Readonly<Record<string, string | readonly string[] | undefined>>;

function first(value: string | readonly string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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
  const query = params.toString();
  return `/${locale}/projects/${encodeURIComponent(projectKey)}/compare${query ? `?${query}` : ""}`;
}

export function selectedKeysFromFormData(formData: FormData): readonly string[] {
  const values = formData
    .getAll("selectedProjectKey")
    .map((value) => (typeof value === "string" ? value : ""));
  return parseList(values.join(","));
}
