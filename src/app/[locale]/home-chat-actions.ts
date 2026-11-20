"use server";

import type { Route } from "next";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { loadDemoValueContext } from "@/lib/server/demo-value-context";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import { isSupportedLocale, type Locale } from "@/modules/localization/config";

export type HomeChatTurn = Readonly<{
  id: string;
  role: "user" | "assistant";
  text: string;
  bullets?: readonly string[];
  action?: Readonly<{ label: string; href: Route }>;
}>;

export type HomeChatState = Readonly<{
  turns: readonly HomeChatTurn[];
}>;

export const initialHomeChatState: HomeChatState = Object.freeze({ turns: Object.freeze([]) });

function append(state: HomeChatState, turns: readonly HomeChatTurn[]): HomeChatState {
  return Object.freeze({ turns: Object.freeze([...state.turns, ...turns].slice(-10)) });
}

function localizedName(locale: Locale, value: { nameEn: string; nameZhTw: string }): string {
  return locale === "zh-TW" ? value.nameZhTw : value.nameEn;
}

function percent(value?: string): string | null {
  if (!value || !Number.isFinite(Number(value))) return null;
  return Math.abs(Number(value)).toFixed(0);
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

  const userTurn: HomeChatTurn = {
    id: `user-${Date.now()}`,
    role: "user",
    text: query,
  };

  const context = await loadDemoValueContext(locale);
  const workspace = context.workspace;
  if (!workspace) {
    return append(previous, [
      userTurn,
      {
        id: `assistant-${Date.now()}`,
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

  const namedProject = context.projects.find((project) =>
    normalized.includes(project.name.toLocaleLowerCase(locale)),
  );
  if (namedProject) {
    return append(previous, [
      userTurn,
      {
        id: `assistant-${Date.now()}`,
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
    ]);
  }

  if (/(action|follow.?up|未完成|行動|追蹤)/i.test(normalized)) {
    const count = workspace.openActions.length;
    return append(previous, [
      userTurn,
      {
        id: `assistant-${Date.now()}`,
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
    ]);
  }

  const needsComparison =
    /(similar|past project|done before|類似|以前做過|過往專案|stone|material|石材|材料|quote|quotation|報價|evidence|source|support|佐證|來源|review next|attention|unusual|留意|下一步|異常)/i.test(
      normalized,
    );

  if (!needsComparison) {
    return append(previous, [
      userTurn,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          locale === "zh-TW"
            ? "這個版本目前還不能可靠回答這個問題。你可以問：做過哪些類似專案、報價哪裡值得留意、進口石材差異、佐證來源，或未完成事項。"
            : "I can’t answer that reliably yet. Try asking about similar past projects, what looks unusual in the quote, the imported-stone difference, supporting evidence, or open actions.",
      },
    ]);
  }

  const runtime = await resolveServerRuntimeContext();
  if (!runtime) return previous;
  const services = createComparisonServices();
  const structural = await services.runComparison.execute(runtime, workspace.project.businessKey);
  if (structural.kind !== "COMPLETE") {
    return append(previous, [
      userTurn,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          locale === "zh-TW"
            ? "目前無法完成歷史比較。我不會在沒有足夠資料時猜測。"
            : "I can’t complete the historical comparison right now, so I won’t guess.",
      },
    ]);
  }

  const comparison = structural.result;
  const economicsOutcome = await services.runEconomics.execute(
    runtime,
    comparison.run.id,
    comparison.defaultSelectedProjectKeys,
  );
  const economics = "result" in economicsOutcome ? economicsOutcome.result : undefined;

  const compareHref = comparisonHref(locale, workspace.project.businessKey, {
    comparisonRunId: comparison.run.id,
    ...(economics
      ? {
          economicsRunId: economics.run.id,
          selectedProjectKeys: economics.selectedProjectKeys,
        }
      : { selectedProjectKeys: comparison.defaultSelectedProjectKeys }),
  });

  if (/(similar|past project|done before|類似|以前做過|過往專案)/i.test(normalized)) {
    const top = comparison.matches.slice(0, 3);
    return append(previous, [
      userTurn,
      {
        id: `assistant-${Date.now()}`,
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
    ]);
  }

  const stone = economics?.categories.find((item) => item.categoryId === "IMPORTED_STONE");
  const quoteVariance = economics?.overall.quoteVariance;
  const stonePct =
    stone?.forecastVariance.state === "VALUE"
      ? percent(stone.forecastVariance.variancePercent)
      : null;
  const quotePct =
    quoteVariance?.state === "VALUE" ? percent(quoteVariance.variancePercent) : null;

  if (/(stone|石材|material|材料)/i.test(normalized)) {
    const claimKey = "XINYI_IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE";
    const href = economics
      ? comparisonHref(locale, workspace.project.businessKey, {
          comparisonRunId: comparison.run.id,
          economicsRunId: economics.run.id,
          selectedProjectKeys: economics.selectedProjectKeys,
          evidenceClaimKey: claimKey,
        })
      : compareHref;
    return append(previous, [
      userTurn,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          locale === "zh-TW"
            ? stonePct
              ? `目前進口石材的預估成本比可用的歷史實際成本基準高約 ${stonePct}%。這值得檢視，但不代表報價或供應商一定有問題。`
              : "目前進口石材的實際成本佐證不足，我不會補出不存在的百分比。"
            : stonePct
              ? `Imported stone is currently about ${stonePct}% above the eligible historical actual-cost baseline. That deserves review, but it does not mean the quote or supplier is wrong.`
              : "There isn’t enough actual-cost evidence for imported stone to state a reliable percentage, so I won’t invent one.",
        bullets:
          locale === "zh-TW"
            ? ["先確認規格是否不同", "再確認數量與供應商條件", "最後查看歷史來源"]
            : ["Check specification differences", "Check quantity and supplier terms", "Then inspect the historical sources"],
        action: {
          label: locale === "zh-TW" ? "開啟確切佐證" : "Open exact evidence",
          href: href as Route,
        },
      },
    ]);
  }

  if (/(quote|quotation|報價|unusual|attention|review next|留意|下一步|異常)/i.test(normalized)) {
    const claimKey = "XINYI_OVERALL_QUOTED_VARIANCE";
    const href = economics
      ? comparisonHref(locale, workspace.project.businessKey, {
          comparisonRunId: comparison.run.id,
          economicsRunId: economics.run.id,
          selectedProjectKeys: economics.selectedProjectKeys,
          evidenceClaimKey: claimKey,
        })
      : compareHref;
    const lighting = economics?.categories.find((item) => item.categoryId === "LIGHTING_ELECTRICAL");
    const lightingPct =
      lighting?.quoteVariance.state === "VALUE"
        ? percent(lighting.quoteVariance.variancePercent)
        : null;
    return append(previous, [
      userTurn,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          locale === "zh-TW"
            ? quotePct
              ? `目前報價比選取的歷史報價基準高約 ${quotePct}%。先把它當成需要檢視的訊號，而不是錯誤結論。`
              : "目前沒有足夠資料可以可靠計算整體報價差異。"
            : quotePct
              ? `The current quote is about ${quotePct}% above the selected historical quoted-price baseline. Treat that as a review signal, not a conclusion that the quote is wrong.`
              : "There isn’t enough evidence to state a reliable overall quote variance.",
        bullets:
          lightingPct
            ? [
                locale === "zh-TW"
                  ? `燈具報價約高 ${lightingPct}%`
                  : `Lighting quoted prices are about ${lightingPct}% higher`,
                locale === "zh-TW"
                  ? "進口石材是目前最明顯的成本差異"
                  : "Imported stone is the clearest current cost difference",
                locale === "zh-TW"
                  ? "先確認範圍、材料與工期差異"
                  : "Check scope, materials and programme differences first",
              ]
            : undefined,
        action: {
          label: locale === "zh-TW" ? "查看報價佐證" : "Open quote evidence",
          href: href as Route,
        },
      },
    ]);
  }

  return append(previous, [
    userTurn,
    {
      id: `assistant-${Date.now()}`,
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
  ]);
}
