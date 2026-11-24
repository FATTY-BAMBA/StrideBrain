"use client";
import { QuoteDocumentEditor } from "@/components/quote-document/quote-document-editor";
import type { QuoteDraftView } from "@/modules/quote-draft/application/get-quote-draft";
import type { Locale } from "@/modules/localization/config";
import type { IssueView } from "./quote-issue-panel";
export function QuoteWorkspace({
  view,
  issue,
  locale,
}: {
  view: Extract<QuoteDraftView, { kind: "AVAILABLE" }>;
  issue: IssueView | null;
  locale: Locale;
}) {
  return <QuoteDocumentEditor initial={view} issue={issue} locale={locale} />;
}
