import { expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { validateSaveDraft } from "@/modules/quote-draft/domain/save-input";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { publicEvidenceValue } from "@/modules/evidence/domain/public-evidence-value";
import type { DraftPreparation } from "@/repositories/ports/quote-draft-repository";
const input = () => ({
  projectKey: "J-2611-A7K3",
  idempotencyKey: randomUUID(),
  baseVersionId: null,
  preparationToken: null,
  lines: [{ categoryId: "IMPORTED_STONE", description: "Stone", amount: "0" }],
});
it("bounds server line input and refuses injected totals, invalid categories, duplicate lines and floats", () => {
  expect(validateSaveDraft(input())?.lines[0]?.amount).toBe("0.00");
  expect(validateSaveDraft({ ...input(), totalAmount: "100" })).toBeNull();
  for (const patch of [
    { amount: -1 },
    { amount: "-1" },
    { amount: "1e3" },
    { amount: "0.001" },
    { amount: "100000000000000" },
    { description: "x".repeat(501) },
    { categoryId: "unknown" },
    { categoryId: "SELECTIVE_DEMOLITION" },
    { categoryId: "PARTITIONS_CEILINGS" },
  ]) {
    const value = input();
    expect(validateSaveDraft({ ...value, lines: [{ ...value.lines[0], ...patch }] })).toBeNull();
  }
  const value = input();
  expect(validateSaveDraft({ ...value, lines: [...value.lines, ...value.lines] })).toBeNull();
});
it("authenticates preparation snapshots and refuses tampering and expired snapshots", () => {
  let now = new Date("2026-11-22T00:00:00Z");
  const codec = new SignedDraftPreparationCodec(
    "synthetic-unit-test-signing-secret-32-bytes",
    () => now,
  );
  const prepared: DraftPreparation = {
    organizationId: "org",
    membershipId: "member",
    projectId: "job",
    baseVersionId: null,
    comparisonRunId: "run",
    sourceFingerprint: "source",
    permissionFingerprint: "permission",
    calculatedAt: now.toISOString(),
    suggestions: [],
  };
  const token = codec.seal(prepared);
  expect(codec.open(token)).toEqual(prepared);
  expect(codec.open(`x${token}`)).toBeNull();
  expect(codec.open(`${token}.extra`)).toBeNull();
  now = new Date("2026-11-22T01:00:01Z");
  expect(codec.open(token)).toBeNull();
});
it("ordinary financial evidence never contains the private recorded basis", () => {
  expect(
    publicEvidenceValue({
      amount: "42",
      currency: "TWD",
      quoteDraft: { recorded: { basis: { actualExceeded: { count: 2 } } } },
    }),
  ).toEqual({ amount: "42", currency: "TWD" });
});

import { isCategoryDraft } from "@/modules/quote-draft/domain/save-input";
it("does not merge or split pre-existing detailed quote lines in the category editor", () => {
  expect(isCategoryDraft([{ categoryId: "IMPORTED_STONE" }])).toBe(true);
  expect(isCategoryDraft([{ categoryId: "DEMOLITION_CEILING" }])).toBe(true);
  expect(
    isCategoryDraft([{ categoryId: "IMPORTED_STONE" }, { categoryId: "IMPORTED_STONE" }]),
  ).toBe(false);
});

it("accepts the combined commercial category for a single draft line", () => {
  const value = input();
  expect(
    validateSaveDraft({
      ...value,
      lines: [{ ...value.lines[0], categoryId: "DEMOLITION_CEILING" }],
    })?.lines[0]?.categoryId,
  ).toBe("DEMOLITION_CEILING");
});
