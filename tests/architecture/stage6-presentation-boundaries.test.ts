import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const presentationFiles = [
  "src/components/comparisons/comparison-experience-client.tsx",
  "src/components/comparisons/comparison-start.tsx",
  "src/components/comparisons/comparison-state.tsx",
  "src/app/[locale]/projects/[projectKey]/compare/page.tsx",
];
const composerFile = "src/modules/comparison-experience/build-comparison-experience.ts";

function contents(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Stage 6 presentation boundaries", () => {
  it("keeps Prisma and repository adapters out of presentation code", () => {
    const forbidden = [/@prisma\//, /repositories\/prisma/, /\.generated\/prisma/];
    const violations = presentationFiles.flatMap((path) =>
      forbidden.filter((pattern) => pattern.test(contents(path))).map((pattern) => `${path}:${pattern}`),
    );

    expect(violations).toEqual([]);
  });

  it("does not recalculate authoritative similarity or economics in UI components", () => {
    const forbidden = [
      /similarity-policy/,
      /historical-economics-service/,
      /fixed-decimal/,
      /variancePercent/,
      /calculateCandidateSimilarity/,
    ];
    const violations = presentationFiles.flatMap((path) =>
      forbidden.filter((pattern) => pattern.test(contents(path))).map((pattern) => `${path}:${pattern}`),
    );

    expect(violations).toEqual([]);
  });

  it("allows the pure composer to format stored DTOs but not invoke domain calculators", () => {
    const source = contents(composerFile);
    expect(source).not.toMatch(/similarity-policy|historical-economics-service|fixed-decimal/);
    expect(source).toMatch(/Stage4ComparisonResult/);
    expect(source).toMatch(/Stage5EconomicsResult/);
  });

  it("does not make an AI provider part of the critical comparison path", () => {
    const combined = [...presentationFiles, composerFile].map(contents).join("\n");
    expect(combined).not.toMatch(/OpenAI|OpenRouter|anthropic|generateText|streamText/i);
  });
});
