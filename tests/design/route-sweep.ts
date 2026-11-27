import { createRequire } from "node:module";
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (html: string) => { window: { document: Document; close(): void } };
};
/** An explicit page-file inventory: the HTTP suite proves this list stays exhaustive. */
export const pageRoutes: Readonly<Record<string, readonly string[]>> = {
  "(redirect)/page.tsx": ["/"],
  "[locale]/[...missing]/page.tsx": ["/{locale}/nothing-here"],
  "[locale]/page.tsx": ["/{locale}"],
  "[locale]/stridebrain/page.tsx": ["/{locale}/stridebrain"],
  "[locale]/preview/page.tsx": ["/{locale}/preview"],
  "[locale]/knowledge/page.tsx": ["/{locale}/knowledge"],
  "[locale]/decisions/page.tsx": ["/{locale}/decisions"],
  "[locale]/customer-care/page.tsx": ["/{locale}/customer-care"],
  "[locale]/ai-data/page.tsx": ["/{locale}/ai-data"],
  "[locale]/projects/page.tsx": ["/{locale}/projects"],
  "[locale]/projects/new/page.tsx": ["/{locale}/projects/new"],
  "[locale]/quotes/page.tsx": ["/{locale}/quotes"],
  "[locale]/clients/page.tsx": ["/{locale}/clients"],
  "[locale]/quotes/prices/page.tsx": ["/{locale}/quotes/prices"],
  "[locale]/projects/[projectKey]/compare/page.tsx": ["/{locale}/projects/PRJ-XINYI-026/compare"],
  "[locale]/clients/[clientKey]/page.tsx": ["/{locale}/clients/{client}"],
  "[locale]/settings/page.tsx": ["/{locale}/settings"],
  "[locale]/projects/[projectKey]/quote/page.tsx": ["/{locale}/projects/PRJ-XINYI-026/quote"],
  "[locale]/projects/[projectKey]/[[...surface]]/page.tsx": [
    "/{locale}/projects/PRJ-XINYI-026",
    "/{locale}/projects/PRJ-XINYI-026/actions",
  ],
};
export function pageDefects(html: string): string[] {
  const dom = new JSDOM(html),
    doc = dom.window.document,
    issues: string[] = [];
  // Materialize completed React streaming boundaries without evaluating scripts.
  // $RC relocates S:* into B:* before browser-visible content is inspected.
  for (const match of html.matchAll(/\$RC\("([^"]+)","([^"]+)"\)/g)) {
    const placeholder = doc.getElementById(match[1]!),
      segment = doc.getElementById(match[2]!);
    if (!placeholder || !segment) continue;
    let next = placeholder.nextSibling;
    while (next && !(next.nodeType === 8 && next.textContent === "/$")) {
      const following = next.nextSibling;
      next.parentNode?.removeChild(next);
      next = following;
    }
    placeholder.replaceWith(...segment.childNodes);
    segment.remove();
  }
  // React streaming fallbacks and scripts are not displayed page content.
  doc
    .querySelectorAll("script, style, template, [hidden], [aria-hidden=true]")
    .forEach((node) => node.remove());
  doc.querySelectorAll("details:not([open]) > :not(summary)").forEach((node) => node.remove());
  if (doc.querySelectorAll("h1").length !== 1) issues.push("H1");
  if (!doc.querySelector("main")) issues.push("MAIN");
  const regions = [
    ...doc.querySelectorAll('[role="region"], section[aria-label], section[aria-labelledby]'),
  ];
  const names = regions
    .map(
      (node) =>
        node.getAttribute("aria-label") ??
        (node.getAttribute("aria-labelledby") ?? "")
          .split(/\s+/)
          .map((id) => doc.getElementById(id)?.textContent ?? "")
          .join(" "),
    )
    .filter(Boolean);
  if (new Set(names).size !== names.length) issues.push("REGION_NAME");
  const visible = doc.body.textContent ?? "";
  if (/[A-Z]{3,}_[A-Z_]{2,}/.test(visible)) issues.push("RAW_CODE");
  if (visible.includes("NT$-0")) issues.push("NEGATIVE_ZERO");
  dom.window.close();
  return issues;
}
