import { describe, it, expect } from "vitest";
import {
  redactSource,
  redactText,
  typedAnswerValues,
  modelFacts,
} from "@/modules/assistant/domain/redaction";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
import { readFileSync } from "node:fs";
const source: AssistantSource = {
  sourceId: "s",
  label: "Job",
  href: "/en",
  projectKeys: ["J"],
  facts: { validUntil: "2026-12-22" },
  typedFactPaths: ["validUntil"],
};
describe("review regressions", () => {
  it.each(["20261103-01", "2026-0012", "113-0825-01", "J-2611-2345"])(
    "preserves authorized reference %s in free text and structured results",
    (reference) => {
      const facts = {
        reference,
        amount: "12500000.00",
        name: `${reference} A123456789 12345678901234`,
        documentNumber: reference,
      };
      const safe = redactSource(
        { ...source, facts, typedFactPaths: ["reference", "amount", "documentNumber"] },
        [reference],
      );
      expect(safe.facts).toEqual({ ...facts, name: `${reference} [removed] [removed]` });
      expect(redactText(`What is the quote for ${reference}?`, [reference])).toBe(
        `What is the quote for ${reference}?`,
      );
      expect(redactText(`${reference}: 12500000.00`, typedAnswerValues([safe]))).toBe(
        `${reference}: 12500000.00`,
      );
      expect(redactText(`password=${reference}`, [reference])).toBe("password=[removed]");
    },
  );
  it("does not exempt amounts in free-text names, or unapproved reference-like account values", () => {
    const safe = redactSource(
      {
        ...source,
        facts: { amount: "12500000.00", name: "A123456789 12345678901234" },
        typedFactPaths: ["amount"],
      },
      [],
    );
    expect(safe.facts).toEqual({ amount: "12500000.00", name: "[removed] [removed]" });
    expect(redactText("12345678901234")).toBe("[removed]");
  });
  it("strips nested internal ids from model data while preserving server traceability", () => {
    const facts = {
      evidenceReferenceIds: ["private_12345678901234"],
      nested: [{ projectId: "internal", text: "visible" }],
      count: 3,
    };
    const safe = redactSource({ ...source, facts, typedFactPaths: ["count"] }, []);
    expect(safe.facts.evidenceReferenceIds).toEqual(facts.evidenceReferenceIds);
    expect(modelFacts(safe.facts)).toEqual({ nested: [{ text: "visible" }], count: 3 });
  });
  it("gives the paid key only to the evaluation step and checks out the chosen revision", () => {
    const workflow = readFileSync(".github/workflows/ai-evaluation.yml", "utf8");
    const evaluation = workflow.indexOf("      - name: Run paid model evaluation");
    expect(workflow.slice(0, evaluation)).not.toContain("secrets.STRIDEBRAIN_GEMINI_API_KEY");
    expect(workflow.slice(evaluation)).toMatch(
      /env:\s+STRIDEBRAIN_GEMINI_API_KEY:.*secrets\.STRIDEBRAIN_GEMINI_API_KEY/,
    );
    expect(workflow).toContain("ref: ${{ inputs.ref }}");
    expect(workflow.match(/secrets.STRIDEBRAIN_GEMINI_API_KEY/g)).toHaveLength(1);
  });
});
