// @vitest-environment jsdom
import { act, createElement, useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DueDatePolicyDTO, ProposalDTO } from "@/modules/internal-review/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { internalReviewHref } from "@/modules/internal-review-experience/route-state";
import { getInternalReviewCopy } from "@/modules/internal-review-experience/copy";

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URL(
      useSyncExternalStore(
        (listener) => {
          window.addEventListener("popstate", listener);
          return () => window.removeEventListener("popstate", listener);
        },
        () => window.location.href,
      ),
    ).searchParams,
}));
vi.mock("next/link", () => ({ default: "a" }));
import { InternalReviewSheet } from "@/components/internal-review/internal-review-sheet";

const before: DueDatePolicyDTO = {
  minDueDate: "2028-02-28",
  maxDueDate: "2029-02-27",
  datePolicyEvaluatedAt: "2028-02-28T15:59:58.000Z",
  nextDatePolicyBoundaryAt: "2028-02-28T16:00:00.000Z",
};
const after: DueDatePolicyDTO = {
  minDueDate: "2028-02-29",
  maxDueDate: "2029-02-28",
  datePolicyEvaluatedAt: "2028-02-28T16:00:00.000Z",
  nextDatePolicyBoundaryAt: "2028-02-29T16:00:00.000Z",
};
function proposal(locale: Locale): ProposalDTO {
  return {
    ...before,
    version: "internal-review-proposal.v1",
    businessKey: "proposal-date",
    project: { projectKey: "PROJECT", name: "Project" },
    comparisonRunId: "comparison-date",
    enrichmentRunId: "economics-date",
    locale,
    timezone: "Asia/Taipei",
    titleOptions: [
      { key: "ONE", text: "Review" },
      { key: "TWO", text: "Check" },
    ],
    rationaleOptions: [
      { key: "ONE", text: "First purpose" },
      { key: "TWO", text: "Second purpose" },
    ],
    title: "Review",
    rationale: "First purpose",
    titleKey: "ONE",
    rationaleKey: "ONE",
    mandatoryStatements: [],
    warnings: [],
    assignees: [{ key: "mei", displayName: "Mei" }],
    canAssign: true,
    suggestedAssigneeKey: "mei",
    suggestedDueDate: before.minDueDate,
    expiresAt: "2028-02-28T16:29:58.000Z",
    idempotencyKey: "unchanged-confirmation-key",
    evidenceLinks: [],
    returnContext: { selectedProjectKeys: [] },
  };
}
let root: Root;
let host: HTMLDivElement;
let locale: Locale;
let serverPolicy: DueDatePolicyDTO;
const post = vi.fn();
const get = vi.fn();
const outcome = vi.fn();
const scroll = vi.fn();
const cancel = vi.fn();
function input(id: string) {
  return host.querySelector<HTMLInputElement>(`#review-${id}`)!;
}
function choose(id: string, value: string) {
  const control = input(id);
  const prototype =
    control instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(control, value);
  control.dispatchEvent(new Event("change", { bubbles: true }));
  control.dispatchEvent(new Event("input", { bubbles: true }));
}
async function mount() {
  const value = proposal(locale);
  window.history.replaceState(
    null,
    "",
    internalReviewHref(locale, "PROJECT", value, { proposalKey: value.businessKey }),
  );
  await act(async () =>
    root.render(
      createElement(InternalReviewSheet, {
        proposal: value,
        draft: {},
        onCancel: cancel,
        onEvidence: vi.fn(),
        onOutcome: outcome,
        onPendingChange: vi.fn(),
      }),
    ),
  );
}
async function submit() {
  await act(async () =>
    host
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
}
function response(value: unknown, ok = true) {
  return { ok, json: async () => value } as Response;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance", "Date"] });
  // Deliberately unrelated browser calendar: no client wall date may define business bounds.
  vi.setSystemTime(new Date("2034-06-01T02:00:00-07:00"));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scroll,
  });
  const replace = window.history.replaceState.bind(window.history);
  vi.spyOn(window.history, "replaceState").mockImplementation((data, unused, url) => {
    replace(data, unused, url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  serverPolicy = before;
  get
    .mockReset()
    .mockImplementation(async () =>
      response({ kind: "PREPARED", proposal: { ...proposal(locale), ...serverPolicy } }),
    );
  post
    .mockReset()
    .mockResolvedValue(response({ kind: "CREATED", receipt: { businessKey: "receipt-date" } }));
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, options?: RequestInit) =>
      options?.method === "POST" ? post(url, options) : get(url, options),
    ),
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

describe.each(["en", "zh-TW"] as const)("live authoritative date guidance (%s)", (language) => {
  beforeEach(() => {
    locale = language;
  });
  it("refreshes across Taipei leap-day midnight without reopening or losing the draft/focus", async () => {
    if (process.env.TZ === "America/Los_Angeles") {
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("America/Los_Angeles");
    }
    await mount();
    expect(input("dueDate").min).toBe(before.minDueDate);
    expect(input("dueDate").max).toBe(before.maxDueDate);
    await act(async () => {
      choose("title", "TWO");
      choose("rationale", "TWO");
      choose("assignee", "none");
      input("confirmation").click();
    });
    input("title").focus();
    const route = window.location.href;
    serverPolicy = after;
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(get).toHaveBeenCalledTimes(2);
    expect(input("dueDate").min).toBe(after.minDueDate);
    expect(input("dueDate").max).toBe(after.maxDueDate);
    expect(input("dueDate").value).toBe(before.minDueDate);
    expect(input("dueDate").getAttribute("aria-invalid")).toBe("true");
    expect(input("dueDate").getAttribute("aria-describedby")).toContain("review-dueDate-error");
    expect(host.querySelector("#review-dueDate-error")?.textContent).toBe(
      getInternalReviewCopy(locale).validation.INVALID_DUE_DATE,
    );
    expect(input("title").value).toBe("TWO");
    expect(input("rationale").value).toBe("TWO");
    expect(input("assignee").value).toBe("none");
    expect(input("confirmation").checked).toBe(true);
    expect(document.activeElement).toBe(input("title"));
    expect(window.location.href).toBe(route);
    expect(post).not.toHaveBeenCalled();
    await submit();
    expect(post).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input("dueDate"));
    expect(scroll).toHaveBeenCalled();
    expect(input("title").value).toBe("TWO");
    await act(async () => choose("dueDate", after.minDueDate));
    expect(input("dueDate").getAttribute("aria-invalid")).toBe("false");
    expect(host.querySelector("#review-dueDate-error")).toBeNull();
    await submit();
    expect(post).toHaveBeenCalledOnce();
    expect(JSON.parse(post.mock.calls[0]![1].body)).toMatchObject({
      title: "Check",
      rationale: "Second purpose",
      assigneeKey: null,
      dueDate: after.minDueDate,
      idempotencyKey: "unchanged-confirmation-key",
    });
    expect(outcome).toHaveBeenCalled();
  });
  it.each([
    ["2028-02-29", true],
    ["2029-02-28", true],
    ["2029-03-01", false],
    ["", true],
  ] as const)("checks %s against fresh bounds (valid=%s)", async (date, valid) => {
    await mount();
    serverPolicy = after;
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    await act(async () => {
      choose("dueDate", date);
      input("confirmation").click();
    });
    await submit();
    expect(post).toHaveBeenCalledTimes(valid ? 1 : 0);
  });
  it("accepts confirmation-time server bounds when midnight races the timer", async () => {
    await mount();
    post.mockResolvedValue(
      response({
        kind: "VALIDATION_FAILED",
        requestId: "date-rejection",
        fieldErrors: { dueDate: "INVALID_DUE_DATE" },
        datePolicy: after,
      }),
    );
    await submit();
    expect(input("dueDate").min).toBe(after.minDueDate);
    expect(input("dueDate").max).toBe(after.maxDueDate);
    expect(input("dueDate").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(input("dueDate"));
    expect(input("dueDate").value).toBe(before.minDueDate);
  });
  it("focuses visible recovery after a user submission cannot refresh elapsed guidance", async () => {
    await mount();
    input("confirmation").focus();
    vi.spyOn(performance, "now").mockReturnValue(3000);
    get.mockRejectedValue(new Error("offline"));
    await submit();
    const recovery = host.querySelector("#review-date-policy");
    expect(recovery).not.toBeNull();
    expect(document.activeElement).toBe(recovery);
    expect(host.querySelector("form")!.getAttribute("aria-describedby")).toBe("review-date-policy");
    expect(scroll).toHaveBeenCalledWith({ behavior: "instant", block: "center" });
    expect(post).not.toHaveBeenCalled();
  });
  it.each(["older response", "failed response"])(
    "ignores a pending refresh's %s after newer server validation",
    async (ending) => {
      await mount();
      let finishPost!: (value: Response) => void;
      let finishGet!: (value: Response) => void;
      let failGet!: (reason: Error) => void;
      post.mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            finishPost = resolve;
          }),
      );
      await submit();
      get.mockImplementation(
        () =>
          new Promise<Response>((resolve, reject) => {
            finishGet = resolve;
            failGet = reject;
          }),
      );
      await act(async () => window.dispatchEvent(new Event("focus")));
      await act(async () =>
        finishPost(
          response({
            kind: "VALIDATION_FAILED",
            requestId: "midnight",
            fieldErrors: { dueDate: "INVALID_DUE_DATE" },
            datePolicy: after,
          }),
        ),
      );
      await act(async () =>
        ending === "older response"
          ? finishGet(response({ kind: "PREPARED", proposal: proposal(locale) }))
          : failGet(new Error("late failure")),
      );
      expect(input("dueDate").min).toBe(after.minDueDate);
      expect(input("dueDate").max).toBe(after.maxDueDate);
      expect(host.querySelector("#review-date-policy")).toBeNull();
      expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
    },
  );
  it.each(["focus", "pageshow", "visibilitychange"])(
    "recovers a suspended tab on %s without focus stealing",
    async (event) => {
      await mount();
      input("title").focus();
      serverPolicy = after;
      await act(async () =>
        (event === "visibilitychange" ? document : window).dispatchEvent(new Event(event)),
      );
      expect(input("dueDate").min).toBe(after.minDueDate);
      expect(document.activeElement).toBe(input("title"));
      expect(post).not.toHaveBeenCalled();
    },
  );
  it.each([
    "PROPOSAL_EXPIRED",
    "PROPOSAL_STALE",
    "PROPOSAL_NOT_AUTHORIZED",
    "PROPOSAL_UNAVAILABLE",
    "network",
  ])("hides stale bounds on %s and retains safe retry/cancel", async (kind) => {
    await mount();
    await act(async () => choose("title", "TWO"));
    if (kind === "network") get.mockRejectedValue(new Error("private transport detail"));
    else get.mockResolvedValue(response({ kind, requestId: "safe-reference" }));
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(input("dueDate").min).toBe("");
    expect(input("dueDate").max).toBe("");
    expect(host.querySelector("#review-date-hint")?.textContent).not.toContain(before.minDueDate);
    expect(host.textContent).toContain(getInternalReviewCopy(locale).datePolicyUnavailable);
    expect(host.textContent).not.toContain("private transport detail");
    expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    expect(input("title").value).toBe("TWO");
    expect(post).not.toHaveBeenCalled();
    host.querySelector<HTMLButtonElement>("#review-date-policy button")!.focus();
    await act(async () =>
      host.querySelector<HTMLButtonElement>("#review-date-policy button")!.click(),
    );
    expect(document.activeElement).toBe(host.querySelector("#review-date-policy"));
    expect(scroll).toHaveBeenCalledWith({ behavior: "instant", block: "center" });
    get.mockResolvedValue(
      response({ kind: "PREPARED", proposal: { ...proposal(locale), ...after } }),
    );
    await act(async () =>
      host.querySelector<HTMLButtonElement>("#review-date-policy button")!.click(),
    );
    expect(input("dueDate").min).toBe(after.minDueDate);
    expect(input("title").value).toBe("TWO");
    expect(document.activeElement).toBe(input("dueDate"));
    await act(async () =>
      [...host.querySelectorAll("button")]
        .find((button) => button.textContent === getInternalReviewCopy(locale).cancel)!
        .click(),
    );
    expect(cancel).toHaveBeenCalled();
  });
  it("ignores a refresh completing after unmount and aborts the old request", async () => {
    let finish!: (response: Response) => void;
    get.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    await mount();
    const signal = get.mock.calls[0]![1].signal as AbortSignal;
    await act(async () => root.render(null));
    expect(signal.aborted).toBe(true);
    await act(async () =>
      finish(response({ kind: "PREPARED", proposal: { ...proposal(locale), ...after } })),
    );
    expect(host.textContent).toBe("");
    expect(post).not.toHaveBeenCalled();
  });
});
