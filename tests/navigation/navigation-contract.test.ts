import { describe, expect, it } from "vitest";

import { globalNavigation, globalSurfaceHref } from "@/modules/navigation/global-navigation";
import { projectNavigation, projectSurfaceHref } from "@/modules/navigation/project-navigation";

describe("navigation contracts", () => {
  it("marks the two future surfaces as planned", () => {
    expect(globalNavigation.map((item) => item.key)).toEqual([
      "home",
      "projects",
      "quotes",
      "clients",
      "knowledge",
      "customerCare",
    ]);
    expect(globalNavigation.filter((i) => i.planned).map((i) => i.key)).toEqual([
      "knowledge",
      "customerCare",
    ]);
  });

  it("exposes only the four working project workspace surfaces", () => {
    expect(projectNavigation.map((item) => item.key)).toEqual([
      "overview",
      "quote",
      "compare",
      "actions",
    ]);
  });

  it("builds locale-scoped routes without adding organization authority", () => {
    expect(globalSurfaceHref("zh-TW", globalNavigation[0]!)).toBe("/zh-TW");
    expect(globalSurfaceHref("en", globalNavigation[1]!)).toBe("/en/projects");
    expect(projectSurfaceHref("en", "PRJ-TEST-001", projectNavigation[2]!)).toBe(
      "/en/projects/PRJ-TEST-001/compare",
    );
  });
});
