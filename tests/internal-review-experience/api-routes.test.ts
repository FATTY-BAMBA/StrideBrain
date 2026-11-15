import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  factory: vi.fn(),
  prepare: vi.fn(),
  confirm: vi.fn(),
  reopen: vi.fn(),
  receipt: vi.fn(),
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.resolve }));
vi.mock("@/lib/server/internal-review-services", () => ({
  createInternalReviewServices: mocks.factory,
}));
vi.mock("@/lib/env/server-env", () => ({
  getServerEnvironment: () => ({ appOrigin: new URL("https://preview.example.invalid") }),
}));

import { POST as preparePost } from "@/app/api/actions/internal-review/proposals/route";
import { POST as confirmPost } from "@/app/api/actions/internal-review/route";
import { GET as proposalGet } from "@/app/api/actions/internal-review/proposals/[proposalKey]/route";
import { GET as receiptGet } from "@/app/api/actions/[actionKey]/route";

const context = {
  requestId: "request-1",
  organizationId: "trusted-org",
  membershipId: "trusted-member",
  locale: "en",
};
const prepareInput = {
  projectKey: "PRJ-A",
  comparisonRunId: "cmprun_1",
  enrichmentRunId: "econrun_1",
  locale: "en",
  returnContext: { selectedProjectKeys: [] },
};
const confirmInput = {
  version: "internal-review-command.v1",
  proposalKey: "proposal_1",
  title: "Review",
  rationale: "Check evidence",
  assigneeKey: null,
  dueDate: null,
  confirmation: true,
  idempotencyKey: "e1ec6292-9d9a-4c2a-9fa1-a971843b9411",
  locale: "en",
};
function request(path: string, input: unknown, origin = "https://preview.example.invalid") {
  return new Request(`https://preview.example.invalid${path}`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

describe("Stage 8 direct HTTP authorization adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolve.mockResolvedValue(context);
    mocks.factory.mockReturnValue({
      prepare: mocks.prepare,
      confirm: mocks.confirm,
      reopenProposal: mocks.reopen,
      getReceipt: mocks.receipt,
    });
    mocks.prepare.mockResolvedValue({
      kind: "PROPOSAL_NOT_AUTHORIZED",
      requestId: context.requestId,
    });
    mocks.confirm.mockResolvedValue({
      kind: "ACTION_NOT_AUTHORIZED",
      requestId: context.requestId,
    });
    mocks.reopen.mockResolvedValue({
      kind: "PROPOSAL_NOT_AUTHORIZED",
      requestId: context.requestId,
    });
    mocks.receipt.mockResolvedValue({
      kind: "ACTION_NOT_AUTHORIZED",
      requestId: context.requestId,
    });
  });

  it("rejects unauthenticated direct proposal/create before constructing application services", async () => {
    mocks.resolve.mockResolvedValue(null);
    const proposal = await preparePost(
      request("/api/actions/internal-review/proposals", prepareInput),
    );
    const action = await confirmPost(request("/api/actions/internal-review", confirmInput));
    expect(proposal.status).toBe(403);
    expect(action.status).toBe(403);
    expect(mocks.factory).not.toHaveBeenCalled();
    expect(action.headers.get("cache-control")).toBe("private, no-store");
  });

  it("rejects cross-origin confirmation without resolving a session or calling a write", async () => {
    const response = await confirmPost(
      request("/api/actions/internal-review", confirmInput, "https://attacker.invalid"),
    );
    expect(response.status).toBe(403);
    expect(mocks.resolve).not.toHaveBeenCalled();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("forwards only trusted server context and preserves neutral service denial", async () => {
    const proposal = await preparePost(
      request("/api/actions/internal-review/proposals", prepareInput),
    );
    const action = await confirmPost(request("/api/actions/internal-review", confirmInput));
    expect(mocks.prepare).toHaveBeenCalledWith(context, prepareInput);
    expect(mocks.confirm).toHaveBeenCalledWith(context, confirmInput);
    expect(await proposal.json()).toEqual({
      kind: "PROPOSAL_NOT_AUTHORIZED",
      requestId: "request-1",
    });
    expect(await action.json()).toEqual({ kind: "ACTION_NOT_AUTHORIZED", requestId: "request-1" });
    await confirmPost(
      request("/api/actions/internal-review", { ...confirmInput, organizationId: "foreign" }),
    );
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });

  it("only reopens on GET and never invokes prepare or confirmation", async () => {
    const proposal = await proposalGet(
      new Request(
        "https://preview.example.invalid/api/actions/internal-review/proposals/proposal_1?locale=zh-TW",
      ),
      { params: Promise.resolve({ proposalKey: "proposal_1" }) },
    );
    const receipt = await receiptGet(
      new Request("https://preview.example.invalid/api/actions/action_1?locale=zh-TW"),
      { params: Promise.resolve({ actionKey: "action_1" }) },
    );
    expect(mocks.reopen).toHaveBeenCalledWith(context, "proposal_1", "zh-TW");
    expect(mocks.receipt).toHaveBeenCalledWith(context, "action_1", "zh-TW");
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(proposal.headers.get("cache-control")).toContain("no-store");
    expect(receipt.headers.get("cache-control")).toContain("no-store");
  });

  it("turns service exceptions into safe responses without database/provider text", async () => {
    mocks.confirm.mockRejectedValue(new Error("sensitive connection / private evidence title"));
    const response = await confirmPost(request("/api/actions/internal-review", confirmInput));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ kind: "ACTION_CREATE_FAILED", requestId: "request-1" });
  });
});
