import type { Locale } from "@/modules/localization/config";
import { identityMention, type AssistantProjectIdentity } from "./subjects";

export function projectName(job: AssistantProjectIdentity, locale: Locale): string {
  return (locale === "zh-TW" ? job.names.at(-1) : job.names[0]) ?? job.projectKey;
}
const normalize = (text: string) =>
  text
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const pieces = (text: string) =>
  new Set(
    [...text.matchAll(/[a-z0-9]{3,}/g), ...text.matchAll(/(?=([\p{Script=Han}]{2}))/gu)].map(
      (m) => m[1] ?? m[0],
    ),
  );
// Han-adjacent digits are separate runs (專案05); Latin alphanumerics such as
// R7K3 are words, not standalone numbers. Compare strings to avoid numeric overflow.
const standaloneNumbers = (text: string) =>
  new Set(
    [
      ...normalize(text).matchAll(
        /(?<![\p{Script=Latin}\p{N}])[0-9]+(?![\p{Script=Latin}\p{N}])/gu,
      ),
    ].map(([digits]) => digits.replace(/^0+(?=\d)/, "")),
  );
/** Shared literal text only: no semantics, private records or automatic selection.
 * At least one Latin word (3+ letters) or two adjacent Han characters must overlap;
 * half the shorter identity's pieces must match. Rare shared pieces carry more
 * weight (frequency among readable jobs only). Stable reference breaks ties. */
export function nearestJobs(
  query: string,
  jobs: readonly AssistantProjectIdentity[],
  locale: Locale,
  limit = 3,
) {
  const q = normalize(query.slice(0, 280)),
    qp = pieces(q);
  if (!qp.size) return [];
  const frequencies = new Map<string, number>();
  for (const job of jobs)
    for (const piece of new Set(
      [job.projectKey, ...job.names].flatMap((n) => [...pieces(normalize(n))]),
    ))
      frequencies.set(piece, (frequencies.get(piece) ?? 0) + 1);
  const ranked = jobs
    .map((job) => {
      const score = Math.max(
        0,
        ...[job.projectKey, ...job.names].map((name) => {
          const np = pieces(normalize(name));
          const shared = [...np].filter((p) => qp.has(p)).length;
          const coverage = shared / Math.max(1, Math.min(qp.size, np.size));
          return coverage >= 0.5
            ? [...np]
                .filter((p) => qp.has(p))
                .reduce((score, p) => score + 1 / (frequencies.get(p) ?? 1), 0) + coverage
            : 0;
        }),
      );
      return { projectKey: job.projectKey, name: projectName(job, locale), score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.projectKey.localeCompare(b.projectKey, "en"));
  const numbers = standaloneNumbers(q);
  const matchingKeys = new Set(
    jobs
      .filter((job) =>
        [job.projectKey, ...job.names].some((identity) =>
          [...standaloneNumbers(identity)].some((number) => numbers.has(number)),
        ),
      )
      .map((job) => job.projectKey),
  );
  const numbered = ranked.filter((job) => matchingKeys.has(job.projectKey));
  // Numbers only narrow already-ranked candidates, and only when one matches.
  const candidates = numbered.length ? numbered : ranked;
  const floor = (candidates[0]?.score ?? 0) * 0.75;
  return candidates.filter((job) => job.score >= floor).slice(0, limit);
}
/** Replace only complete authorized references; an existing name is already readable. */
export function nameFollowUp(
  text: string,
  jobs: readonly AssistantProjectIdentity[],
  locale: Locale,
) {
  for (const job of jobs) {
    const mention = identityMention(text, job.projectKey);
    if (!mention || job.names.some((name) => identityMention(text, name))) continue;
    const escaped = job.projectKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`(?<![A-Za-z0-9_/-])${escaped}(?![A-Za-z0-9_/-])`, "gi"), () =>
      projectName(job, locale),
    );
  }
  return text;
}
