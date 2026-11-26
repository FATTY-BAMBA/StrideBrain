"use server";

import { scheduleAssistantTurnTiming } from "@/lib/server/assistant-turn-timing";
import { assistantConfigured } from "@/lib/server/assistant-availability";
import {
  claimFindingText,
  recommendationText,
} from "@/modules/economics/presentation/claim-findings";
import { findingsCopy } from "@/modules/localization/economics-findings";
import { mentionedCategory } from "@/modules/localization/jobs";
import type { HomeComparisonOutcome } from "@/modules/home-intelligence/application/get-home-comparison";
import type { Route } from "next";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { loadDemoValueContext } from "@/lib/server/demo-value-context";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import { getComparisonCopy } from "@/modules/comparison-experience/copy";
import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";
import type {
  EvidencePanelOutcome,
  EvidencePanelSelection,
} from "@/modules/evidence-panel/contracts";
import { isSupportedLocale, type Locale } from "@/modules/localization/config";
import type {
  HomeChatCitation,
  HomeChatContext,
  HomeChatState,
  HomeChatTurn,
} from "@/modules/home-intelligence/chat-contracts";

function append(
  state: HomeChatState,
  turns: readonly HomeChatTurn[],
  context: HomeChatContext = state.context,
): HomeChatState {
  return Object.freeze({
    turns: Object.freeze([...state.turns, ...turns].slice(-10)),
    context: Object.freeze(context),
  });
}

function localizedName(locale: Locale, value: { nameEn: string; nameZhTw: string }): string {
  return locale === "zh-TW" ? value.nameZhTw : value.nameEn;
}

function citationMarkers(citations: readonly HomeChatCitation[]): string {
  return citations.map((citation) => `[${citation.index}]`).join("");
}

function uniqueCitations(
  groups: readonly (readonly HomeChatCitation[])[],
): readonly HomeChatCitation[] {
  const result: HomeChatCitation[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    for (const citation of group) {
      if (seen.has(citation.sourceKey)) continue;
      seen.add(citation.sourceKey);
      result.push(Object.freeze({ ...citation, index: result.length + 1 }));
    }
  }
  return Object.freeze(result);
}

function evidenceHref(
  locale: Locale,
  projectKey: string,
  comparisonRunId: string,
  economicsRunId: string,
  selectedProjectKeys: readonly string[],
  claimKey: string,
): Route {
  return comparisonHref(locale, projectKey, {
    comparisonRunId,
    economicsRunId,
    selectedProjectKeys,
    evidenceClaimKey: claimKey,
  }) as Route;
}

async function claimCitations(
  services: ReturnType<typeof createComparisonServices>,
  runtime: NonNullable<Awaited<ReturnType<typeof resolveServerRuntimeContext>>>,
  locale: Locale,
  projectKey: string,
  comparisonRunId: string,
  economicsRunId: string,
  selectedProjectKeys: readonly string[],
  claimKey: string,
): Promise<readonly HomeChatCitation[]> {
  const structural = await services.getComparison.execute(runtime, comparisonRunId);
  const economics = await services.getEconomics.execute(runtime, economicsRunId);
  if (structural.kind !== "COMPLETE" || !economics) return [];
  if (
    structural.result.activeContext.projectKey !== projectKey ||
    economics.run.comparisonRunId !== structural.result.run.id
  )
    return [];

  const freshness = await services.getFreshness.check(runtime, structural.result, economics);
  const selection: EvidencePanelSelection = {
    mode: "CLAIM",
    comparisonRunId,
    enrichmentRunId: economicsRunId,
    claimKey,
  };
  const outcome: EvidencePanelOutcome = await services.getEvidencePanel.execute(
    runtime,
    selection,
    locale,
    freshness,
  );
  if (outcome.kind !== "READY") return [];

  const fullHref = evidenceHref(
    locale,
    projectKey,
    comparisonRunId,
    economicsRunId,
    selectedProjectKeys,
    claimKey,
  );

  return Object.freeze(
    outcome.view.sources.slice(0, 4).map((source, index) =>
      Object.freeze({
        index: index + 1,
        sourceKey: source.sourceKey,
        title: source.title,
        sourceType: source.objectTypeLabel,
        ...(source.projectLabel ? { project: source.projectLabel } : {}),
        locator: source.locatorLabel,
        authority: source.authorityLabel,
        ...(source.supportedValueLabel ? { supportedValue: source.supportedValueLabel } : {}),
        conditions: source.conditionLabels,
        preview: source.preview.state === "STRUCTURED" ? source.preview.fields : Object.freeze([]),
        fullHref,
      }),
    ),
  );
}

type ComparisonBundle = Readonly<{
  comparison: Stage4ComparisonResult;
  economics: Stage5EconomicsResult | null;
}>;

async function comparisonBundle(
  services: ReturnType<typeof createComparisonServices>,
  runtime: NonNullable<Awaited<ReturnType<typeof resolveServerRuntimeContext>>>,
  projectKey: string,
  saved?: HomeComparisonOutcome | null,
): Promise<ComparisonBundle | null> {
  if (saved?.kind === "AVAILABLE" && saved.comparison.activeContext.projectKey === projectKey)
    return { comparison: saved.comparison, economics: saved.economics ?? null };
  if (saved) return null;
  const structural = await services.runComparison.execute(runtime, projectKey);
  if (structural.kind !== "COMPLETE") return null;

  const economicsOutcome = await services.runEconomics.execute(
    runtime,
    structural.result.run.id,
    structural.result.defaultSelectedProjectKeys,
  );
  const economics = "result" in economicsOutcome ? economicsOutcome.result : null;
  return Object.freeze({ comparison: structural.result, economics });
}

function nextContext(
  previous: HomeChatContext,
  bundle: ComparisonBundle,
  updates: Readonly<Partial<HomeChatContext>>,
): HomeChatContext {
  return Object.freeze({
    ...previous,
    comparisonRunId: bundle.comparison.run.id,
    ...(bundle.economics ? { economicsRunId: bundle.economics.run.id } : {}),
    selectedProjectKeys:
      bundle.economics?.selectedProjectKeys ?? bundle.comparison.defaultSelectedProjectKeys,
    ...updates,
  });
}

function projectMentioned(normalized: string, name: string, locale: Locale): boolean {
  const localized = name.toLocaleLowerCase(locale);
  if (normalized.includes(localized)) return true;
  if (locale === "zh-TW")
    return localized.length >= 2 && normalized.includes(localized.slice(0, 2));
  const first = localized.split(/\s+/)[0] ?? "";
  return first.length >= 4 && normalized.includes(first);
}

function comparableReply(
  locale: Locale,
  match: Stage4ComparisonResult["matches"][number],
): Readonly<{ text: string; bullets: readonly string[] }> {
  const copy = getComparisonCopy(locale);
  const name = localizedName(locale, match.project);
  const strongest = match.strongestFactors
    .slice(0, 3)
    .map((factor) => copy.factors[factor.factorKey]);
  const differences = match.differences.slice(0, 2).map((factor) => copy.factors[factor.factorKey]);
  return Object.freeze({
    text:
      locale === "zh-TW"
        ? `${name} 的相似度是 ${match.displayScore}/100。最主要的相似原因是：`
        : `${name} scores ${match.displayScore}/100. The strongest reasons it matches are:`,
    bullets: Object.freeze([
      ...strongest,
      ...(differences.length
        ? [
            locale === "zh-TW"
              ? `主要差異：${differences.join("、")}`
              : `Main differences: ${differences.join(", ")}`,
          ]
        : []),
    ]),
  });
}

async function askKeywordAction(
  previous: HomeChatState,
  formData: FormData,
  options: Readonly<{ onlyMatched?: boolean; subjectProjectKey?: string }> = {},
): Promise<HomeChatState> {
  const { onlyMatched = false, subjectProjectKey } = options;
  const rawLocale = formData.get("locale");
  const rawMessage = formData.get("message");
  if (
    typeof rawLocale !== "string" ||
    !isSupportedLocale(rawLocale) ||
    typeof rawMessage !== "string"
  )
    return previous;

  const locale = rawLocale;
  const query = rawMessage.trim().slice(0, 280);
  if (!query) return previous;

  const now = Date.now();
  const userTurn: HomeChatTurn = {
    id: `user-${now}`,
    role: "user",
    text: query,
  };

  const requestedProject = subjectProjectKey ?? formData.get("projectKey");
  if (
    requestedProject !== null &&
    (typeof requestedProject !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(requestedProject))
  )
    return previous;
  const context = await loadDemoValueContext(locale, requestedProject ?? undefined);
  const workspace = context.workspace;
  if (!workspace) {
    if (onlyMatched) return previous;
    return append(previous, [
      userTurn,
      {
        id: `assistant-${now}`,
        role: "assistant",
        text:
          locale === "zh-TW"
            ? "目前無法讀取可用的專案內容。請先確認示範工作階段仍有效。"
            : "I can’t read an available project right now. Please check that the demo session is still active.",
      },
    ]);
  }

  const normalized = query.toLocaleLowerCase(locale);
  const base = `/${locale}/projects/${encodeURIComponent(workspace.project.businessKey)}`;
  const runtime = await resolveServerRuntimeContext();
  if (!runtime?.firmLists) return previous;
  const workCategories = runtime.firmLists.workCategories;
  const services = createComparisonServices();

  const evidenceFollowup =
    /(that|those|the).*(source|evidence)|show.*(source|evidence)|open.*(source|evidence)|剛才.*(佐證|來源)|顯示.*(佐證|來源)|查看.*(佐證|來源)/i.test(
      normalized,
    );
  const rememberedComparable = previous.context.comparableProjects?.find((project) =>
    projectMentioned(normalized, project.name, locale),
  );
  const whyFollowup = /^(why|why\?|why is that|how come|為什麼|原因是什麼|怎麼說)[？?]?$/i.test(
    normalized,
  );

  const namedProject = context.projects.find((project) =>
    normalized.includes(project.name.toLocaleLowerCase(locale)),
  );
  if (namedProject) {
    return append(
      previous,
      [
        userTurn,
        {
          id: `assistant-${now}`,
          role: "assistant",
          text:
            locale === "zh-TW"
              ? `我找到「${namedProject.name}」。你可以直接開啟專案紀錄。`
              : `I found “${namedProject.name}”. You can open the project record directly.`,
          action: {
            label: locale === "zh-TW" ? "開啟專案" : "Open project",
            href: `/${locale}/projects/${encodeURIComponent(namedProject.businessKey)}` as Route,
          },
        },
      ],
      Object.freeze({ ...previous.context, lastIntent: "PROJECT" }),
    );
  }

  if (/(action|follow.?up|未完成|行動|追蹤)/i.test(normalized)) {
    const count = workspace.openActions.length;
    return append(
      previous,
      [
        userTurn,
        {
          id: `assistant-${now}`,
          role: "assistant",
          text:
            locale === "zh-TW"
              ? count
                ? `目前有 ${count} 項未完成事項。`
                : "目前沒有未完成事項。"
              : count
                ? `There ${count === 1 ? "is" : "are"} ${count} open action${count === 1 ? "" : "s"}.`
                : "There are no open actions right now.",
          bullets: workspace.openActions.slice(0, 3).map((item) => item.title),
          action: {
            label: locale === "zh-TW" ? "查看未完成事項" : "View actions",
            href: `${base}/actions` as Route,
          },
        },
      ],
      Object.freeze({ ...previous.context, lastIntent: "ACTIONS" }),
    );
  }

  const explicitSimilar = /(similar|past project|done before|類似|以前做過|過往專案)/i.test(
    normalized,
  );
  const categoryIntent = /(\bstone\b|石材|\bmaterials?\b|材料)/i.test(normalized);
  const lightingIntent = /(\blighting\b|\blight fixtures?\b|燈具|照明)/i.test(normalized);
  const quoteIntent =
    /(quote|quotation|報價|unusual|attention|review next|留意|下一步|異常)/i.test(normalized) ||
    lightingIntent;

  const followupComparable =
    rememberedComparable ??
    (whyFollowup && previous.context.lastIntent === "SIMILAR"
      ? previous.context.comparableProjects?.find(
          (project) => project.projectKey === previous.context.activeComparableProjectKey,
        )
      : undefined);

  const followupCategory = whyFollowup && previous.context.lastIntent === "CATEGORY";
  const followupQuote = whyFollowup && previous.context.lastIntent === "QUOTE";

  const needsComparison =
    explicitSimilar ||
    categoryIntent ||
    quoteIntent ||
    !!followupComparable ||
    followupCategory ||
    followupQuote ||
    /(evidence|source|support|佐證|來源)/i.test(normalized);

  if (!needsComparison) {
    if (onlyMatched) return previous;
    return append(previous, [
      userTurn,
      {
        id: `assistant-${now}`,
        role: "assistant",
        text:
          locale === "zh-TW"
            ? "這個版本目前還不能可靠回答這個問題。你可以問：做過哪些類似專案、報價哪裡值得留意、材料差異、佐證來源，或未完成事項。"
            : "I can’t answer that reliably yet. Try asking about similar past projects, what looks unusual in the quote, material differences, supporting evidence, or open actions.",
      },
    ]);
  }

  if (
    context.intelligence?.kind === "OUT_OF_DATE" ||
    context.intelligence?.kind === "UNAVAILABLE"
  ) {
    const copy = findingsCopy(locale);
    return append(
      previous,
      [
        userTurn,
        {
          id: `assistant-${now}`,
          role: "assistant",
          text: context.intelligence.kind === "OUT_OF_DATE" ? copy.outOfDate : copy.unavailable,
          action: {
            label: locale === "zh-TW" ? "開啟比較" : "Open comparison",
            href: comparisonHref(locale, workspace.project.businessKey) as Route,
          },
        },
      ],
      {},
    );
  }

  const bundle = await comparisonBundle(
    services,
    runtime,
    workspace.project.businessKey,
    context.intelligence,
  );
  if (!bundle) {
    return append(previous, [
      userTurn,
      {
        id: `assistant-${now}`,
        role: "assistant",
        text:
          locale === "zh-TW"
            ? "目前無法完成歷史比較。我不會在沒有足夠資料時猜測。"
            : "I can’t complete the historical comparison right now, so I won’t guess.",
      },
    ]);
  }

  const comparison = bundle.comparison;
  const economics = bundle.economics;
  const selectedProjectKeys =
    economics?.selectedProjectKeys ?? comparison.defaultSelectedProjectKeys;
  const compareHref = comparisonHref(locale, workspace.project.businessKey, {
    comparisonRunId: comparison.run.id,
    ...(economics ? { economicsRunId: economics.run.id } : {}),
    selectedProjectKeys,
  });

  // Follow-ups use only the currently validated saved result, never browser-supplied run IDs.
  if (
    evidenceFollowup &&
    !mentionedCategory(query, workCategories) &&
    !/(\bquote\b|\bquotation\b|報價)/i.test(normalized) &&
    previous.context.activeClaimKey &&
    economics &&
    economics.claims.some((claim) => claim.claimKey === previous.context.activeClaimKey)
  ) {
    const citations = await claimCitations(
      services,
      runtime,
      locale,
      workspace.project.businessKey,
      comparison.run.id,
      economics.run.id,
      selectedProjectKeys,
      previous.context.activeClaimKey,
    );
    return append(
      previous,
      [
        userTurn,
        {
          id: `assistant-${now}`,
          role: "assistant",
          text:
            locale === "zh-TW"
              ? `這些是剛才那項發現所依據的來源。${citationMarkers(citations)}`
              : `These are the sources behind that finding. ${citationMarkers(citations)}`,
          ...(citations.length ? { citations } : {}),
        },
      ],
      nextContext(previous.context, bundle, {}),
    );
  }

  if (followupComparable) {
    const match = comparison.matches.find(
      (candidate) => candidate.project.projectKey === followupComparable.projectKey,
    );
    if (match) {
      const reply = comparableReply(locale, match);
      return append(
        previous,
        [
          userTurn,
          {
            id: `assistant-${now}`,
            role: "assistant",
            text: reply.text,
            bullets: reply.bullets,
            action: {
              label: locale === "zh-TW" ? "查看完整比較" : "Open full comparison",
              href: compareHref as Route,
            },
          },
        ],
        nextContext(previous.context, bundle, {
          lastIntent: "SIMILAR",
          activeComparableProjectKey: match.project.projectKey,
          activeComparableProjectName: localizedName(locale, match.project),
        }),
      );
    }
  }

  if (explicitSimilar) {
    const top = comparison.matches.slice(0, 3);
    const references = Object.freeze(
      top.map((match) =>
        Object.freeze({
          projectKey: match.project.projectKey,
          name: localizedName(locale, match.project),
        }),
      ),
    );
    return append(
      previous,
      [
        userTurn,
        {
          id: `assistant-${now}`,
          role: "assistant",
          text:
            locale === "zh-TW"
              ? `我找到 ${comparison.matches.length} 個可比較的已完成專案。最接近的是：`
              : `I found ${comparison.matches.length} comparable completed projects. The closest are:`,
          bullets: top.map(
            (match) => `${localizedName(locale, match.project)} · ${match.displayScore}/100`,
          ),
          action: {
            label: locale === "zh-TW" ? "查看比較" : "View comparison",
            href: compareHref as Route,
          },
        },
      ],
      nextContext(previous.context, bundle, {
        lastIntent: "SIMILAR",
        comparableProjects: references,
        ...(references[0]
          ? {
              activeComparableProjectKey: references[0].projectKey,
              activeComparableProjectName: references[0].name,
            }
          : {}),
      }),
    );
  }

  if (
    categoryIntent ||
    followupCategory ||
    quoteIntent ||
    followupQuote ||
    mentionedCategory(query, workCategories)
  ) {
    const explicitCategory = mentionedCategory(query, workCategories);
    const rememberedClaim =
      followupCategory || followupQuote
        ? economics?.claims.find((claim) => claim.claimKey === previous.context.activeClaimKey)
        : undefined;
    const categoryId = explicitCategory ?? rememberedClaim?.categoryId;
    const noRecord =
      categoryId &&
      !workspace.project.scopeCategories.some((category) => category.categoryId === categoryId) &&
      !economics?.categories.some((category) => category.categoryId === categoryId);
    const copy = findingsCopy(locale);
    const claims =
      economics?.accessScope === "STRUCTURAL_ONLY"
        ? []
        : (economics?.claims ?? []).filter((claim) =>
            categoryId
              ? claim.categoryId === categoryId
              : categoryIntent
                ? Boolean(claim.categoryId)
                : true,
          );
    const findings =
      comparison.activeContext.activeQuoteVersionKey && !noRecord
        ? claims.flatMap((claim) => {
            const text = claimFindingText(claim, locale, workCategories);
            return text ? [{ claim, text }] : [];
          })
        : [];
    const groups = economics
      ? await Promise.all(
          findings.map(({ claim }) =>
            claimCitations(
              services,
              runtime,
              locale,
              workspace.project.businessKey,
              comparison.run.id,
              economics.run.id,
              selectedProjectKeys,
              claim.claimKey,
            ),
          ),
        )
      : [];
    const citations = uniqueCitations(groups);
    const bullets = findings.map(({ text }, index) => {
      const indexed = citations.filter((citation) =>
        groups[index]?.some((source) => source.sourceKey === citation.sourceKey),
      );
      return `${text} ${citationMarkers(indexed)}`.trim();
    });
    const firstClaim = findings[0]?.claim;
    const remembered = { ...previous.context };
    delete remembered.activeClaimKey;
    delete remembered.lastIntent;
    const text = noRecord
      ? locale === "zh-TW"
        ? "此專案沒有該類別的紀錄。"
        : "There is no record for that category in this job."
      : !comparison.activeContext.activeQuoteVersionKey
        ? copy.noQuote
        : !economics || economics.accessScope === "STRUCTURAL_ONLY"
          ? copy.noEconomics
          : findings.length
            ? copy.detail
            : (recommendationText(economics, locale, workCategories) ?? copy.noEconomics);
    return append(
      previous,
      [
        userTurn,
        {
          id: `assistant-${now}`,
          role: "assistant",
          text,
          ...(bullets.length ? { bullets: Object.freeze(bullets) } : {}),
          ...(citations.length ? { citations } : {}),
          action: {
            label: locale === "zh-TW" ? "查看比較與佐證" : "Open comparison and evidence",
            href:
              firstClaim && economics
                ? evidenceHref(
                    locale,
                    workspace.project.businessKey,
                    comparison.run.id,
                    economics.run.id,
                    selectedProjectKeys,
                    firstClaim.claimKey,
                  )
                : (compareHref as Route),
          },
        },
      ],
      nextContext(
        remembered,
        bundle,
        firstClaim
          ? {
              lastIntent: categoryIntent || followupCategory ? "CATEGORY" : "QUOTE",
              activeClaimKey: firstClaim.claimKey,
            }
          : {},
      ),
    );
  }

  return append(
    previous,
    [
      userTurn,
      {
        id: `assistant-${now}`,
        role: "assistant",
        text:
          locale === "zh-TW"
            ? "我找到了相關比較資料。你可以開啟比較與佐證繼續查看。"
            : "I found relevant comparison data. You can open the comparison and evidence to inspect it.",
        action: {
          label: locale === "zh-TW" ? "查看比較" : "View comparison",
          href: compareHref as Route,
        },
      },
    ],
    nextContext(previous.context, bundle, {}),
  );
}

/** Optional model path. With no key/flag, retain the existing keyword behavior exactly. */
export async function askHomeAction(
  previous: HomeChatState,
  formData: FormData,
): Promise<HomeChatState> {
  const startedAt = new Date();
  const rawLocale = formData.get("locale"),
    rawMessage = formData.get("message"),
    rawProject = formData.get("projectKey");
  let attempted = false;
  let subjectProjectKey: string | undefined;
  if (
    typeof rawLocale === "string" &&
    isSupportedLocale(rawLocale) &&
    typeof rawMessage === "string" &&
    rawMessage.trim() &&
    rawMessage.length <= 280 &&
    (rawProject === null ||
      (typeof rawProject === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(rawProject)))
  ) {
    try {
      const runtime = await resolveServerRuntimeContext();
      if (runtime) scheduleAssistantTurnTiming(runtime, startedAt);
      if (runtime && assistantConfigured()) {
        const { createAssistantServices } = await import("@/lib/server/assistant-services");
        const result = await createAssistantServices().ask.execute(
          { ...runtime, locale: rawLocale },
          {
            question: rawMessage.trim(),
            previousQuestions: previous.turns
              .filter(
                (t) => t.role === "user" && typeof t.text === "string" && t.text.length <= 280,
              )
              .slice(-9)
              .map((t) => t.text),
            ...(typeof rawProject === "string" ? { projectKey: rawProject } : {}),
          },
        );
        if (result.kind === "ANSWER") {
          const now = Date.now();
          return append(previous, [
            { id: `user-${now}`, role: "user", text: rawMessage.trim() },
            {
              id: `assistant-${now}`,
              role: "assistant",
              text: result.answer.text,
              ai: true,
              aiSources: result.sources.map((s) => ({
                sourceId: s.sourceId,
                label: s.label,
                href: s.href as Route,
              })),
              aiFollowUps: result.answer.followUps,
              ...(result.answer.presentation ? { aiPresentation: result.answer.presentation } : {}),
              ...(result.action
                ? { action: { ...result.action, href: result.action.href as Route } }
                : {}),
            },
          ]);
        }
        attempted = !["DISABLED", "NO_KEY"].includes(result.reason);
        subjectProjectKey = result.subjectProjectKey;
      }
    } catch {
      attempted = true;
    }
  }
  const result = await askKeywordAction(
    previous,
    formData,
    subjectProjectKey ? { subjectProjectKey } : {},
  );
  if (!attempted || result === previous) return result;
  return {
    ...result,
    turns: result.turns.map((t, i) =>
      i === result.turns.length - 1 && t.role === "assistant" ? { ...t, aiFallback: true } : t,
    ),
  };
}
