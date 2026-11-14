import { describe, expect, it } from "vitest";

import {
  hashSessionToken,
  issueSignedSessionToken,
  verifySignedSessionToken,
} from "@/modules/runtime-context/session-token";

const SECRET = "stage2-test-secret-with-at-least-thirty-two-bytes";
const FIXED_ENTROPY = {
  sessionId: "AAAAAAAAAAAAAAAAAAAAAA",
  nonce: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
};

function changeLastCharacter(value: string): string {
  const last = value.at(-1);
  return `${value.slice(0, -1)}${last === "A" ? "B" : "A"}`;
}

describe("signed opaque demo session token", () => {
  it("issues a signed token and stores only a stable SHA-256 hash", () => {
    const issued = issueSignedSessionToken(SECRET, FIXED_ENTROPY);
    expect(issued.token).toMatch(/^sb1\./);
    expect(issued.token).not.toContain(SECRET);
    expect(issued.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(issued.tokenHash).toBe(hashSessionToken(issued.token));

    expect(verifySignedSessionToken(SECRET, issued.token)).toEqual({
      sessionId: FIXED_ENTROPY.sessionId,
      tokenHash: issued.tokenHash,
    });
  });

  it("rejects a changed nonce, signature, malformed token, and wrong secret", () => {
    const issued = issueSignedSessionToken(SECRET, FIXED_ENTROPY);
    const parts = issued.token.split(".");
    const changedNonce = [...parts];
    changedNonce[2] = changeLastCharacter(changedNonce[2] ?? "");
    const changedSignature = [...parts];
    changedSignature[3] = changeLastCharacter(changedSignature[3] ?? "");

    expect(
      verifySignedSessionToken(SECRET, changedNonce.join(".")),
    ).toBeNull();
    expect(
      verifySignedSessionToken(SECRET, changedSignature.join(".")),
    ).toBeNull();
    expect(verifySignedSessionToken(SECRET, "not-a-session-token")).toBeNull();
    expect(
      verifySignedSessionToken(
        "different-test-secret-with-at-least-thirty-two-bytes",
        issued.token,
      ),
    ).toBeNull();
  });

  it("rejects weak signing secrets", () => {
    expect(() => issueSignedSessionToken("too-short", FIXED_ENTROPY)).toThrow(
      /at least 32 bytes/,
    );
    expect(() =>
      verifySignedSessionToken("too-short", "sb1.invalid.invalid.invalid"),
    ).toThrow(/at least 32 bytes/);
  });
});
