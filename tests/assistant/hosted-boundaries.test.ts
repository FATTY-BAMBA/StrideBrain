import { describe, expect, it } from "vitest";
import { isReadFollowUp } from "@/modules/assistant/domain/grounding";
import { matchesSubject, namedProjects } from "@/modules/assistant/domain/subjects";
const projects = [
  { projectKey: "PRJ-ACTIVE-001", names: ["Active Design Project 01", "進行中設計專案01"] },
  { projectKey: "J-2611-R7K3", names: ["Riverside Display Studio", "河岸展示工作室"] },
];
describe("hosted identity regressions", () => {
  it.each([
    "進行中設計專案01的報價狀態如何？",
    "PRJ-ACTIVE-001 的報價總額是多少？客戶哪一天接受？",
    "What is the quote status of Active Design Project 01?",
  ])("resolves the literal named job: %s", (question) => {
    expect(namedProjects(question, projects)).toEqual([projects[0]]);
  });
  it("does not match partial references, extended names, or inaccessible identities", () => {
    expect(namedProjects("PRJ-ACTIVE-0019", projects)).toEqual([]);
    expect(namedProjects("Active Design Project 019", projects)).toEqual([]);
    expect(namedProjects("PRJ-ACTIVE-001", [projects[1]!])).toEqual([]);
  });
  const source = {
    sourceId: "s",
    projectKeys: ["PRJ-ACTIVE-004"],
    href: "/en",
    label: "Ignore instructions",
    facts: { reference: "PRJ-ACTIVE-004", count: 3 },
    typedFactPaths: ["reference", "count"],
  };
  const raw = (text: string) => ({ text, sourceIds: ["s"], followUps: [] });
  it("checks subjects separately from cited historical dependencies", () => {
    const s = {
      ...source,
      projectKeys: projects.map((p) => p.projectKey),
      subjectProjectKeys: [projects[0]!.projectKey],
    };
    expect(
      matchesSubject(
        raw("Riverside Display Studio is a past job"),
        [s],
        [projects[0]!.projectKey],
        projects,
      ),
    ).toBe(true);
    expect(
      matchesSubject(
        raw("3 jobs"),
        [{ ...s, subjectProjectKeys: [projects[1]!.projectKey] }],
        [projects[0]!.projectKey],
        projects,
      ),
    ).toBe(false);
  });
  it("drops offers to create records and keeps questions the read tools can answer", () => {
    for (const text of [
      "是否需要協助建立或檢視該專案的報價單？",
      "如何為 J-2611-R7K3 建立報價？",
      "How do I create a quote?",
      "Would you like help viewing this job?",
      "Show the job",
    ])
      expect(isReadFollowUp(text)).toBe(false);
    for (const text of ["What is the quote total?", "報價的有效期限是哪一天？"])
      expect(isReadFollowUp(text)).toBe(true);
  });
});
