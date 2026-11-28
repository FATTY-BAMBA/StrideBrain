import { createHmac } from "node:crypto";
import { EMAIL_LIMITS, normalizeSignInEmail } from "@/modules/sign-in/domain/policy";
import type { SignInCounterPort } from "@/repositories/ports/sign-in-counter";

export function signInCounterKey(
  secret: string,
  operation: keyof typeof EMAIL_LIMITS,
  subject: string,
) {
  const key = createHmac("sha256", secret).update("stridebrain/sign-in/counter-key/v1").digest();
  return createHmac("sha256", key).update(`${operation}\0${subject}`).digest("hex");
}
export async function guardEmail(
  counter: SignInCounterPort,
  secret: string,
  operation: "request" | "entry",
  value: unknown,
) {
  const email = normalizeSignInEmail(value);
  if (!email) return { kind: "INVALID" } as const;
  const allowed = await counter.consume(
    signInCounterKey(secret, operation, email),
    EMAIL_LIMITS[operation],
  );
  return allowed ? ({ kind: "ALLOWED", email } as const) : ({ kind: "LIMITED" } as const);
}
