import type { Locale } from "@/modules/localization/config";
import { assistantFactLabels } from "@/modules/localization/assistant";
import type { AssistantSource, StructuredAnswer } from "./contracts";
import {
  isReadFollowUp,
  record,
  numericTokens,
  sourceIdentities,
  withoutReferences,
} from "./grounding";
import { modelFacts } from "./redaction";

/** Non-factual copy only. The model chooses an id, never writes an answer sentence. */
export const answerPhrases = {
  RECORDS_SHOW: { en: "Here is what the records show:", "zh-TW": "紀錄顯示：" },
} as const;
export type AnswerPart = Readonly<{ say: keyof typeof answerPhrases } | { show: string }>;
export type AnswerSelection = Readonly<{
  phraseId: keyof typeof answerPhrases;
  /** Server provenance for evaluation; not persisted with the screen's StructuredAnswer. */
  shown: readonly Readonly<{
    ref: string;
    sourceId: string;
    path: string;
    kind: "fact" | "list";
  }>[];
}>;
export const answerParameters = {
  type: "object",
  properties: {
    parts: {
      type: "array",
      maxItems: 14,
      items: {
        anyOf: [
          {
            type: "object",
            properties: { say: { type: "string", enum: Object.keys(answerPhrases) } },
            required: ["say"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              show: {
                type: "string",
                maxLength: 160,
                description:
                  "Copy one complete ref value from the tool data. Never a record alias, label, or value.",
              },
            },
            required: ["show"],
            additionalProperties: false,
          },
        ],
      },
    },
    followUps: { type: "array", items: { type: "string", maxLength: 160 }, maxItems: 3 },
  },
  required: ["parts", "followUps"],
  additionalProperties: false,
} as const;

export function parseFactAnswer(
  value: unknown,
): Readonly<{ parts: readonly AnswerPart[]; followUps: readonly string[] }> | null {
  const r = record(value);
  if (
    !r ||
    Object.keys(r).some((k) => !["parts", "followUps"].includes(k)) ||
    !Array.isArray(r.parts) ||
    r.parts.length > 14 ||
    !Array.isArray(r.followUps) ||
    r.followUps.length > 3 ||
    r.followUps.some((v) => typeof v !== "string" || v.length > 160)
  )
    return null;
  if (
    r.parts.some((p) => {
      const item = record(p);
      return (
        !item ||
        Object.keys(item).length !== 1 ||
        !(
          (typeof item.say === "string" && Object.hasOwn(answerPhrases, item.say)) ||
          (typeof item.show === "string" && item.show.length > 0 && item.show.length <= 160)
        )
      );
    })
  )
    return null;
  if (
    r.parts.length &&
    (!("say" in r.parts[0]) || r.parts.filter((p) => "say" in p).length !== 1 || r.parts.length < 2)
  )
    return null;
  return { parts: r.parts, followUps: r.followUps };
}

type Fact = Readonly<{ ref: string; sourceId: string; path: string; label: string; value: string }>;
type List = Readonly<{
  ref: string;
  sourceId: string;
  path: "list";
  rows: readonly AssistantSource[];
  total: number;
}>;
export type RenderedFacts =
  | Readonly<{
      kind: "REJECTED";
      reason: "INVALID_OUTPUT" | "UNKNOWN_REFERENCE" | "FACT_LIMIT" | "LIST_LIMIT";
    }>
  | Readonly<{ kind: "REFUSAL" }>
  | Readonly<{ kind: "ACCEPTED"; answer: StructuredAnswer; selection: AnswerSelection }>;

/** All keys and values are built here from server DTOs. Model strings only enter Map.get. */
export class AnswerFactRegistry {
  private readonly sources = new Map<string, AssistantSource>();
  private readonly aliases = new Map<string, string>();
  private readonly facts = new Map<string, Fact>();
  private readonly lists = new Map<string, List>();
  constructor(private readonly locale: Locale) {}

  register(sources: readonly AssistantSource[]): void {
    const labels = assistantFactLabels(this.locale);
    for (const source of sources) {
      if (this.sources.has(source.sourceId)) continue;
      this.sources.set(source.sourceId, source);
      const alias = `s${this.aliases.size + 1}`;
      this.aliases.set(source.sourceId, alias);
      const walk = (value: unknown, path: string, label: string): void => {
        if (value == null) return;
        if (Array.isArray(value)) {
          if (value.every((v) => typeof v === "string")) {
            if (value.length)
              this.facts.set(`${alias}.${path}`, {
                ref: `${alias}.${path}`,
                sourceId: source.sourceId,
                path,
                label,
                value: value.join(this.locale === "zh-TW" ? "、" : ", "),
              });
          } else value.forEach((v, i) => walk(v, `${path}.${i}`, label));
        } else if (typeof value === "object") {
          // A selected past job's name and score are one fact: independently selecting
          // row A's name and row B's score must not manufacture a different association.
          const row = record(value);
          if (
            /^pastJobs\.\d+$/.test(path) &&
            typeof row?.name === "string" &&
            typeof row.score === "string"
          ) {
            const ref = `${alias}.${path}`;
            this.facts.set(ref, {
              ref,
              sourceId: source.sourceId,
              path,
              label: labels.pastJobs!,
              value: `${row.name} · ${row.score}`,
            });
            return;
          }
          for (const [key, v] of Object.entries(value)) {
            if (!labels[key]) continue;
            // A finding is indivisible: retain its saved sentence, never reconstruct clauses.
            if (path.startsWith("findings.") && key !== "text") continue;
            walk(
              v,
              path ? `${path}.${key}` : key,
              path.startsWith("findings.")
                ? labels.findings!
                : path === "issued"
                  ? `${labels.issued} · ${labels[key]}`
                  : labels[key]!,
            );
          }
        } else if (typeof value === "string" || typeof value === "number") {
          this.facts.set(`${alias}.${path}`, {
            ref: `${alias}.${path}`,
            sourceId: source.sourceId,
            path,
            label,
            value: String(value),
          });
        }
      };
      walk(modelFacts(source.facts), "", "");
      const area = record(source.facts.area);
      if (typeof area?.value === "string" && typeof area.unit === "string") {
        const ref = `${alias}.area.value`;
        this.facts.set(ref, {
          ref,
          sourceId: source.sourceId,
          path: "area.value",
          label: labels.area!,
          value: `${area.value} ${area.unit}`,
        });
      }
    }
    for (const source of sources) {
      const rows = sources.filter((row) => row.countSourceId === source.sourceId);
      if (!rows.length && source.facts.count !== 0) continue;
      if (source.countSourceId) continue;
      const total = source.facts.matchingCount ?? source.facts.count;
      if (typeof total !== "number" || !Number.isSafeInteger(total) || total < rows.length)
        continue;
      const ref = `${this.aliases.get(source.sourceId)}.list`;
      this.lists.set(ref, { ref, sourceId: source.sourceId, path: "list", rows, total });
    }
  }

  /** Only labelled display values and selectable refs cross the model boundary. */
  modelSources(sources: readonly AssistantSource[]) {
    return sources.map((source) => ({
      name: source.label,
      facts: [...this.facts.values()]
        .filter((f) => f.sourceId === source.sourceId)
        .map(({ ref, label, value }) => ({ ref, label, value })),
      ...([...this.lists.values()].find((l) => l.sourceId === source.sourceId)
        ? {
            list: {
              ref: `${this.aliases.get(source.sourceId)}.list`,
            },
          }
        : {}),
    }));
  }

  render(raw: unknown): RenderedFacts {
    const parsed = parseFactAnswer(raw);
    if (!parsed) return { kind: "REJECTED", reason: "INVALID_OUTPUT" };
    if (!parsed.parts.length) return { kind: "REFUSAL" };
    const phraseId = (parsed.parts[0] as { say: keyof typeof answerPhrases }).say;
    const shown: AnswerSelection["shown"][number][] = [];
    const groups = new Map<string, string[]>();
    const ids = new Set<string>();
    const inline = (value: string) => value.replace(/[\r\n\u2028\u2029]+/g, " ");
    const separator = this.locale === "zh-TW" ? "：" : ": ";
    let facts = 0,
      lists = 0;
    const add = (id: string, line: string) => {
      ids.add(id);
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id)!.push(line);
      const count = this.sources.get(id)?.countSourceId;
      if (count) ids.add(count);
    };
    for (const part of parsed.parts.slice(1)) {
      if (!("show" in part)) return { kind: "REJECTED", reason: "INVALID_OUTPUT" };
      const fact = this.facts.get(part.show),
        list = this.lists.get(part.show);
      if (!fact && !list) return { kind: "REJECTED", reason: "UNKNOWN_REFERENCE" };
      if (shown.some((f) => f.ref === part.show))
        return { kind: "REJECTED", reason: "INVALID_OUTPUT" };
      if (fact) {
        if (++facts > 12) return { kind: "REJECTED", reason: "FACT_LIMIT" };
        add(fact.sourceId, `${fact.label}${separator}${inline(fact.value)}`);
        shown.push({ ref: fact.ref, sourceId: fact.sourceId, path: fact.path, kind: "fact" });
      } else if (list) {
        if (++lists > 1) return { kind: "REJECTED", reason: "LIST_LIMIT" };
        const countLabel = assistantFactLabels(this.locale).count;
        add(list.sourceId, `${countLabel}${separator}${list.total}`);
        const filter = this.sources.get(list.sourceId)?.facts.appliedStageGroup;
        if (typeof filter === "string")
          add(
            list.sourceId,
            `${assistantFactLabels(this.locale).appliedStageGroup}${separator}${filter}`,
          );
        for (const row of list.rows.slice(0, 10)) {
          ids.add(row.sourceId);
          const fields = [...this.facts.values()].filter(
            (f) => f.sourceId === row.sourceId && f.path !== "name",
          );
          add(
            list.sourceId,
            `${inline(row.label)} — ${fields.map((f) => `${f.label}${separator}${inline(f.value)}`).join(this.locale === "zh-TW" ? "；" : "; ")}`,
          );
        }
        const remaining = list.total - Math.min(list.rows.length, 10);
        if (remaining > 0)
          add(
            list.sourceId,
            this.locale === "zh-TW" ? `另有 ${remaining} 筆紀錄。` : `${remaining} more records.`,
          );
        shown.push({ ref: list.ref, sourceId: list.sourceId, path: list.path, kind: "list" });
      }
    }
    const identities = sourceIdentities([...this.sources.values()]);
    const numbers = new Set([...this.facts.values()].flatMap((f) => numericTokens(f.value)));
    const blocks = [...groups].map(
      ([id, lines]) => `${inline(this.sources.get(id)!.label)}\n${lines.join("\n")}`,
    );
    return {
      kind: "ACCEPTED",
      answer: {
        text: [answerPhrases[phraseId][this.locale], ...blocks].join("\n\n"),
        sourceIds: [...ids],
        followUps: parsed.followUps.filter(
          (t) =>
            isReadFollowUp(t) &&
            !/https?:|www\.|[<>]/i.test(t) &&
            numericTokens(withoutReferences(t, identities)).every((n) => numbers.has(n)),
        ),
      },
      selection: { phraseId, shown },
    };
  }
}
