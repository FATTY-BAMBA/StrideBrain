import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function files(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(root, entry.name))
      : /\.tsx?$/.test(entry.name)
        ? [join(root, entry.name)]
        : [],
  );
}

describe("Stage 8 presentation and HTTP boundaries", () => {
  const presentation = files("src/components/internal-review").concat(
    files("src/modules/internal-review-experience"),
  );
  it("does not decide authority or write business state from presentation", () => {
    for (const file of presentation) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /repositories\/prisma|@prisma\/|\.generated\/prisma|AuthorizationService|\.capabilities\.has|localStorage|sessionStorage|generateText|streamText|calculateCandidateSimilarity|historical-economics-service/,
      );
    }
  });
  it("keeps all business mutations behind authenticated service calls in POST adapters", () => {
    const prepare = readFileSync("src/app/api/actions/internal-review/proposals/route.ts", "utf8");
    const confirm = readFileSync("src/app/api/actions/internal-review/route.ts", "utf8");
    for (const source of [prepare, confirm]) {
      expect(source).toContain("resolveServerRuntimeContext");
      expect(source).toContain("isSameOriginReviewRequest");
      expect(source).toContain("private, no-store");
      expect(source).not.toMatch(/export async function GET|\.create\(/);
    }
    const reads = [
      "src/app/api/actions/[actionKey]/route.ts",
      "src/app/api/actions/internal-review/proposals/[proposalKey]/route.ts",
    ];
    for (const path of reads)
      expect(readFileSync(path, "utf8"), path).not.toMatch(/\.confirm\(|\.prepare\(/);
  });
});
