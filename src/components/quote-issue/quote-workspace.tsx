"use client";
import { useState } from "react";
import { QuoteDraftWorkspace } from "@/components/quote-draft/quote-draft-workspace";
import type { QuoteDraftView } from "@/modules/quote-draft/application/get-quote-draft";
import type { Locale } from "@/modules/localization/config";
import { quoteDraftCopy } from "@/modules/localization/quote-draft";
import { QuoteIssuePanel, type IssueView } from "./quote-issue-panel";
export function QuoteWorkspace({
  view,
  issue,
  locale,
}: {
  view: Extract<QuoteDraftView, { kind: "AVAILABLE" }>;
  issue: IssueView | null;
  locale: Locale;
}) {
  const [saving, setSaving] = useState(false);
  const [expectedVersionId, setExpectedVersionId] = useState<string | null>(null);
  // Wait for the server read after Save before allowing preparation against that version.
  if (expectedVersionId && expectedVersionId === issue?.versionId) setExpectedVersionId(null);
  const waitingForSavedVersion =
    saving || (!!expectedVersionId && expectedVersionId !== issue?.versionId);
  return (
    <>
      <QuoteDraftWorkspace
        key={`${locale}:${view.job.businessKey}:${view.saved?.status ?? "DRAFT"}`}
        locale={locale}
        initial={view}
        canResolve={issue?.canResolve ?? false}
        onSaveStateChange={(saving, versionId) => {
          setSaving(saving);
          if (versionId) setExpectedVersionId(versionId);
        }}
      />
      {issue ? (
        <QuoteIssuePanel
          key={`${locale}:${issue.versionId}:${issue.status}:${issue.conflicts.map((c) => c.conflictKey).join(",")}`}
          view={issue}
          locale={locale}
          disabled={waitingForSavedVersion}
        />
      ) : view.canReadAmounts ? (
        <p role="status">{quoteDraftCopy(locale).UNAVAILABLE}</p>
      ) : null}
    </>
  );
}
