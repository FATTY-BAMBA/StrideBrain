import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { expect, it } from "vitest";
import nextConfig from "../../next.config";
import { seededFirmLists } from "@/fixtures/firm-lists";
import {
  validateQuoteDocument,
  QUOTE_DOCUMENT_LIMITS,
} from "@/modules/quote-draft/domain/document-input";
import { quoteDocumentTotals } from "@/modules/finance/quote-totals";
import { prepareIssuePolicy } from "@/modules/quote-issue/domain/issue-policy";
import { firmDetails, issueOptions } from "@/modules/quote-issue/domain/input";
import {
  emptyFirmDetails,
  MAX_QUOTE_ISSUE_TOKEN_LENGTH,
  type IssueState,
  type IssuePreparation,
} from "@/modules/quote-issue/domain/contracts";
import { SignedQuoteIssueCodec } from "@/modules/quote-issue/application/issue-codec";
const { encodeReply } = createRequire(import.meta.url)(
  "next/dist/compiled/react-server-dom-webpack/client.node",
) as { encodeReply(value: unknown): Promise<string | FormData> };
const idempotencyKey = "00000000-0000-4000-8000-000000000000";
const projectKey = "J".repeat(128);
const cjk = (length: number) => "合".repeat(length);
const now = new Date("2026-11-25T00:00:00.000Z");
async function bytes(args: unknown[]) {
  const encoded = await encodeReply(args);
  expect(typeof encoded).toBe("string");
  return Buffer.byteLength(encoded as string);
}

it("fits maximum document text/row bounds and the largest signed-token issue envelope in the measured action cap", async () => {
  // BMP Unicode uses three UTF-8 bytes per permitted character; ASCII JSON escapes use at most two.
  // Use the full 128-character identifier bounds (persisted UUIDs are shorter) as a conservative envelope.
  // 299 percentage lines maximize duplicated descriptions in percentageLines and the legacy flat lines.
  const categoryId = cjk(128);
  const draft = validateQuoteDocument({
    sections: Array.from({ length: QUOTE_DOCUMENT_LIMITS.sections }, (_, si) => ({
      id: `section${si}`.padEnd(128, "s"),
      title: cjk(QUOTE_DOCUMENT_LIMITS.title),
      categoryId,
      lines: Array.from({ length: 10 }, (_, li) => ({
        id: `line${si}-${li}`.padEnd(128, "l"),
        description: cjk(QUOTE_DOCUMENT_LIMITS.description),
        remark: cjk(QUOTE_DOCUMENT_LIMITS.remark),
        ...(si === 0 && li === 0
          ? {
              kind: "ITEM",
              quantity: "30000000000000.00",
              unit: cjk(QUOTE_DOCUMENT_LIMITS.unit),
              unitPrice: "0.01",
            }
          : { kind: "PERCENTAGE", percentage: "999999.99" }),
      })),
    })),
    discount: {
      label: cjk(QUOTE_DOCUMENT_LIMITS.discountLabel),
      amount: "100000000000000000.00",
    },
  });
  expect(draft).not.toBeNull();
  const document = quoteDocumentTotals(draft!);
  const firm = firmDetails({
    ...emptyFirmDetails,
    legalNameEn: cjk(200),
    legalNameZhTw: cjk(200),
    taxId: "12345678",
    addressEn: cjk(500),
    addressZhTw: cjk(500),
    phone: cjk(80),
    email: `${cjk(250)}@合.合`,
    termsEn: cjk(10000),
    termsZhTw: cjk(10000),
  });
  expect(firm).not.toBeNull();
  const options = issueOptions({
    language: "zh-TW",
    attention: cjk(200),
    terms: cjk(10000),
    validUntil: "2026-12-25",
  });
  expect(options).not.toBeNull();
  const state: IssueState = {
    job: {
      id: "p".repeat(128),
      organizationId: "o".repeat(128),
      businessKey: projectKey,
      name: cjk(200),
      stage: "QUOTE_REVIEW",
      siteAddress: cjk(200),
      catalog: {
        ...seededFirmLists,
        workCategories: [
          {
            key: categoryId,
            nameEn: cjk(200),
            nameZhTw: cjk(200),
            sortOrder: 0,
            active: true,
            scopeSelectable: true,
            aliases: [],
            pricedUnderKey: null,
          },
        ],
      },
      currency: "TWD",
      area: "1",
      areaUnit: "m2",
      scopeCategoryIds: [categoryId],
      commercialCategoryIds: [categoryId],
    },
    timezone: "Asia/Taipei",
    clientNameEn: cjk(200),
    clientNameZhTw: cjk(200),
    clientDetails: { contactPerson: cjk(200), address: cjk(1000), taxId: "12345678" },
    projectNameEn: cjk(200),
    projectNameZhTw: cjk(200),
    firm,
    current: {
      id: "v".repeat(128),
      quoteId: "q".repeat(128),
      versionNumber: 1000,
      status: "DRAFT",
      currency: "TWD",
      document,
      totals: {
        amountBeforeTax: document.amountBeforeTax,
        taxAmount: document.taxAmount,
        totalAmount: document.totalAmount,
      },
      lines: document.sections.flatMap((section) =>
        section.lines.map((line) => ({
          id: line.id!,
          categoryId,
          description: line.description,
          amount: line.amount!,
          recorded: null,
          enteredBy: null,
        })),
      ),
    },
    descriptions: [],
    issuedCount: 999,
    issued: null,
    sourceAccess: true,
    conflicts: [],
    basisOutOfDate: true,
    comparisonOutOfDate: true,
    noComparison: true,
    findings: [],
    unreviewedFindings: true,
  };
  const result = prepareIssuePolicy(state, state.current!.id, options!, now);
  expect(result.blockers).toEqual([]);
  const preparation: IssuePreparation = {
    organizationId: state.job.organizationId,
    membershipId: "m".repeat(128),
    projectId: state.job.id,
    projectKey,
    versionId: state.current!.id,
    options: options!,
    preparedAt: now.toISOString(),
    fingerprint: "f".repeat(64),
    ...result,
  };
  const codec = new SignedQuoteIssueCodec(
    "synthetic-size-test-secret-with-over-32-bytes",
    () => now,
  );
  const token = codec.seal(preparation);
  expect(codec.open(token)).toEqual(preparation);
  const issueRequestBytes = await bytes(["zh-TW", "issue", { projectKey, token, idempotencyKey }]);
  const maximumTokenIssueRequestBytes = await bytes([
    "zh-TW",
    "issue",
    { projectKey, token: "a".repeat(MAX_QUOTE_ISSUE_TOKEN_LENGTH), idempotencyKey },
  ]);
  const saveRequestBytes = await bytes([
    "zh-TW",
    {
      projectKey,
      baseVersionId: state.current!.id,
      preparationToken: null,
      idempotencyKey,
      ...draft,
    },
  ]);
  const configuredLimitBytes = nextConfig.experimental!.serverActions!.bodySizeLimit;
  expect(issueRequestBytes).toBeLessThan(maximumTokenIssueRequestBytes);
  expect(saveRequestBytes).toBeLessThan(issueRequestBytes);
  expect(configuredLimitBytes).toBe(maximumTokenIssueRequestBytes);
  expect(
    await bytes([
      "zh-TW",
      "issue",
      { projectKey, token: "a".repeat(MAX_QUOTE_ISSUE_TOKEN_LENGTH + 1), idempotencyKey },
    ]),
  ).toBe(Number(configuredLimitBytes) + 1);
  expect(codec.open("a".repeat(MAX_QUOTE_ISSUE_TOKEN_LENGTH + 1))).toBeNull();
  if (process.env.STRIDEBRAIN_SB065_CAPTURE_SIZE === "true")
    writeFileSync(
      "foundry/tasks/SB-065/evidence/review-request-size.json",
      JSON.stringify(
        {
          fixture:
            "30 sections, 300 lines (1 item and 299 percentage fees), all document/header text limits in three-byte BMP Unicode; conservative 128-character IDs/category key; no issue blockers",
          documentJsonBytes: Buffer.byteLength(JSON.stringify(document)),
          saveRequestBytes,
          issuePreparationJsonBytes: Buffer.byteLength(JSON.stringify(preparation)),
          signedIssueTokenBytes: Buffer.byteLength(token),
          issueRequestBytes,
          maximumTokenIssueRequestBytes,
          actionEnvelopeBytes: maximumTokenIssueRequestBytes - MAX_QUOTE_ISSUE_TOKEN_LENGTH,
          configuredLimitBytes,
          tokenLimitBytes: MAX_QUOTE_ISSUE_TOKEN_LENGTH,
        },
        null,
        2,
      ) + "\n",
    );
});
