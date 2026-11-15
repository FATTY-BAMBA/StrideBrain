import { describe, expect, it } from "vitest";

import {
  internalReviewHref,
  parseInternalReviewRoute,
  projectActionsHref,
  reviewReturnContext,
  setReviewDraft,
} from "@/modules/internal-review-experience/route-state";

const source = {
  comparisonRunId: "cmprun_1",
  enrichmentRunId: "econrun_1",
  returnContext: {
    selectedProjectKeys: ["PRJ-A", "PRJ-B"],
    evidenceSelection: {
      mode: "CLAIM" as const,
      comparisonRunId: "cmprun_1",
      enrichmentRunId: "econrun_1",
      claimKey: "STONE_VARIANCE",
    },
    evidenceReturnId: "evidence-synthesis-stone",
  },
};

describe("Stage 8 review and receipt route restoration", () => {
  it("preserves immutable runs, selection and exact evidence context in both locales", () => {
    for (const locale of ["en", "zh-TW"] as const) {
      const href = internalReviewHref(locale, "PRJ-ACTIVE", source, {
        proposalKey: "proposal_1",
        draft: {
          titleKey: "REVIEW",
          rationaleKey: "CHECK",
          assigneeKey: "assignee_1",
          dueDate: "2026-12-20",
        },
      });
      const url = new URL(href, "http://localhost");
      const search = Object.fromEntries(url.searchParams);
      expect(url.pathname).toBe(`/${locale}/projects/PRJ-ACTIVE/compare`);
      expect(parseInternalReviewRoute(search)).toMatchObject({
        proposalKey: "proposal_1",
        draft: {
          titleKey: "REVIEW",
          rationaleKey: "CHECK",
          assigneeKey: "assignee_1",
          dueDate: "2026-12-20",
        },
      });
      expect(reviewReturnContext(search)).toEqual(source.returnContext);
    }
  });

  it("uses a durable action selector and removes draft selectors on receipt navigation", () => {
    const href = internalReviewHref(
      "zh-TW",
      "PRJ-ACTIVE",
      source,
      {
        actionKey: "action_1",
        proposalKey: "proposal_1",
        draft: { titleKey: "REVIEW" },
        replay: true,
      },
      "actions",
    );
    const url = new URL(href, "http://localhost");
    expect(url.searchParams.get("action")).toBe("action_1");
    expect(url.searchParams.has("proposal")).toBe(false);
    expect(url.searchParams.has("reviewTitle")).toBe(false);
    expect(url.searchParams.get("reviewReplay")).toBe("1");
    expect(url.pathname).toBe("/zh-TW/projects/PRJ-ACTIVE/actions");
  });

  it("rejects malformed selectors and never accepts arbitrary return URLs or draft prose", () => {
    const parsed = parseInternalReviewRoute({
      proposal: "../foreign",
      action: "https://example.com",
      reviewTitle: "The quotation is wrong",
      reviewRationale: "<script>",
      reviewAssignee: "x".repeat(129),
      reviewDue: "2026-12-20<script>",
      reviewError: "SECRET_SOURCE_REASON",
      returnTo: "https://evil.invalid",
    });
    expect(parsed.proposalKey).toBeUndefined();
    expect(parsed.actionKey).toBeUndefined();
    expect(parsed.errorKind).toBeUndefined();
    expect(Object.values(parsed.draft).filter(Boolean)).toEqual([]);
    expect(projectActionsHref("en", "PRJ-A", "../secret")).toBe("/en/projects/PRJ-A/actions");
  });

  it("retains a deliberately cleared date and unassigned choice across language navigation", () => {
    const params = new URLSearchParams("run=cmprun_1&economics=econrun_1&proposal=proposal_1");
    setReviewDraft(params, {
      titleKey: "REVIEW",
      rationaleKey: "CHECK",
      assigneeKey: "none",
      dueDate: "",
    });
    const parsed = parseInternalReviewRoute(Object.fromEntries(params));
    expect(parsed.draft).toEqual({
      titleKey: "REVIEW",
      rationaleKey: "CHECK",
      assigneeKey: "none",
      dueDate: "",
    });
    expect(params.get("run")).toBe("cmprun_1");
  });

  it("bounds selected projects and retains only parsed evidence selectors", () => {
    const href = internalReviewHref("en", "PRJ-ACTIVE", {
      ...source,
      returnContext: { selectedProjectKeys: ["A", "A", "B", "C", "D", "../E"] },
    });
    expect(new URL(href, "http://localhost").searchParams.get("selected")).toBe("A,B,C");
    expect(
      reviewReturnContext({
        run: "cmprun_1",
        economics: "econrun_1",
        evidenceMode: "source",
        evidenceSource: "internal-db-id",
      }).evidenceSelection,
    ).toBeUndefined();
  });
});
