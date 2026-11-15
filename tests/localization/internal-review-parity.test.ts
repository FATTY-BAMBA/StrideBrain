import { describe, expect, it } from "vitest";

import {
  getInternalReviewCopy,
  internalReviewCopy,
  reviewStateMessage,
} from "@/modules/internal-review-experience/copy";

function keys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value)
    .flatMap(([key, child]) => keys(child, `${prefix}.${key}`))
    .sort();
}

describe("Stage 8 English and Taiwan Traditional Chinese parity", () => {
  it("covers the same review, validation, receipt and workspace semantics", () => {
    expect(keys(internalReviewCopy.en)).toEqual(keys(internalReviewCopy["zh-TW"]));
    expect(internalReviewCopy["zh-TW"].entry).toBe("建立內部審查事項");
    expect(internalReviewCopy.en.entry).toBe("Create internal review action");
  });

  it("localizes every required safe outcome without displaying backend enum values", () => {
    const kinds = [
      "PROPOSAL_UNAVAILABLE",
      "PROPOSAL_EXPIRED",
      "PROPOSAL_STALE",
      "PROPOSAL_NOT_AUTHORIZED",
      "PROPOSAL_FAILED",
      "ACTION_NOT_AUTHORIZED",
      "ASSIGNEE_UNAVAILABLE",
      "EVIDENCE_UNAVAILABLE",
      "STALE_COMPARISON",
      "PROPOSAL_ALREADY_CONSUMED",
      "IDEMPOTENCY_CONFLICT",
      "ACTION_CREATE_FAILED",
      "VALIDATION_FAILED",
    ];
    for (const kind of kinds) {
      expect(internalReviewCopy.en.states).toHaveProperty(kind);
      const message = reviewStateMessage(getInternalReviewCopy("zh-TW"), kind);
      expect(message).toMatch(/[\u4e00-\u9fff]/);
      expect(message).not.toContain(kind);
    }
    expect(internalReviewCopy["zh-TW"].replayDescription).toContain("未重複建立");
  });

  it("uses explicit internal action language, preserved uncertainty, and no commercial approval claim", () => {
    expect(internalReviewCopy.en.consequence).toContain("does not approve");
    expect(internalReviewCopy["zh-TW"].consequence).toContain("不會核准報價");
    expect(internalReviewCopy.en.boundedEditHint).toContain("cannot be changed");
    expect(internalReviewCopy["zh-TW"].boundedEditHint).toContain("無法在此變更");
  });
});
