"use client";
import { QuoteDocumentEditor } from "@/components/quote-document/quote-document-editor";
import type { QuoteDraftView } from "@/modules/quote-draft/application/get-quote-draft";
import type { Locale } from "@/modules/localization/config";
import type { IssueView } from "./quote-issue-panel";
import type { PrepareDraftOutcome } from "@/modules/quote-draft/application/prepare-quote-draft";
export function QuoteWorkspace({
  view,
  issue,
  locale,
  preparation,
}: {
  view: Extract<QuoteDraftView, { kind: "AVAILABLE" }>;
  issue: IssueView | null;
  locale: Locale;
  preparation?: Extract<PrepareDraftOutcome, { kind: "PREPARED" }> | null;
}) {
  return (
    <QuoteDocumentEditor
      initial={view}
      issue={issue}
      locale={locale}
      preparation={preparation ?? null}
    />
  );
}
