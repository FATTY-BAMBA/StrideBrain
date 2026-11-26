import { describe, it, expect } from "vitest";
import { declaredSubjects, identityMention } from "@/modules/assistant/domain/subjects";
import { ordinaryQuestions, unresolvedQuestions } from "./subject-cases";
const visible = [{ projectKey: "PRJ-XINYI-026", names: ["Xinyi flagship", "信義旗艦店裝修"] }];
describe("model-declared subject metadata", () => {
  it.each(ordinaryQuestions)("does not interpret ordinary wording: %s", (question) => {
    expect(declaredSubjects({ jobMentions: [] }, question, visible)).toEqual([]);
  });
  it.each(unresolvedQuestions)(
    "refuses the exact copied unresolved identity: %s",
    (question, name) => {
      expect(declaredSubjects({ jobMentions: [name] }, question, visible)).toBeNull();
    },
  );
  it("rejects the run-5 page-reference and translated-alias metadata instead of weakening occurrence checks", () => {
    expect(
      declaredSubjects({ jobMentions: ["PRJ-XINYI-026"] }, "What stage is this job in?", visible),
    ).toBeNull();
    expect(
      declaredSubjects(
        { jobMentions: ["Xinyi flagship", "信義旗艦店裝修"] },
        "What is the total for Xinyi flagship?",
        visible,
      ),
    ).toBeNull();
    expect(
      declaredSubjects(
        { jobMentions: ["Xinyi flagship"] },
        "What is the total for Xinyi flagship?",
        visible,
      ),
    ).toEqual(["PRJ-XINYI-026"]);
    expect(identityMention("XINYI FLAGSHIP total?", "Xinyi flagship")).toBe("XINYI FLAGSHIP");
    expect(identityMention("Xinyi flagship extension", "Xinyi flagship")).toBe("Xinyi flagship");
  });
  it("accepts a literal authorized name/reference, never fuzzy or invented text", () => {
    expect(
      declaredSubjects(
        { jobMentions: ["信義旗艦店裝修"] },
        "信義旗艦店裝修目前在哪個階段？",
        visible,
      ),
    ).toEqual(["PRJ-XINYI-026"]);
    expect(
      declaredSubjects({ jobMentions: ["prj-xinyi-026"] }, "prj-xinyi-026 status?", visible),
    ).toEqual(["PRJ-XINYI-026"]);
    expect(
      declaredSubjects({ jobMentions: ["Xinyi flagship"] }, "A different job?", visible),
    ).toBeNull();
    expect(declaredSubjects({ jobMentions: ["Xinyi"] }, "Xinyi?", visible)).toBeNull();
    expect(declaredSubjects({}, "Xinyi flagship?", visible)).toBeNull();
    expect(declaredSubjects({ jobMentions: [" "] }, " ", visible)).toBeNull();
  });
});
