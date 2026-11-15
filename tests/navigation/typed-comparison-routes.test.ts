import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Stage 6 Next typed comparison routes", () => {
  it("casts dynamic server-action redirects through Next Route", () => {
    const actions = source("src/app/[locale]/projects/[projectKey]/compare/actions.ts");

    expect(actions).toContain('import type { Route } from "next"');
    expect(actions).toContain("function asRoute(value: string): Route");
    expect(actions).toMatch(/redirect\(\s*asRoute\(/);
  });

  it("types the Project Workspace comparison link as a Next Route", () => {
    const overview = source("src/components/projects/project-workspace-overview.tsx");

    expect(overview).toContain('import type { Route } from "next"');
    expect(overview).toContain(
      "comparisonHref(locale, workspace.project.businessKey) as Route",
    );
  });
});
