import { describe, it, expect } from "vitest";
import { identityMention, namedProjects } from "@/modules/assistant/domain/subjects";
const visible = [{ projectKey: "PRJ-XINYI-026", names: ["Xinyi flagship", "信義旗艦店裝修"] }];
describe("exact server identity matching", () => {
  it.each(["prj-xinyi-026 status?", "XINYI FLAGSHIP total?", "信義旗艦店裝修目前在哪個階段？"])(
    "matches the complete identity: %s",
    (text) => {
      expect(namedProjects(text, visible)).toEqual(visible);
    },
  );
  it.each(["026?", "PRJ-XINYI-026-extra?", "Xinyi?", "What stage is this job in?"])(
    "does not interpret fragments or ordinary wording: %s",
    (text) => {
      expect(namedProjects(text, visible)).toEqual([]);
    },
  );
  it("preserves the question's letter case", () => {
    expect(identityMention("XINYI FLAGSHIP total?", "Xinyi flagship")).toBe("XINYI FLAGSHIP");
  });
});
