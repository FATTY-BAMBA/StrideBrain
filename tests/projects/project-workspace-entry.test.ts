import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Stage 6 Project Workspace entry", () => {
  it("renders the authorized overview through the Stage 3 use case", () => {
    const page = source("src/app/[locale]/projects/[projectKey]/[[...surface]]/page.tsx");

    expect(page).toContain("resolveServerRuntimeContext");
    expect(page).toContain("createProjectWorkspaceService");
    expect(page).toContain("ProjectWorkspaceOverview");
    expect(page).not.toContain("Horizon Atelier");
    expect(page).not.toContain("Xinyi Flagship Renovation");
  });

  it("links the primary action to the canonical compare route", () => {
    const overview = source("src/components/projects/project-workspace-overview.tsx");

    expect(overview).toContain("comparisonHref(locale, workspace.project.businessKey)");
    expect(overview).not.toContain("project-questions-title");
    expect(overview).toContain("workspace.permissions.canRunComparison");
    expect(overview).not.toContain("stridebrain?project=");
  });

  it("keeps the workspace experience free of raw Prisma access", () => {
    const presentation = [
      source("src/components/projects/project-workspace-overview.tsx"),
      source("src/app/[locale]/projects/[projectKey]/[[...surface]]/page.tsx"),
    ].join("\n");

    expect(presentation).not.toMatch(/@prisma\/|repositories\/prisma|\.generated\/prisma/);
  });
});
