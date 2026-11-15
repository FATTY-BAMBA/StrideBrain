import type {
  ConfirmInternalReviewInput,
  PrepareInternalReviewInput,
  ReturnContext,
} from "@/modules/internal-review/domain/contracts";
import { parseEvidenceSelection } from "@/modules/evidence-panel/route-state";
import { isSupportedLocale } from "@/modules/localization/config";
import { safeReviewKey } from "@/modules/internal-review-experience/route-state";

const BODY_LIMIT = 16_384;
type RecordValue = Record<string, unknown>;

function record(value: unknown): value is RecordValue {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function exactKeys(value: RecordValue, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
function text(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length <= maximum;
}

export function isSameOriginReviewRequest(request: Request, configuredOrigin: string): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return (
    origin === configuredOrigin &&
    new URL(request.url).origin === configuredOrigin &&
    fetchSite !== "cross-site"
  );
}

export async function readReviewJson(request: Request): Promise<unknown | null> {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") ?? "")) return null;
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (
    !Number.isFinite(declaredLength) ||
    declaredLength < 0 ||
    declaredLength > BODY_LIMIT ||
    !request.body
  )
    return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > BODY_LIMIT) {
        await reader.cancel();
        return null;
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function returnContext(value: unknown, run: string, enrichment: string): ReturnContext | null {
  if (value === undefined) return { selectedProjectKeys: [] };
  if (
    !record(value) ||
    !exactKeys(value, ["selectedProjectKeys", "evidenceSelection", "evidenceReturnId"])
  )
    return null;
  if (
    !Array.isArray(value.selectedProjectKeys) ||
    value.selectedProjectKeys.length > 3 ||
    value.selectedProjectKeys.some((key: unknown) => !safeReviewKey(key))
  )
    return null;
  const selectedProjectKeys = value.selectedProjectKeys as string[];
  if (value.evidenceReturnId !== undefined && !safeReviewKey(value.evidenceReturnId)) return null;
  let evidenceSelection: ReturnContext["evidenceSelection"];
  if (value.evidenceSelection !== undefined) {
    const selection = value.evidenceSelection;
    if (
      !record(selection) ||
      !exactKeys(selection, [
        "mode",
        "comparisonRunId",
        "enrichmentRunId",
        "claimKey",
        "candidateProjectKey",
        "factorKey",
        "sourceKey",
        "conflictKey",
      ])
    )
      return null;
    if (
      selection.comparisonRunId !== run ||
      (selection.enrichmentRunId !== undefined && selection.enrichmentRunId !== enrichment)
    )
      return null;
    if (Object.values(selection).some((item) => typeof item !== "string")) return null;
    evidenceSelection =
      parseEvidenceSelection({
        comparisonRunId: run,
        economicsRunId: enrichment,
        evidenceMode: selection.mode as string,
        evidenceClaimKey: selection.claimKey as string | undefined,
        evidenceCandidateProjectKey: selection.candidateProjectKey as string | undefined,
        evidenceFactorKey: selection.factorKey as string | undefined,
        evidenceSourceKey: selection.sourceKey as string | undefined,
        evidenceConflictKey: selection.conflictKey as string | undefined,
      }) ?? undefined;
    if (!evidenceSelection) return null;
  }
  return {
    selectedProjectKeys,
    ...(evidenceSelection ? { evidenceSelection } : {}),
    ...(value.evidenceReturnId ? { evidenceReturnId: value.evidenceReturnId as string } : {}),
  };
}

export function parsePrepareRequest(value: unknown): PrepareInternalReviewInput | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      "projectKey",
      "comparisonRunId",
      "enrichmentRunId",
      "locale",
      "returnContext",
    ])
  )
    return null;
  const projectKey = safeReviewKey(value.projectKey);
  const comparisonRunId = safeReviewKey(value.comparisonRunId);
  const enrichmentRunId = safeReviewKey(value.enrichmentRunId);
  if (
    !projectKey ||
    !comparisonRunId ||
    !enrichmentRunId ||
    typeof value.locale !== "string" ||
    !isSupportedLocale(value.locale)
  )
    return null;
  const restored = returnContext(value.returnContext, comparisonRunId, enrichmentRunId);
  return restored
    ? {
        projectKey,
        comparisonRunId,
        enrichmentRunId,
        locale: value.locale,
        returnContext: restored,
      }
    : null;
}

export function parseConfirmRequest(value: unknown): ConfirmInternalReviewInput | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      "version",
      "proposalKey",
      "title",
      "rationale",
      "assigneeKey",
      "dueDate",
      "confirmation",
      "idempotencyKey",
      "locale",
    ])
  )
    return null;
  if (value.version !== "internal-review-command.v1") return null;
  const proposalKey = safeReviewKey(value.proposalKey);
  if (
    !proposalKey ||
    !text(value.title, 800) ||
    !text(value.rationale, 2000) ||
    typeof value.confirmation !== "boolean" ||
    !text(value.idempotencyKey, 128) ||
    typeof value.locale !== "string" ||
    !isSupportedLocale(value.locale)
  )
    return null;
  if (
    value.assigneeKey !== null &&
    value.assigneeKey !== undefined &&
    !safeReviewKey(value.assigneeKey)
  )
    return null;
  if (value.dueDate !== null && value.dueDate !== undefined && !text(value.dueDate, 10))
    return null;
  return {
    version: "internal-review-command.v1",
    proposalKey,
    title: value.title,
    rationale: value.rationale,
    assigneeKey: (value.assigneeKey as string | null | undefined) ?? null,
    dueDate: (value.dueDate as string | null | undefined) ?? null,
    confirmation: value.confirmation,
    idempotencyKey: value.idempotencyKey,
    locale: value.locale,
  };
}
