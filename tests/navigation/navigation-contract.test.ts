import { describe, expect, it } from "vitest";

import { globalNavigation, globalSurfaceHref } from "@/modules/navigation/global-navigation";
import { projectNavigation, projectSurfaceHref } from "@/modules/navigation/project-navigation";

describe("navigation contracts", () => {
  it("exposes only the five approved global product surfaces", () => {
    expect(globalNavigation.map((item) => item.key)).toEqual([
      "home",
      "projects",
      "knowledge",
      "stridebrain",
      "settings",
    ]);
  });

  it("exposes only the five approved project workspace surfaces", () => {
    expect(projectNavigation.map((item) => item.key)).toEqual([
      "overview",
      "compare",
      "commercial",
      "evidence",
      "actions",
    ]);
  });

  it("builds locale-scoped routes without adding organization authority", () => {
    expect(globalSurfaceHref("zh-TW", globalNavigation[0]!)).toBe("/zh-TW");
    expect(globalSurfaceHref("en", globalNavigation[1]!)).toBe("/en/projects");
    expect(projectSurfaceHref("en", "PRJ-TEST-001", projectNavigation[1]!)).toBe(
      "/en/projects/PRJ-TEST-001/compare",
    );
  });
});
