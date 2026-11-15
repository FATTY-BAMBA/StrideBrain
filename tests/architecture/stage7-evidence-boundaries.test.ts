import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const presentationFiles = [
  "src/components/evidence/evidence-panel.tsx",
  "src/components/comparisons/comparison-experience-client.tsx",
  "src/app/[locale]/projects/[projectKey]/compare/page.tsx",
];
const applicationFiles = [
  "src/modules/evidence-panel/application/get-evidence-panel.ts",
  "src/modules/evidence-panel/contracts.ts",
  "src/modules/evidence-panel/route-state.ts",
];

function contents(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Stage 7 evidence boundaries", () => {
  it("keeps persistence and raw storage access out of presentation code", () => {
    const forbidden = [
      /@prisma\//,
      /repositories\/prisma/,
      /\.generated\/prisma/,
      /storageKey/,
      /archive_download_url/,
    ];
    const violations = presentationFiles.flatMap((path) =>
      forbidden
        .filter((pattern) => pattern.test(contents(path)))
        .map((pattern) => `${path}:${pattern}`),
    );

    expect(violations).toEqual([]);
  });

  it("does not recalculate ranking or economics in the panel or client", () => {
    const forbidden = [
      /similarity-policy/,
      /historical-economics-service/,
      /fixed-decimal/,
      /calculateCandidateSimilarity/,
      /calculateVariance/,
    ];
    const violations = [...presentationFiles, ...applicationFiles].flatMap((path) =>
      forbidden
        .filter((pattern) => pattern.test(contents(path)))
        .map((pattern) => `${path}:${pattern}`),
    );

    expect(violations).toEqual([]);
  });

  it("does not retain evidence context or sensitive previews in browser storage", () => {
    const combined = presentationFiles.map(contents).join("\n");
    expect(combined).not.toMatch(/localStorage|sessionStorage|indexedDB/);
  });

  it("does not make a model provider part of evidence inspection", () => {
    const combined = [...presentationFiles, ...applicationFiles].map(contents).join("\n");
    expect(combined).not.toMatch(/OpenAI|OpenRouter|anthropic|generateText|streamText|embedding/i);
  });

  it("uses opaque source keys rather than placing internal evidence IDs in route state", () => {
    const route = contents("src/modules/evidence-panel/route-state.ts");
    const application = contents("src/modules/evidence-panel/application/get-evidence-panel.ts");

    expect(route).toMatch(/SAFE_SOURCE_KEY/);
    expect(route).not.toMatch(/evidenceReferenceId/);
    expect(application).toMatch(/evidenceSourceKey/);
    expect(application).toMatch(/sha256/);
  });
});
