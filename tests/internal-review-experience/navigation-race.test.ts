// @vitest-environment jsdom
import { act, createElement, useSyncExternalStore, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProposalDTO } from "@/modules/internal-review/domain/contracts";
import {
  internalReviewHref,
  parseInternalReviewRoute,
} from "@/modules/internal-review-experience/route-state";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => new URL(useBrowserHref()).pathname,
  useSearchParams: () => new URL(useBrowserHref()).searchParams,
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    onNavigate,
    children,
    ...props
  }: {
    href: string;
    onNavigate?: (event: { preventDefault: () => void }) => void;
    children: ReactNode;
  }) =>
    createElement(
      "a",
      {
        ...props,
        href,
        onClick: (event: { preventDefault: () => void }) => {
          event.preventDefault();
          onNavigate?.(event);
        },
      },
      children,
    ),
}));

import { InternalReviewController } from "@/components/internal-review/internal-review-controller";
import { LanguageSwitcher } from "@/components/shell/language-switcher";

// Next integrates native history writes and popstate with useSearchParams. Model that
// subscription while deliberately keeping router.push unresolved until server commit.
function useBrowserHref() {
  return useSyncExternalStore(
    (listener) => {
      window.addEventListener("popstate", listener);
      return () => window.removeEventListener("popstate", listener);
    },
    () => window.location.href,
  );
}

const proposal: ProposalDTO = {
  version: "internal-review-proposal.v1",
  businessKey: "proposal_qa05",
  project: { projectKey: "PRJ-XINYI-026", name: "Xinyi" },
  comparisonRunId: "cmprun_qa05",
  enrichmentRunId: "econrun_qa05",
  locale: "en",
  timezone: "Asia/Taipei",
  titleOptions: [
    { key: "REVIEW", text: "Review costs" },
    { key: "CHECK", text: "Check forecast costs" },
  ],
  rationaleOptions: [
    { key: "REVIEW", text: "Review the forecast evidence" },
    { key: "CHECK", text: "Check the historical context" },
  ],
  title: "Review costs",
  rationale: "Review the forecast evidence",
  titleKey: "REVIEW",
  rationaleKey: "REVIEW",
  mandatoryStatements: [],
  warnings: [],
  assignees: [{ key: "mei", displayName: "Mei" }],
  suggestedAssigneeKey: "mei",
  canAssign: true,
  suggestedDueDate: "2026-11-20",
  minDueDate: "2026-11-16",
  maxDueDate: "2027-11-16",
  expiresAt: "2026-11-16T12:00:00Z",
  idempotencyKey: "idempotency-qa05",
  evidenceLinks: [{ claimKey: "STONE_VARIANCE", label: "Imported stone forecast" }],
  returnContext: {
    selectedProjectKeys: ["PRJ-A", "PRJ-B", "PRJ-C"],
    evidenceReturnId: "evidence-synthesis-stone",
  },
};
const canonical = internalReviewHref("en", proposal.project.projectKey, proposal, {
  proposalKey: proposal.businessKey,
});
let root: Root;
let container: HTMLDivElement;
const evidence = vi.fn();

function renderController(prepared: boolean, evidenceActive = false, locale = proposal.locale) {
  const route = parseInternalReviewRoute(
    Object.fromEntries(new URL(window.location.href).searchParams),
  );
  root.render(
    createElement(
      "div",
      null,
      createElement(LanguageSwitcher, { locale, enLabel: "English", zhLabel: "繁體中文" }),
      createElement(InternalReviewController, {
        key: `${locale}:${route.proposalKey ?? "entry"}`,
        locale,
        projectKey: proposal.project.projectKey,
        comparisonRunId: proposal.comparisonRunId,
        enrichmentRunId: proposal.enrichmentRunId,
        returnContext: proposal.returnContext,
        canPrepare: true,
        route,
        ...(prepared
          ? { proposalOutcome: { kind: "PREPARED" as const, proposal: { ...proposal, locale } } }
          : {}),
        evidenceActive,
        onEvidence: evidence,
      }),
    ),
  );
}
function choose(id: string, value: string) {
  const input = container.querySelector<HTMLSelectElement | HTMLInputElement>(`#${id}`)!;
  // Bypass React's input value tracker, as an actual browser input event does.
  const prototype =
    input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
function draft() {
  return parseInternalReviewRoute(Object.fromEntries(new URL(window.location.href).searchParams));
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  vi.stubGlobal("fetch", vi.fn());
  navigation.push.mockReset();
  evidence.mockReset();
  const replaceState = window.history.replaceState.bind(window.history);
  vi.spyOn(window.history, "replaceState").mockImplementation((data, unused, url) => {
    replaceState(data, unused, url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  window.history.replaceState(null, "", canonical);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("QA-05 component navigation race regressions", () => {
  it("does not expose editing or issue a second proposal before canonical server navigation commits", async () => {
    window.history.replaceState(
      null,
      "",
      internalReviewHref("en", proposal.project.projectKey, proposal),
    );
    let resolve!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }) as Promise<Response>,
    );
    await act(async () => renderController(false));
    await act(async () => {
      const button = container.querySelector<HTMLButtonElement>("#internal-review-entry")!;
      button.click();
      button.click();
    });
    expect(fetch).toHaveBeenCalledOnce();
    await act(async () =>
      resolve({ json: async () => ({ kind: "PREPARED", proposal }) } as Response),
    );
    expect(navigation.push).toHaveBeenCalledWith(canonical, { scroll: false });
    expect(container.querySelector("#review-title")).toBeNull();
    expect(container.querySelector<HTMLButtonElement>("#internal-review-entry")!.disabled).toBe(
      true,
    );
    await act(async () =>
      container.querySelector<HTMLButtonElement>("#internal-review-entry")!.click(),
    );
    expect(fetch).toHaveBeenCalledOnce();
    await act(async () => {
      window.history.replaceState(null, "", canonical);
      renderController(true);
    });
    expect(container.querySelector<HTMLSelectElement>("#review-title")!.disabled).toBe(false);
    await act(async () => choose("review-title", "CHECK"));
    expect(draft()).toMatchObject({
      proposalKey: proposal.businessKey,
      draft: { titleKey: "CHECK" },
    });
  });

  it("releases the prepare guard when the server rejects preparation", async () => {
    window.history.replaceState(
      null,
      "",
      internalReviewHref("en", proposal.project.projectKey, proposal),
    );
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ kind: "PROPOSAL_FAILED", requestId: "qa05" }),
    } as Response);
    await act(async () => renderController(false));
    await act(async () =>
      container.querySelector<HTMLButtonElement>("#internal-review-entry")!.click(),
    );
    expect(container.querySelector<HTMLButtonElement>("#internal-review-entry")!.disabled).toBe(
      false,
    );
    expect(navigation.push).not.toHaveBeenCalled();
    await act(async () =>
      container.querySelector<HTMLButtonElement>("#internal-review-entry")!.click(),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("submits the latest canonical choices after immediate edits and guards duplicate confirmation", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        kind: "VALIDATION_FAILED",
        requestId: "qa05",
        fieldErrors: { dueDate: "INVALID_DUE_DATE" },
      }),
    } as Response);
    await act(async () => renderController(true));
    await act(async () => {
      choose("review-title", "CHECK");
      choose("review-rationale", "CHECK");
      choose("review-assignee", "none");
      choose("review-dueDate", "2026-12-20");
      container.querySelector<HTMLInputElement>("#review-confirmation")!.click();
      const form = container.querySelector<HTMLFormElement>("form")!;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(fetch).toHaveBeenCalledOnce();
    const command = JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);
    expect(command).toMatchObject({
      proposalKey: proposal.businessKey,
      title: "Check forecast costs",
      rationale: "Check the historical context",
      assigneeKey: null,
      dueDate: "2026-12-20",
      confirmation: true,
      idempotencyKey: proposal.idempotencyKey,
    });
    expect(container.querySelector<HTMLSelectElement>("#review-title")!.value).toBe("CHECK");
  });

  it("merges immediate consecutive field edits and switches locale using the current canonical draft", async () => {
    await act(async () => renderController(true));
    await act(async () => {
      choose("review-title", "CHECK");
      choose("review-rationale", "CHECK");
      choose("review-assignee", "none");
      choose("review-dueDate", "2026-12-20");
      container.querySelector<HTMLAnchorElement>('[role="dialog"] a[lang="zh-Hant"]')!.click();
    });
    const expected = {
      titleKey: "CHECK",
      rationaleKey: "CHECK",
      assigneeKey: "none",
      dueDate: "2026-12-20",
    };
    expect(draft()).toMatchObject({ proposalKey: proposal.businessKey, draft: expected });
    const href = navigation.push.mock.calls.at(-1)![0] as string;
    expect(href).toContain("/zh-TW/projects/");
    expect(
      parseInternalReviewRoute(Object.fromEntries(new URL(href, window.location.href).searchParams))
        .draft,
    ).toEqual(expected);
    await act(async () => {
      window.history.replaceState(null, "", href);
      renderController(true, false, "zh-TW");
    });
    expect(container.querySelector<HTMLSelectElement>("#review-title")!.value).toBe("CHECK");
    expect(container.querySelector<HTMLInputElement>("#review-dueDate")!.value).toBe("2026-12-20");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves an immediate edit through the shell language link before its href rerenders", async () => {
    await act(async () => renderController(true));
    await act(async () => {
      choose("review-rationale", "CHECK");
      container.querySelector<HTMLAnchorElement>('.language-switcher a[lang="zh-Hant"]')!.click();
    });
    expect(navigation.push.mock.calls.at(-1)![0]).toContain("reviewRationale=CHECK");
    expect(navigation.push.mock.calls.at(-1)![0]).toContain("proposal=proposal_qa05");
  });

  it("restores edited fields after evidence closes, refresh and back/forward without business writes", async () => {
    await act(async () => renderController(true));
    await act(async () => {
      choose("review-title", "CHECK");
      choose("review-assignee", "none");
      choose("review-dueDate", "");
    });
    const edited = window.location.href;
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('[data-evidence-trigger-id="review-evidence-0"]')!
        .click(),
    );
    expect(evidence).toHaveBeenCalledWith("STONE_VARIANCE", "review-evidence-0");
    await act(async () => {
      const url = new URL(edited);
      url.searchParams.set("reviewEvidence", "1");
      url.searchParams.set("evidenceReturn", "review-evidence-0");
      window.history.pushState(null, "", url);
      renderController(true, true);
    });
    expect(container.querySelector("#review-title")).toBeNull();
    await act(async () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("reviewEvidence");
      window.history.pushState(null, "", url);
      renderController(true);
    });
    expect(container.querySelector<HTMLSelectElement>("#review-title")!.value).toBe("CHECK");
    expect(container.querySelector<HTMLInputElement>("#review-dueDate")!.value).toBe("");
    expect(new URL(window.location.href).searchParams.get("evidenceReturn")).toBe(
      "review-evidence-0",
    );
    // A fresh mount is the client half of a refresh; the server reopens the same proposal.
    await act(async () => {
      root.unmount();
      root = createRoot(container);
      renderController(true);
    });
    expect(container.querySelector<HTMLSelectElement>("#review-assignee")!.value).toBe("none");
    await act(async () => {
      window.history.pushState(null, "", canonical);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(container.querySelector<HTMLSelectElement>("#review-title")!.value).toBe("REVIEW");
    await act(async () => {
      const popped = new Promise<void>((done) =>
        window.addEventListener("popstate", () => done(), { once: true }),
      );
      window.history.back();
      await popped;
    });
    expect(container.querySelector<HTMLSelectElement>("#review-title")!.value).toBe("CHECK");
    await act(async () => {
      const popped = new Promise<void>((done) =>
        window.addEventListener("popstate", () => done(), { once: true }),
      );
      window.history.forward();
      await popped;
    });
    expect(container.querySelector<HTMLSelectElement>("#review-title")!.value).toBe("REVIEW");
    expect(fetch).not.toHaveBeenCalled();
  });
});
