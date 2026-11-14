const MINIMUM_SECRET_BYTES = 32;

export function parseDemoSessionSecret(input: Record<string, string | undefined>): string {
  const secret = input.STRIDEBRAIN_DEMO_SESSION_SECRET;
  if (!secret) {
    throw new Error("STRIDEBRAIN_DEMO_SESSION_SECRET is required for demo sessions.");
  }
  if (Buffer.byteLength(secret, "utf8") < MINIMUM_SECRET_BYTES) {
    throw new Error(
      `STRIDEBRAIN_DEMO_SESSION_SECRET must be at least ${MINIMUM_SECRET_BYTES} bytes.`,
    );
  }
  if ("NEXT_PUBLIC_STRIDEBRAIN_DEMO_SESSION_SECRET" in input) {
    throw new Error("Demo session signing secrets must never use NEXT_PUBLIC variables.");
  }
  return secret;
}

export function getDemoSessionSecret(): string {
  return parseDemoSessionSecret(process.env);
}
