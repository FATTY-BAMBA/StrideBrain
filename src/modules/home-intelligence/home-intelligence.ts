import type { Locale } from "@/modules/localization/config";
import type { DemoValueContext } from "@/lib/server/demo-value-context";
import { comparisonHref } from "@/modules/comparison-experience/route-state";

export type HomeFinding = Readonly<{
  id: string;
  title: string;
  detail: string;
  check: string;
  href: string;
}>;

export type HomeMemoryProject = Readonly<{
  name: string;
  score?: number;
}>;

export type HomeIntelligence = Readonly<{
  findings: readonly HomeFinding[];
  memory: readonly HomeMemoryProject[];
  openActionCount: number;
}>;

const demoMemory: readonly HomeMemoryProject[] = [
  { name: "Neihu Tech Flagship", score: 88 },
  { name: "Zhongshan Lifestyle Store", score: 81 },
  { name: "Nanjing Brand Experience Center", score: 79 },
  { name: "Daan Premium Showroom", score: 71 },
  { name: "Songshan Retail Renewal", score: 69 },
  { name: "Banqiao Concept Store", score: 63 },
];

export function buildHomeIntelligence(
  locale: Locale,
  context: DemoValueContext,
): HomeIntelligence {
  const workspace = context.workspace;
  if (!workspace) return { findings: [], memory: [], openActionCount: 0 };

  const compare = comparisonHref(locale, workspace.project.businessKey);
  const findings: readonly HomeFinding[] = workspace.project.demoData
    ? locale === "zh-TW"
      ? [
          {
            id: "imported-stone",
            title: "進口石材比過往實際花費高 18%",
            detail: "這是目前最明顯的成本差異。",
            check: "先確認規格、數量與供應商條件是否真的不同。",
            href: compare,
          },
          {
            id: "lighting",
            title: "燈具報價比過往報價高 9%",
            detail: "目前缺少足夠的歷史實際成本，不能把它當成超支結論。",
            check: "先比較規格與報價範圍，再決定是否需要追問。",
            href: compare,
          },
          {
            id: "quotation",
            title: "目前報價比選取的過往報價高 7%",
            detail: "差異值得檢視，但不代表報價錯誤。",
            check: "確認範圍、材料與工期差異後再判斷。",
            href: compare,
          },
        ]
      : [
          {
            id: "imported-stone",
            title: "Imported stone is 18% higher than past actual spend",
            detail: "This is the clearest current cost difference.",
            check: "Check whether specification, quantity or supplier terms explain it.",
            href: compare,
          },
          {
            id: "lighting",
            title: "Lighting is 9% above past quoted prices",
            detail: "There is not enough historical actual-cost evidence to call this an overrun.",
            check: "Compare specification and quote scope before escalating.",
            href: compare,
          },
          {
            id: "quotation",
            title: "The current quote is 7% above selected past quoted prices",
            detail: "It is worth reviewing, but it does not mean the quote is wrong.",
            check: "Check scope, materials and programme differences first.",
            href: compare,
          },
        ]
    : [];

  return {
    findings,
    memory: workspace.project.demoData ? demoMemory : [],
    openActionCount: workspace.openActions.length,
  };
}

export type HomeIntentResult =
  | Readonly<{ kind: "MATCH"; href: string }>
  | Readonly<{ kind: "NO_MATCH" }>;

export function resolveHomeIntent(
  locale: Locale,
  query: string,
  context: DemoValueContext,
): HomeIntentResult {
  const workspace = context.workspace;
  if (!workspace) return { kind: "NO_MATCH" };
  const normalized = query.trim().toLocaleLowerCase(locale);
  if (!normalized) return { kind: "NO_MATCH" };

  const base = `/${locale}/projects/${encodeURIComponent(workspace.project.businessKey)}`;
  const compare = comparisonHref(locale, workspace.project.businessKey);

  const project = context.projects.find((item) =>
    normalized.includes(item.name.toLocaleLowerCase(locale)),
  );
  if (project) {
    return {
      kind: "MATCH",
      href: `/${locale}/projects/${encodeURIComponent(project.businessKey)}`,
    };
  }

  const searchableNames = [
    ...workspace.materials.map((item) => item.name.display),
    ...workspace.suppliers.map((item) => item.name.display),
    ...workspace.evidence.flatMap((item) => (item.sourceName ? [item.sourceName.display] : [])),
  ];
  if (
    searchableNames.some((name) => normalized.includes(name.toLocaleLowerCase(locale))) ||
    /(stone|material|石材|材料|supplier|供應商|document|文件|紀錄)/i.test(normalized)
  ) {
    return { kind: "MATCH", href: compare };
  }

  if (/(similar|past project|done before|類似|以前做過|過往專案)/i.test(normalized))
    return { kind: "MATCH", href: compare };
  if (/(quote|quotation|報價)/i.test(normalized))
    return { kind: "MATCH", href: `${base}#commercial-position` };
  if (/(evidence|source|support|佐證|來源)/i.test(normalized))
    return { kind: "MATCH", href: compare };
  if (/(action|follow.?up|未完成|行動|追蹤)/i.test(normalized))
    return { kind: "MATCH", href: `${base}/actions` };
  if (/(review next|attention|unusual|留意|下一步|異常)/i.test(normalized))
    return { kind: "MATCH", href: compare };

  return { kind: "NO_MATCH" };
}
