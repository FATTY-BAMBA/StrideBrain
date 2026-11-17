import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
function filesUnder(directory: string): string[] {
  return readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : /\.tsx?$/.test(path) ? [path] : [];
  });
}
function contents(path: string): string {
  return readFileSync(join(root, path), "utf8");
}
const presentation = [
  ...filesUnder("src/components/internal-review"),
  ...filesUnder("src/modules/internal-review-experience"),
];
const business = filesUnder("src/modules/internal-review");
const adapter = "src/repositories/prisma/prisma-internal-review-repository.ts";
function violations(files: readonly string[], patterns: readonly RegExp[]) {
  return files.flatMap((path) =>
    patterns
      .filter((pattern) => pattern.test(contents(path)))
      .map((pattern) => `${relative(root, join(root, path))}: ${pattern}`),
  );
}

describe("Stage 8 internal review architecture boundaries", () => {
  it("keeps persistence, authority decisions, and model calls out of review and receipt presentation", () => {
    expect(presentation.length).toBeGreaterThan(0);
    expect(
      violations(presentation, [
        /@prisma\//,
        /repositories\/prisma/,
        /\.generated\/prisma/,
        /lib\/server/,
        /internal-review\/application/,
        /internal-review\/domain\/proposal-policy/,
        /AuthorizationService|resolveCapabilities|canCreateInternalReview/,
        /\.\$transaction\s*\(/,
        /\.\$executeRaw/,
        /\.\$queryRaw/,
        /DATABASE_URL|SERVICE_ROLE|SECRET_KEY/,
      ]),
    ).toEqual([]);
  });

  it("keeps the application and domain independent of Prisma, React, and fixture-specific branches", () => {
    expect(
      violations(business, [
        /@prisma\//,
        /repositories\/prisma/,
        /\.generated\/prisma/,
        /from\s+["']react["']/,
        /from\s+["']next\//,
        /(?:from|import)\s*\(?["'][^"']*fixtures\//,
        /===?\s*["'](?:Xinyi|PRJ-XINYI-026|org_horizon)["']/,
      ]),
    ).toEqual([]);
  });

  it("does not introduce model providers, external communications, or financial write paths", () => {
    expect(
      violations(
        [...business, ...presentation, adapter],
        [
          /(?:from|import)\s*\(?["'](?:openai|@ai-sdk|anthropic|nodemailer|resend|twilio)/i,
          /\b(?:generateText|streamText|generateObject|sendMail)\s*\(/,
          /\.(?:quote|quoteVersion|quoteItem|projectCostVersion|costLine|supplierOffer|supplierOfferItem)\.(?:create|update|updateMany|delete|deleteMany|upsert)\s*\(/,
        ],
      ),
    ).toEqual([]);
  });

  it("keeps raw evidence identifiers and server snapshots out of public proposal and receipt DTOs", () => {
    const contracts = contents("src/modules/internal-review/domain/contracts.ts");
    const publicContracts = contracts.slice(
      contracts.indexOf("export type ProposedActionDTO"),
      contracts.indexOf("export type PrepareInternalReviewInput"),
    );
    expect(publicContracts).not.toMatch(
      /organizationId|membershipId|evidenceReferenceIds|supportedValue|storageKey|fingerprints|evidenceSnapshot/,
    );
  });

  it("keeps immutable business records out of browser storage and prevents application audit mutation", () => {
    expect(violations(presentation, [/\b(?:localStorage|sessionStorage|indexedDB)\b/])).toEqual([]);
    expect(contents(adapter)).not.toMatch(
      /\.auditEvent\.(?:update|updateMany|delete|deleteMany|upsert)\s*\(/,
    );
    expect(contents(adapter)).not.toMatch(/DISABLE\s+TRIGGER|session_replication_role|TRUNCATE/i);
  });
});
