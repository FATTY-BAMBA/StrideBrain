import {
  displayIdentity,
  recordIdentity,
  cardLink,
  listFactPaths,
  listCountText,
  emptyListText,
  type AnswerCard,
  type AnswerPresentation,
  type AnswerRow,
} from "./answer-cards";
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
  return {
    parts: r.parts.map((p: AnswerPart) => ("show" in p ? { show: p.show.replace(/\s/gu, "") } : p)),
    followUps: r.followUps,
  };
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

  /** Without a registered list, the extra list slot cannot form a valid answer. */
  maxAnswerParts(): 13 | 14 {
    return this.lists.size ? 14 : 13;
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
    const ids = new Set<string>();
    const inline = (value: string) => value.replace(/[\r\n\u2028\u2029]+/g, " ");
    const separator = this.locale === "zh-TW" ? "：" : ": ";
    let facts = 0,
      lists = 0;
    const chosen: (Fact | List)[] = [];
    for (const part of parsed.parts.slice(1)) {
      if (!("show" in part)) return { kind: "REJECTED", reason: "INVALID_OUTPUT" };
      const fact = this.facts.get(part.show),
        list = this.lists.get(part.show);
      if (!fact && !list) return { kind: "REJECTED", reason: "UNKNOWN_REFERENCE" };
      if (shown.some((f) => f.ref === part.show))
        return { kind: "REJECTED", reason: "INVALID_OUTPUT" };
      if (fact && ++facts > 12) return { kind: "REJECTED", reason: "FACT_LIMIT" };
      if (list && ++lists > 1) return { kind: "REJECTED", reason: "LIST_LIMIT" };
      const value = (fact ?? list)!;
      chosen.push(value);
      shown.push({
        ref: value.ref,
        sourceId: value.sourceId,
        path: value.path,
        kind: fact ? "fact" : "list",
      });
    }
    const fieldsFor = (id: string) => [...this.facts.values()].filter((f) => f.sourceId === id);
    const headingOnly = (fact: Fact) => {
      const d = displayIdentity(this.sources.get(fact.sourceId)!);
      return (
        (["name", "description"].includes(fact.path) && fact.value === d.title) ||
        (fact.path === "reference" && fact.value === d.reference) ||
        (fact.path === "unit" && fact.value === d.unit)
      );
    };
    const visible = (f: Fact) =>
      !headingOnly(f) &&
      !["stageGroup", "appliedStageGroup", "coverage", "nextOffset"].includes(f.path);
    const covered = new Set<string>(),
      coveredRecords = new Set<string>();
    for (const item of chosen)
      if ("rows" in item) {
        for (const row of item.rows.slice(0, 10)) {
          coveredRecords.add(recordIdentity(row));
          for (const f of fieldsFor(row.sourceId)) covered.add(f.ref);
        }
        for (const f of fieldsFor(item.sourceId)) covered.add(f.ref);
      }
    const printed = new Set<string>();
    const blocks: (AnswerCard | { kind: "NOTICE"; text: string })[] = [];
    const cards = new Map<string, { card: AnswerCard; rows: AnswerRow[] }>();
    const rowFor = (fact: Fact, all: readonly Fact[]): AnswerRow => {
      const companions =
        fact.path === "lastPrice"
          ? ["lastQuoted", "timesQuoted", "documentNumber"]
          : fact.path === "clientLastPrice"
            ? ["clientLastQuoted", "clientDocumentNumber"]
            : [];
      const details = all.filter((f) => companions.includes(f.path));
      details.forEach((f) => printed.add(f.ref));
      return { ...fact, ...(details.length ? { details } : {}) };
    };
    const titleParts = (source: AssistantSource) => {
      const d = displayIdentity(source);
      return {
        title: inline(d.title),
        ...(d.reference ? { reference: d.reference } : {}),
        ...(d.unit ? { unit: this.locale === "zh-TW" ? `每${d.unit}` : `per ${d.unit}` } : {}),
      };
    };
    for (const item of chosen) {
      const source = this.sources.get(item.sourceId)!;
      if (!("rows" in item)) {
        if (covered.has(item.ref) || coveredRecords.has(recordIdentity(source))) continue;
        ids.add(item.sourceId);
        if (
          ["count", "matchingCount"].includes(item.path) &&
          item.value === "0" &&
          [...this.lists.values()].some(
            (list) => list.sourceId === item.sourceId && list.total === 0,
          )
        ) {
          if (
            !blocks.some(
              (block) =>
                block.kind === "NOTICE" && block.text === emptyListText(source, this.locale),
            )
          )
            blocks.push({ kind: "NOTICE", text: emptyListText(source, this.locale) });
          continue;
        }
        if (source.countSourceId) ids.add(source.countSourceId);
        const key = recordIdentity(source);
        let group = cards.get(key);
        if (!group) {
          const rows: AnswerRow[] = [];
          const card: AnswerCard = {
            kind: "CARD",
            key,
            ...titleParts(source),
            rows,
            link: cardLink(source, this.locale),
          };
          group = { card, rows };
          cards.set(key, group);
          blocks.push(card);
        }
        const all = fieldsFor(item.sourceId);
        const paths = priceReadingPaths(item.path);
        const picked = paths
          .map((path) => all.find((f) => f.path === path))
          .filter((f): f is Fact => !!f);
        // Prices own their quieter provenance even when companion refs precede them.
        const selectedPricePaths = chosen
          .filter(
            (f) =>
              !("rows" in f) &&
              f.sourceId === item.sourceId &&
              ["lastPrice", "clientLastPrice"].includes(f.path),
          )
          .flatMap((f) => priceReadingPaths(f.path).slice(1));
        for (const fact of picked) {
          if (printed.has(fact.ref) || selectedPricePaths.includes(fact.path)) continue;
          printed.add(fact.ref);
          if (visible(fact)) group.rows.push(rowFor(fact, all));
        }
      } else {
        ids.add(item.sourceId);
        if (!item.total) {
          blocks.push({ kind: "NOTICE", text: emptyListText(source, this.locale) });
          continue;
        }
        const paths = listFactPaths(source);
        const rows = item.rows.slice(0, 10).map((row) => {
          ids.add(row.sourceId);
          const all = fieldsFor(row.sourceId);
          const selected = (
            paths ? paths.flatMap((path) => all.filter((f) => f.path === path)) : all
          ).filter(visible);
          const details = new Set(
            selected
              .filter((f) => ["lastPrice", "clientLastPrice"].includes(f.path))
              .flatMap((f) => priceReadingPaths(f.path).slice(1)),
          );
          return {
            key: row.sourceId,
            ...titleParts(row),
            facts: selected.filter((f) => !details.has(f.path)).map((f) => rowFor(f, all)),
          };
        });
        const remaining = item.total - rows.length;
        const filter = displayIdentity(source).filter;
        blocks.push({
          kind: "CARD",
          key: source.sourceId,
          ...titleParts(source),
          rows: [],
          link: cardLink(source, this.locale),
          list: {
            count: item.total,
            countText: listCountText(source, item.total, this.locale),
            ...(filter
              ? { filter: { label: this.locale === "zh-TW" ? "階段" : "Stage", value: filter } }
              : {}),
            rows,
            remaining:
              remaining > 0
                ? this.locale === "zh-TW"
                  ? `另有 ${remaining} 筆。`
                  : `${remaining} more records.`
                : null,
          },
        });
      }
    }
    const presentation: AnswerPresentation = { version: 1, locale: this.locale, blocks };
    const factText = (row: AnswerRow) =>
      `${row.label}${separator}${inline(row.value)}${row.details?.length ? ` (${row.details.map((f) => `${f.label}${separator}${inline(f.value)}`).join(" · ")})` : ""}`;
    const titleText = (row: { title: string; reference?: string; unit?: string }) =>
      [row.title, row.reference, row.unit].filter(Boolean).join(" · ");
    const textBlocks = blocks.map((block) =>
      block.kind === "NOTICE"
        ? block.text
        : [
            titleText(block),
            ...block.rows.map(factText),
            ...(block.list
              ? [
                  block.list.countText,
                  ...(block.list.filter
                    ? [`${block.list.filter.label}${separator}${block.list.filter.value}`]
                    : []),
                  ...block.list.rows.map(
                    (r) =>
                      `${titleText(r)} — ${r.facts.map(factText).join(this.locale === "zh-TW" ? "；" : "; ")}`,
                  ),
                  ...(block.list.remaining ? [block.list.remaining] : []),
                ]
              : []),
          ].join("\n"),
    );
    const identities = sourceIdentities([...this.sources.values()]);
    const numbers = new Set([...this.facts.values()].flatMap((f) => numericTokens(f.value)));
    return {
      kind: "ACCEPTED",
      answer: {
        text: [answerPhrases[phraseId][this.locale], ...textBlocks].join("\n\n"),
        presentation,
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

/** Price and its recorded context form one page reading; model selection cannot split it. */
export function priceReadingPaths(path: string): readonly string[] {
  if (["quotedPrice", "reconciledActualCost", "overallDifference"].includes(path))
    return ["quotedPrice", "reconciledActualCost", "overallDifference"];
  return path === "lastPrice"
    ? ["lastPrice", "lastQuoted", "timesQuoted", "documentNumber"]
    : path === "clientLastPrice"
      ? ["clientLastPrice", "clientLastQuoted", "clientDocumentNumber"]
      : [path];
}
