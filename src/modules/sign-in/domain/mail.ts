import type { Locale } from "@/modules/localization/config";
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
export function codeMail(locale: Locale, code: string) {
  if (!/^\d{6}$/.test(code)) throw new Error("Invalid code.");
  const subject =
    locale === "zh-TW" ? `${code} — StrideBrain 驗證碼` : `${code} — StrideBrain sign-in code`;
  const text =
    locale === "zh-TW"
      ? `${code}\n\n這是您的 StrideBrain 驗證碼，10 分鐘內有效。若您未要求登入，請忽略此信。`
      : `${code}\n\nYour StrideBrain sign-in code works for 10 minutes. If you did not ask to sign in, ignore this email.`;
  return {
    subject,
    text,
    html: `<p><strong>${code}</strong></p><p>${escapeHtml(text.split("\n\n")[1]!)}</p>`,
  };
}
export function invitationMail(locale: Locale, firm: string, origin: string) {
  const url = `${origin}/${locale}/sign-in`;
  const subject =
    locale === "zh-TW" ? `${firm} 邀請您加入 StrideBrain` : `${firm} invited you to StrideBrain`;
  const text =
    locale === "zh-TW"
      ? `${firm} 邀請您加入 StrideBrain。請使用受邀信箱登入。\n\n${url}`
      : `${firm} invited you to StrideBrain. Sign in using your invited email.\n\n${url}`;
  return {
    subject,
    text,
    html: `<p>${escapeHtml(text.split("\n\n")[0]!)}</p><p><a href="${escapeHtml(url)}">${locale === "zh-TW" ? "登入" : "Sign in"}</a></p>`,
  };
}
