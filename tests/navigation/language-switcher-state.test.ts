import { describe, expect, it } from "vitest";

import { localizedHref, pathForLocale } from "@/components/shell/language-switcher";

describe("Stage 6 language switcher state", () => {
  it("changes only the locale segment", () => {
    expect(pathForLocale("/en/projects/PRJ-XINYI-026/compare", "zh-TW")).toBe(
      "/zh-TW/projects/PRJ-XINYI-026/compare",
    );
  });

  it("preserves immutable comparison and selected-project query state", () => {
    const query =
      "run=cmprun_stage4&economics=econrun_stage5&selected=PRJ-NEIHU-021%2CPRJ-ZHONGSHAN-018";

    expect(localizedHref("/en/projects/PRJ-XINYI-026/compare", query, "zh-TW")).toBe(
      "/zh-TW/projects/PRJ-XINYI-026/compare?run=cmprun_stage4&economics=econrun_stage5&selected=PRJ-NEIHU-021%2CPRJ-ZHONGSHAN-018",
    );
  });

  it("does not add an empty query marker", () => {
    expect(localizedHref("/zh-TW/projects", "", "en")).toBe("/en/projects");
  });
});
