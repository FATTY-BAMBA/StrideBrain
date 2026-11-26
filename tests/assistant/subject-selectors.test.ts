import { describe, it, expect } from "vitest";
import { declaredSubjects } from "@/modules/assistant/domain/subjects";
import { ordinaryQuestions, unresolvedQuestions } from "./subject-cases";
const visible = [{ projectKey: "PRJ-XINYI-026", names: ["Xinyi flagship", "信義旗艦店裝修"] }];
describe("model-declared subject metadata", () => {
  it.each(ordinaryQuestions)("does not interpret ordinary wording: %s", (question) => {
    expect(declaredSubjects({ namedJobs: [] }, question, visible)).toEqual([]);
  });
  it.each(unresolvedQuestions)(
    "refuses the exact copied unresolved identity: %s",
    (question, name) => {
      expect(declaredSubjects({ namedJobs: [name] }, question, visible)).toBeNull();
    },
  );
  it("accepts a literal authorized name/reference, never fuzzy or invented text", () => {
    expect(
      declaredSubjects(
        { namedJobs: ["信義旗艦店裝修"] },
        "信義旗艦店裝修目前在哪個階段？",
        visible,
      ),
    ).toEqual(["PRJ-XINYI-026"]);
    expect(
      declaredSubjects({ namedJobs: ["prj-xinyi-026"] }, "prj-xinyi-026 status?", visible),
    ).toEqual(["PRJ-XINYI-026"]);
    expect(
      declaredSubjects({ namedJobs: ["Xinyi flagship"] }, "A different job?", visible),
    ).toBeNull();
    expect(declaredSubjects({ namedJobs: ["Xinyi"] }, "Xinyi?", visible)).toBeNull();
    expect(declaredSubjects({}, "Xinyi flagship?", visible)).toBeNull();
    expect(declaredSubjects({ namedJobs: [" "] }, " ", visible)).toBeNull();
  });
});
