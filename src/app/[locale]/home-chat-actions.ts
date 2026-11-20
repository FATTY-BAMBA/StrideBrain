"use server";

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

function percent(value?: string): string | null {
  if (!value || !Number.isFinite(Number(value))) return null;
  return Math.abs(Number(value)).toFixed(0);
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
  remembered: HomeChatContext,
): Promise<ComparisonBundle | null> {
  if (remembered.comparisonRunId) {
    const existing = await services.getComparison.execute(runtime, remembered.comparisonRunId);
    if (existing.kind === "COMPLETE" && existing.result.activeContext.projectKey === projectKey) {
      const economics = remembered.economicsRunId
        ? await services.getEconomics.execute(runtime, remembered.economicsRunId)
        : null;
      if (!economics || economics.run.comparisonRunId === existing.result.run.id) {
        return Object.freeze({ comparison: existing.result, economics });
      }
    }
  }

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

export async function askHomeAction(
  previous: HomeChatState,
  formData: FormData,
): Promise<HomeChatState> {
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

  const context = await loadDemoValueContext(locale);
  const workspace = context.workspace;
  if (!workspace) {
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
  if (!runtime) return previous;
  const services = createComparisonServices();

  const evidenceFollowup =
    /(that|those|the).*(source|evidence)|show.*(source|evidence)|open.*(source|evidence)|剛才.*(佐證|來源)|顯示.*(佐證|來源)|查看.*(佐證|來源)/i.test(
      normalized,
    );
  if (
    evidenceFollowup &&
    !/(stone|石材|lighting|燈具|quote|quotation|報價)/i.test(normalized) &&
    previous.context.activeClaimKey &&
    previous.context.comparisonRunId &&
    previous.context.economicsRunId &&
    previous.context.selectedProjectKeys
  ) {
    const citations = await claimCitations(
      services,
      runtime,
      locale,
      workspace.project.businessKey,
      previous.context.comparisonRunId,
      previous.context.economicsRunId,
      previous.context.selectedProjectKeys,
      previous.context.activeClaimKey,
    );
    return append(previous, [
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
    ]);
  }

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
  const stoneIntent = /(stone|石材|material|材料)/i.test(normalized);
  const lightingIntent = /(lighting|light fixture|燈具|照明)/i.test(normalized);
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

  const followupStone = whyFollowup && previous.context.lastIntent === "STONE";
  const followupQuote = whyFollowup && previous.context.lastIntent === "QUOTE";

  const needsComparison =
    explicitSimilar ||
    stoneIntent ||
    quoteIntent ||
    !!followupComparable ||
    followupStone ||
    followupQuote ||
    /(evidence|source|support|佐證|來源)/i.test(normalized);

  if (!needsComparison) {
    return append(previous, [
      userTurn,
      {
        id: `assistant-${now}`,
        role: "assistant",
        text:
          locale === "zh-TW"
            ? "這個版本目前還不能可靠回答這個問題。你可以問：做過哪些類似專案、報價哪裡值得留意、進口石材差異、佐證來源，或未完成事項。"
            : "I can’t answer that reliably yet. Try asking about similar past projects, what looks unusual in the quote, the imported-stone difference, supporting evidence, or open actions.",
      },
    ]);
  }

  const bundle = await comparisonBundle(
    services,
    runtime,
    workspace.project.businessKey,
    previous.context,
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
            (match) => `${localizedName(locale, match.project)} · ${match.displayScore}%`,
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

  const stone = economics?.categories.find((item) => item.categoryId === "IMPORTED_STONE");
  const quoteVariance = economics?.overall.quoteVariance;
  const stonePct =
    stone?.forecastVariance.state === "VALUE"
      ? percent(stone.forecastVariance.variancePercent)
      : null;
  const quotePct = quoteVariance?.state === "VALUE" ? percent(quoteVariance.variancePercent) : null;

  if (stoneIntent || followupStone) {
    const claimKey = "XINYI_IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE";
    const citations = economics
      ? await claimCitations(
          services,
          runtime,
          locale,
          workspace.project.businessKey,
          comparison.run.id,
          economics.run.id,
          economics.selectedProjectKeys,
          claimKey,
        )
      : [];
    const href = economics
      ? evidenceHref(
          locale,
          workspace.project.businessKey,
          comparison.run.id,
          economics.run.id,
          economics.selectedProjectKeys,
          claimKey,
        )
      : (compareHref as Route);

    const text = followupStone
      ? locale === "zh-TW"
        ? stonePct
          ? `因為目前進口石材的預估成本，是拿來和已選相似專案中符合資格、已核對的實際成本基準比較；換算後目前約高 ${stonePct}%。${citationMarkers(citations)}`
          : "因為目前沒有足夠的已核對實際成本，所以不能可靠說明百分比差異。"
        : stonePct
          ? `Because the current imported-stone forecast is being compared with eligible reconciled actual-cost history from the selected comparable projects; after normalization it is about ${stonePct}% higher. ${citationMarkers(citations)}`
          : "Because there is not enough reconciled actual-cost history to support a reliable percentage."
      : locale === "zh-TW"
        ? stonePct
          ? `目前進口石材的預估成本比可用的歷史實際成本基準高約 ${stonePct}%。這值得檢視，但不代表報價或供應商一定有問題。${citationMarkers(citations)}`
          : "目前進口石材的實際成本佐證不足，我不會補出不存在的百分比。"
        : stonePct
          ? `Imported stone is currently about ${stonePct}% above the eligible historical actual-cost baseline. That deserves review, but it does not mean the quote or supplier is wrong. ${citationMarkers(citations)}`
          : "There isn’t enough actual-cost evidence for imported stone to state a reliable percentage, so I won’t invent one.";

    return append(
      previous,
      [
        userTurn,
        {
          id: `assistant-${now}`,
          role: "assistant",
          text,
          bullets:
            locale === "zh-TW"
              ? ["先確認規格是否不同", "再確認數量與供應商條件", "最後查看歷史來源"]
              : [
                  "Check specification differences",
                  "Check quantity and supplier terms",
                  "Then inspect the historical sources",
                ],
          ...(citations.length ? { citations } : {}),
          action: {
            label: locale === "zh-TW" ? "開啟完整佐證" : "Open full evidence",
            href,
          },
        },
      ],
      nextContext(previous.context, bundle, {
        lastIntent: "STONE",
        activeClaimKey: claimKey,
      }),
    );
  }

  if (quoteIntent || followupQuote) {
    const overallClaim = "XINYI_OVERALL_QUOTED_VARIANCE";
    const lightingClaim = "XINYI_LIGHTING_ELECTRICAL_QUOTED_VARIANCE";
    const stoneClaim = "XINYI_IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE";

    const overallSources = economics
      ? await claimCitations(
          services,
          runtime,
          locale,
          workspace.project.businessKey,
          comparison.run.id,
          economics.run.id,
          economics.selectedProjectKeys,
          overallClaim,
        )
      : [];
    const lightingSources = economics
      ? await claimCitations(
          services,
          runtime,
          locale,
          workspace.project.businessKey,
          comparison.run.id,
          economics.run.id,
          economics.selectedProjectKeys,
          lightingClaim,
        )
      : [];
    const stoneSources = economics
      ? await claimCitations(
          services,
          runtime,
          locale,
          workspace.project.businessKey,
          comparison.run.id,
          economics.run.id,
          economics.selectedProjectKeys,
          stoneClaim,
        )
      : [];

    const citations = uniqueCitations([overallSources, lightingSources, stoneSources]);
    const overallIndexed = citations.filter((citation) =>
      overallSources.some((source) => source.sourceKey === citation.sourceKey),
    );
    const lightingIndexed = citations.filter((citation) =>
      lightingSources.some((source) => source.sourceKey === citation.sourceKey),
    );
    const stoneIndexed = citations.filter((citation) =>
      stoneSources.some((source) => source.sourceKey === citation.sourceKey),
    );

    const primaryClaim = lightingIntent ? lightingClaim : overallClaim;
    const href = economics
      ? evidenceHref(
          locale,
          workspace.project.businessKey,
          comparison.run.id,
          economics.run.id,
          economics.selectedProjectKeys,
          primaryClaim,
        )
      : (compareHref as Route);

    const lighting = economics?.categories.find(
      (item) => item.categoryId === "LIGHTING_ELECTRICAL",
    );
    const lightingPct =
      lighting?.quoteVariance.state === "VALUE"
        ? percent(lighting.quoteVariance.variancePercent)
        : null;

    const text = lightingIntent
      ? locale === "zh-TW"
        ? lightingPct
          ? `燈具目前報價比可用的歷史報價基準高約 ${lightingPct}%。但歷史實際成本只有不足的可用樣本，所以不能把它說成實際超支。${citationMarkers(lightingIndexed)}`
          : "目前沒有足夠資料可以可靠計算燈具報價差異。"
        : lightingPct
          ? `Lighting is about ${lightingPct}% above the eligible historical quoted-price baseline. But the historical actual-cost sample is insufficient, so I can’t call it an actual overrun. ${citationMarkers(lightingIndexed)}`
          : "There isn’t enough evidence to state a reliable lighting quote variance."
      : followupQuote
        ? locale === "zh-TW"
          ? quotePct
            ? `因為目前報價是和選取相似專案的歷史報價基準比較；換算後約高 ${quotePct}%。這是檢視訊號，不是報價錯誤的結論。${citationMarkers(overallIndexed)}`
            : "目前沒有足夠資料可以可靠說明整體報價差異。"
          : quotePct
            ? `Because the current quote is being compared with the selected comparable projects’ historical quoted-price baseline; after normalization it is about ${quotePct}% higher. That is a review signal, not proof the quote is wrong. ${citationMarkers(overallIndexed)}`
            : "There isn’t enough evidence to explain a reliable overall quote variance."
        : locale === "zh-TW"
          ? quotePct
            ? `目前報價比選取的歷史報價基準高約 ${quotePct}%。先把它當成需要檢視的訊號，而不是錯誤結論。${citationMarkers(overallIndexed)}`
            : "目前沒有足夠資料可以可靠計算整體報價差異。"
          : quotePct
            ? `The current quote is about ${quotePct}% above the selected historical quoted-price baseline. Treat that as a review signal, not a conclusion that the quote is wrong. ${citationMarkers(overallIndexed)}`
            : "There isn’t enough evidence to state a reliable overall quote variance.";

    const bullets: string[] = [];
    if (lightingPct) {
      bullets.push(
        locale === "zh-TW"
          ? `燈具報價約高 ${lightingPct}% ${citationMarkers(lightingIndexed)}`
          : `Lighting quoted prices are about ${lightingPct}% higher ${citationMarkers(lightingIndexed)}`,
      );
    }
    if (stonePct) {
      bullets.push(
        locale === "zh-TW"
          ? `進口石材是目前最明顯的成本差異 ${citationMarkers(stoneIndexed)}`
          : `Imported stone is the clearest current cost difference ${citationMarkers(stoneIndexed)}`,
      );
    }
    bullets.push(
      locale === "zh-TW"
        ? "先確認範圍、材料與工期差異"
        : "Check scope, materials and programme differences first",
    );

    return append(
      previous,
      [
        userTurn,
        {
          id: `assistant-${now}`,
          role: "assistant",
          text,
          bullets: Object.freeze(bullets),
          ...(citations.length ? { citations } : {}),
          action: {
            label: locale === "zh-TW" ? "開啟完整佐證" : "Open full evidence",
            href,
          },
        },
      ],
      nextContext(previous.context, bundle, {
        lastIntent: "QUOTE",
        activeClaimKey: primaryClaim,
      }),
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
