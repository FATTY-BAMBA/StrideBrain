vi.mock("@/app/[locale]/job-draft-actions", () => ({
  draftJobFromNewPage: vi.fn(),
  draftJobFromHome: vi.fn(),
}));
vi.mock("@/lib/server/job-draft-services", () => ({
  jobDraftAvailable: vi.fn().mockResolvedValue(false),
}));
import { describe, it, expect, vi } from "vitest";
import type * as ReactTypes from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeChat } from "@/components/assistant/home-chat";
import { assistantCopy } from "@/modules/localization/assistant";
import Knowledge from "@/app/[locale]/knowledge/page";
import CustomerCare from "@/app/[locale]/customer-care/page";
import AiData from "@/app/[locale]/ai-data/page";
vi.mock("@/app/[locale]/home-chat-actions", () => ({ askHomeAction: vi.fn() }));
const state = vi.hoisted(() => ({ sources: true }));
vi.mock("react", async (original) => ({
  ...(await original<typeof ReactTypes>()),
  useActionState: () => [
    {
      turns: [
        {
          id: "answer",
          role: "assistant",
          text: "<script>untrusted</script>",
          ai: true,
          aiSources: state.sources
            ? [{ sourceId: "s", label: "Source record", href: "/en/projects/J" }]
            : [],
          aiFollowUps: [],
        },
      ],
      context: {},
    },
    () => {},
    false,
  ],
}));
describe("bilingual assistant experience", () => {
  it.each(["en", "zh-TW"] as const)(
    "does not ask the reader to check absent sources in %s",
    (locale) => {
      state.sources = false;
      try {
        const html = renderToStaticMarkup(createElement(HomeChat, { locale }));
        expect(html).toContain(assistantCopy(locale).labelWithoutSources);
        expect(html).not.toContain(assistantCopy(locale).label);
      } finally {
        state.sources = true;
      }
    },
  );
  it.each(["en", "zh-TW"] as const)(
    "labels model answers, exposes server links and escapes text in %s",
    (locale) => {
      const html = renderToStaticMarkup(createElement(HomeChat, { locale }));
      expect(html).toContain(assistantCopy(locale).label);
      expect(html).toContain(`/${locale}/ai-data`);
      expect(html).toContain("/en/projects/J");
      expect(html).toContain("&lt;script&gt;");
      expect(html.match(/<article[\s\S]+?<\/article>/)?.[0]).not.toContain("<script>");
    },
  );
  it.each(["en", "zh-TW"] as const)(
    "shows the data policy and honest planned surfaces in %s",
    async (locale) => {
      for (const Page of [Knowledge, CustomerCare]) {
        const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale }) }));
        expect(html).toContain(assistantCopy(locale).planned);
        expect(html).not.toMatch(/<(form|input|button)\b/);
      }
      const data = renderToStaticMarkup(await AiData({ params: Promise.resolve({ locale }) }));
      expect(data).toContain("Google Gemini");
      expect(data).toContain("https://ai.google.dev/gemini-api/terms");
      expect(data).toContain(`/${locale}/settings`);
    },
  );
});
