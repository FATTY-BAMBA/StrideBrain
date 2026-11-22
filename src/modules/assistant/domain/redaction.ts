/** Conservative redaction; allowlisted DTOs never include credentials or account fields. */
export function redactText(value: string): string {
  return value
    .replace(/[A-ZＡ-Ｚ][1289１２８９][0-9０-９]{8}/gi, "[removed]")
    .replace(/[0-9０-９]{4}-[0-9０-９]{2}-[0-9０-９]{2}|(?:[0-9０-９][ -]?){8,19}/g, (token) =>
      /^\d{4}-\d{2}-\d{2}$/.test(token.normalize("NFKC")) ? token : "[removed]",
    )
    .replace(
      /((?:"?(?:password|passwd|pwd|密碼)"?)\s*[=:：]\s*)(?:"[^"]*"|'[^']*'|[^\s,;，；]+)/gi,
      "$1[removed]",
    );
}
export function redact(value: unknown, key = ""): unknown {
  if (/password|passwd|pwd|密碼|bank.?account|card.?number/i.test(key.normalize("NFKC")))
    return "[removed]";
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value !== null && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  return value;
}
