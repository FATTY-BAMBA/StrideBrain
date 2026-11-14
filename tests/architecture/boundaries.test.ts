import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const experienceRoots = [join(repositoryRoot, "src/app"), join(repositoryRoot, "src/components")];
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function extension(path: string): string {
  const index = path.lastIndexOf(".");
  return index < 0 ? "" : path.slice(index);
}

function filesUnder(root: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) {
      files.push(...filesUnder(path));
    } else if (sourceExtensions.has(extension(path))) {
      files.push(path);
    }
  }

  return files;
}

describe("experience architecture boundaries", () => {
  const files = experienceRoots.flatMap(filesUnder);

  it("does not import persistence adapters, fixtures, or provider SDKs", () => {
    const forbiddenPatterns = [
      /@prisma\/client/,
      /repositories\/prisma/,
      /(?:^|\/)fixtures(?:\/|$)/,
      /openai/i,
      /openrouter/i,
      /supabase/i,
    ];

    const violations = files.flatMap((path) => {
      const contents = readFileSync(path, "utf8");
      return forbiddenPatterns
        .filter((pattern) => pattern.test(contents))
        .map((pattern) => `${relative(repositoryRoot, path)} matched ${pattern}`);
    });

    expect(violations).toEqual([]);
  });

  it("does not use browser storage as business state", () => {
    const violations = files
      .filter((path) => /\b(?:localStorage|sessionStorage)\b/.test(readFileSync(path, "utf8")))
      .map((path) => relative(repositoryRoot, path));

    expect(violations).toEqual([]);
  });

  it("keeps secret-like environment names out of client/experience code", () => {
    const secretPattern = /(?:API_KEY|SECRET_KEY|SERVICE_ROLE|DATABASE_URL|DIRECT_URL)/;
    const violations = files
      .filter((path) => secretPattern.test(readFileSync(path, "utf8")))
      .map((path) => relative(repositoryRoot, path));

    expect(violations).toEqual([]);
  });
});
