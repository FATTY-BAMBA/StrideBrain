type Environment = Readonly<Record<string, string | undefined>>;

/** Explicitly opt in only on a synthetic Vercel Preview with a pinned HTTPS origin. */
export function previewSessionOrigin(env: Environment): string | null {
  if (
    env.VERCEL_ENV !== "preview" ||
    env.NEXT_PUBLIC_STRIDEBRAIN_ENV !== "preview" ||
    env.STRIDEBRAIN_DATA_MODE !== "DEMO_SYNTHETIC"
  )
    return null;
  try {
    const url = new URL(env.STRIDEBRAIN_APP_ORIGIN ?? "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.hostname.endsWith(".localhost")
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function previewInvitation(env: Environment, now: Date) {
  if (!previewSessionOrigin(env) || env.STRIDEBRAIN_PREVIEW_HANDOFF_ENABLED !== "true") return null;
  const digest = env.STRIDEBRAIN_PREVIEW_INVITE_SHA256 ?? "";
  const expiresAt = Date.parse(env.STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT ?? "");
  if (
    !/^[a-f0-9]{64}$/.test(digest) ||
    !Number.isFinite(expiresAt) ||
    expiresAt - now.getTime() < 60_000 ||
    Object.keys(env).some((key) => key.startsWith("NEXT_PUBLIC_STRIDEBRAIN_PREVIEW_INVITE"))
  )
    return null;
  return { digest, ttlSeconds: Math.min(3600, Math.floor((expiresAt - now.getTime()) / 1000)) };
}
