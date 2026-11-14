import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const TOKEN_VERSION = "sb1";
const MINIMUM_SECRET_BYTES = 32;
const SESSION_ID_BYTES = 16;
const NONCE_BYTES = 32;
const TOKEN_PATTERN = /^sb1\.([A-Za-z0-9_-]{20,24})\.([A-Za-z0-9_-]{40,48})\.([A-Za-z0-9_-]{40,48})$/;

export type IssuedSessionToken = Readonly<{
  sessionId: string;
  token: string;
  tokenHash: string;
}>;

export type VerifiedSessionToken = Readonly<{
  sessionId: string;
  tokenHash: string;
}>;

function base64Url(value: Buffer): string {
  return value.toString("base64url");
}

function assertSecret(secret: string): void {
  if (Buffer.byteLength(secret, "utf8") < MINIMUM_SECRET_BYTES) {
    throw new Error(
      `Session signing secret must be at least ${MINIMUM_SECRET_BYTES} bytes`,
    );
  }
}

function signature(secret: string, payload: string): Buffer {
  return createHmac("sha256", secret).update(payload, "utf8").digest();
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function issueSignedSessionToken(
  secret: string,
  entropy: Readonly<{
    sessionId?: string;
    nonce?: string;
  }> = {},
): IssuedSessionToken {
  assertSecret(secret);
  const sessionId = entropy.sessionId ?? base64Url(randomBytes(SESSION_ID_BYTES));
  const nonce = entropy.nonce ?? base64Url(randomBytes(NONCE_BYTES));
  const payload = `${TOKEN_VERSION}.${sessionId}.${nonce}`;
  const token = `${payload}.${base64Url(signature(secret, payload))}`;

  return Object.freeze({
    sessionId,
    token,
    tokenHash: hashSessionToken(token),
  });
}

export function verifySignedSessionToken(
  secret: string,
  token: string,
): VerifiedSessionToken | null {
  assertSecret(secret);
  if (token.length > 220) return null;

  const match = TOKEN_PATTERN.exec(token);
  if (!match) return null;
  const [, sessionId, nonce, suppliedSignature] = match;
  if (!sessionId || !nonce || !suppliedSignature) return null;

  const payload = `${TOKEN_VERSION}.${sessionId}.${nonce}`;
  const expected = signature(secret, payload);
  let supplied: Buffer;
  try {
    supplied = Buffer.from(suppliedSignature, "base64url");
  } catch {
    return null;
  }
  if (supplied.length !== expected.length) return null;
  if (!timingSafeEqual(supplied, expected)) return null;

  return Object.freeze({
    sessionId,
    tokenHash: hashSessionToken(token),
  });
}
