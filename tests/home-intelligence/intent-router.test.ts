import { describe, expect, it } from "vitest";
import type { DemoValueContext } from "@/lib/server/demo-value-context";
import type { ProjectWorkspaceDTO } from "@/modules/projects/domain/project-workspace";
import { resolveHomeIntent } from "@/modules/home-intelligence/home-intelligence";

const workspace = {
  project: {
    businessKey: "PRJ-XINYI-026",
    name: { display: "Xinyi Flagship Renovation" },
  },
  materials: [{ name: { display: "Imported stone" } }, { name: { display: "Oak veneer" } }],
  suppliers: [{ name: { display: "Formosa Stone Co." } }],
  evidence: [
    { sourceName: { display: "Xinyi Quote v3" } },
    { sourceName: { display: "Stone supplier offer" } },
  ],
  openActions: [{ actionKey: "ACT-1", title: "Review stone variance", status: "OPEN" }],
} as unknown as ProjectWorkspaceDTO;

const context: DemoValueContext = {
  projects: [
    { businessKey: "PRJ-XINYI-026", name: "Xinyi Flagship Renovation", active: true },
    { businessKey: "PRJ-NEIHU-021", name: "Neihu Tech Flagship", active: false },
  ],
  workspace,
};

const cases = [
  ["Have we done something similar before?", "MATCH"],
  ["Show me past projects like Xinyi", "MATCH"],
  ["Which past projects used imported stone?", "MATCH"],
  ["Where did we use oak veneer?", "MATCH"],
  ["Which supplier handled imported stone?", "MATCH"],
  ["Show Formosa Stone Co.", "MATCH"],
  ["Open Xinyi Quote v3", "MATCH"],
  ["Find the stone supplier offer document", "MATCH"],
  ["What looks unusual in this quotation?", "MATCH"],
  ["Show me the current quote", "MATCH"],
  ["What supports the imported stone difference?", "MATCH"],
  ["Show the evidence for this", "MATCH"],
  ["What should I review next?", "MATCH"],
  ["What needs attention?", "MATCH"],
  ["What actions are still open?", "MATCH"],
  ["Show follow-up actions", "MATCH"],
  ["Open Neihu Tech Flagship", "MATCH"],
  ["Write an email to the client", "NO_MATCH"],
  ["Who should I hire next month?", "NO_MATCH"],
  ["Prepare my payroll tax return", "NO_MATCH"],
] as const;

describe("bounded Home intent router", () => {
  it.each(cases)("%s -> %s", (query, expected) => {
    expect(resolveHomeIntent("en", query, context).kind).toBe(expected);
  });

  it("keeps unsupported intent honest instead of fabricating an answer", () => {
    const result = resolveHomeIntent("en", "Design a restaurant logo", context);
    expect(result).toEqual({ kind: "NO_MATCH" });
  });
});
