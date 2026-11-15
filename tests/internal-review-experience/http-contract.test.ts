import { describe, expect, it } from "vitest";

import {
  isSameOriginReviewRequest,
  parseConfirmRequest,
  parsePrepareRequest,
  readReviewJson,
} from "@/modules/internal-review-experience/http-contract";

const prepare = {
  projectKey: "PRJ-A",
  comparisonRunId: "cmprun_1",
  enrichmentRunId: "econrun_1",
  locale: "en",
  returnContext: { selectedProjectKeys: ["PRJ-B"] },
};
const confirm = {
  version: "internal-review-command.v1",
  proposalKey: "proposal_1",
  title: "Review assumptions",
  rationale: "Check evidence",
  assigneeKey: null,
  dueDate: null,
  confirmation: true,
  idempotencyKey: "e1ec6292-9d9a-4c2a-9fa1-a971843b9411",
  locale: "zh-TW",
};

describe("Stage 8 bounded HTTP adapters", () => {
  it("requires configured request target and Origin, ignoring spoofed forwarded hosts", () => {
    const origin = "https://preview.example.invalid";
    expect(
      isSameOriginReviewRequest(
        new Request(`${origin}/api/actions/internal-review`, { headers: { origin } }),
        origin,
      ),
    ).toBe(true);
    for (const headers of [
      {},
      { origin: "https://attacker.invalid" },
      { origin, "sec-fetch-site": "cross-site" },
    ]) {
      expect(
        isSameOriginReviewRequest(
          new Request(`${origin}/api/actions/internal-review`, { headers }),
          origin,
        ),
      ).toBe(false);
    }
    expect(
      isSameOriginReviewRequest(
        new Request("https://attacker.invalid/api/actions/internal-review", {
          headers: { origin, "x-forwarded-host": "preview.example.invalid" },
        }),
        origin,
      ),
    ).toBe(false);
  });

  it("rejects browser authority fields and arbitrary return URLs at each request boundary", () => {
    expect(parsePrepareRequest(prepare)).toEqual(prepare);
    expect(parseConfirmRequest(confirm)).toEqual(confirm);
    for (const field of [
      "organizationId",
      "role",
      "capabilities",
      "evidenceReferenceIds",
      "fingerprints",
      "returnTo",
    ]) {
      expect(parsePrepareRequest({ ...prepare, [field]: "forged" })).toBeNull();
      expect(parseConfirmRequest({ ...confirm, [field]: "forged" })).toBeNull();
    }
    expect(
      parsePrepareRequest({
        ...prepare,
        returnContext: { ...prepare.returnContext, organizationId: "foreign" },
      }),
    ).toBeNull();
    expect(parseConfirmRequest({ ...confirm, version: "future" })).toBeNull();
  });

  it("binds evidence route context to the requested immutable pair", () => {
    const evidenceSelection = {
      mode: "CLAIM",
      comparisonRunId: "cmprun_1",
      enrichmentRunId: "econrun_1",
      claimKey: "STONE_VARIANCE",
    };
    expect(
      parsePrepareRequest({
        ...prepare,
        returnContext: { selectedProjectKeys: [], evidenceSelection },
      }),
    ).not.toBeNull();
    expect(
      parsePrepareRequest({
        ...prepare,
        returnContext: {
          selectedProjectKeys: [],
          evidenceSelection: { ...evidenceSelection, comparisonRunId: "cmprun_foreign" },
        },
      }),
    ).toBeNull();
    expect(
      parsePrepareRequest({
        ...prepare,
        returnContext: {
          selectedProjectKeys: [],
          evidenceSelection: { ...evidenceSelection, enrichmentRunId: "econrun_foreign" },
        },
      }),
    ).toBeNull();
    expect(parsePrepareRequest({ ...prepare, locale: "zh-CN" })).toBeNull();
  });

  it("bounds actual streamed bytes and rejects invalid content types and malformed JSON", async () => {
    const request = (body: string, contentType = "application/json") =>
      new Request("http://localhost/api/actions/internal-review", {
        method: "POST",
        headers: { "content-type": contentType },
        body,
      });
    expect(await readReviewJson(request(JSON.stringify(confirm)))).toEqual(confirm);
    expect(await readReviewJson(request("{}", "text/plain"))).toBeNull();
    expect(await readReviewJson(request("{"))).toBeNull();
    expect(await readReviewJson(request(JSON.stringify({ text: "資".repeat(6000) })))).toBeNull();
  });

  it("passes explicit non-confirmation to application validation without claiming a successful write", () => {
    expect(parseConfirmRequest({ ...confirm, confirmation: false })?.confirmation).toBe(false);
    expect(parseConfirmRequest({ ...confirm, confirmation: "true" })).toBeNull();
    expect(parseConfirmRequest({ ...confirm, title: "x".repeat(801) })).toBeNull();
    expect(
      parsePrepareRequest({
        ...prepare,
        returnContext: { selectedProjectKeys: ["A", "B", "C", "D"] },
      }),
    ).toBeNull();
  });
});
