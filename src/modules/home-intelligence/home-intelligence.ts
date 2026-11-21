import type { Locale } from "@/modules/localization/config";
import type { DemoValueContext } from "@/lib/server/demo-value-context";
import { comparisonHref } from "@/modules/comparison-experience/route-state";

export type HomeIntentResult =
  Readonly<{ kind: "MATCH"; href: string }> | Readonly<{ kind: "NO_MATCH" }>;

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
