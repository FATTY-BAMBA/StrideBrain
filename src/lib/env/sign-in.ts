import { signInMode } from "@/modules/sign-in/domain/policy";

export function realSignInSettings(env: Record<string, string | undefined>) {
  if (signInMode(env) === "demo") throw new Error("Real sign-in is disabled.");
  const required = (key: string) => {
    const value = env[key];
    if (!value) throw new Error(`${key} is required for real sign-in.`);
    return value;
  };
  const secret = required("STRIDEBRAIN_AUTH_SECRET");
  if (Buffer.byteLength(secret) < 32 || secret === env.STRIDEBRAIN_DEMO_SESSION_SECRET) {
    throw new Error("Sign-in requires its own secret of at least 32 bytes.");
  }
  if (
    Object.keys(env).some(
      (key) =>
        key.startsWith("NEXT_PUBLIC_") &&
        /AUTH_SECRET|GOOGLE_CLIENT_SECRET|RESEND_API_KEY/.test(key),
    )
  ) {
    throw new Error("Sign-in secrets must be server-only.");
  }
  const origin = new URL(required("STRIDEBRAIN_APP_ORIGIN"));
  if (
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password ||
    (origin.protocol !== "https:" &&
      !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)))
  ) {
    throw new Error("Sign-in requires an HTTPS origin (HTTP loopback only for local testing).");
  }
  return {
    secret,
    origin: origin.origin,
    googleClientId: required("STRIDEBRAIN_GOOGLE_CLIENT_ID"),
    googleClientSecret: required("STRIDEBRAIN_GOOGLE_CLIENT_SECRET"),
    resendKey: required("STRIDEBRAIN_RESEND_API_KEY"),
    sender: required("STRIDEBRAIN_MAIL_FROM"),
    replyTo: required("STRIDEBRAIN_MAIL_REPLY_TO"),
  };
}
