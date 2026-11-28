import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { codeMail, invitationMail } from "@/modules/sign-in/domain/mail";
function sources(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sources(join(path, entry.name))
      : /\.tsx?$/.test(entry.name)
        ? [join(path, entry.name)]
        : [],
  );
}
it("keeps sign-in addresses out of logging, usage and model plumbing", () => {
  const files = [
    ...sources("src/modules/sign-in"),
    ...sources("src/modules/people"),
    "src/lib/server/better-auth.ts",
    "src/repositories/prisma/prisma-people.ts",
    "src/repositories/prisma/prisma-real-identity.ts",
  ];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    expect(text, file).not.toMatch(/console\.(log|info|warn|error|debug)\s*\(/);
    expect(text, file).not.toMatch(/assistantUsage|modelRequest|gemini|generateContent/);
  }
  expect(readFileSync("src/lib/server/better-auth.ts", "utf8")).toContain(
    "logger: { disabled: true }",
  );
});
it("keeps mail templates simple, bilingual and free of tracking or job facts", () => {
  for (const locale of ["en", "zh-TW"] as const) {
    const code = codeMail(locale, "123456");
    expect(code.text.startsWith("123456")).toBe(true);
    expect(code.subject).toContain("123456");
    const notice = invitationMail(locale, "Synthetic Firm", "https://signin.example.invalid");
    expect(notice.html).toContain(`https://signin.example.invalid/${locale}/sign-in`);
    for (const mail of [code, notice])
      expect(mail.html).not.toMatch(/<img|pixel|utm_|projectKey|clientId/);
  }
});
