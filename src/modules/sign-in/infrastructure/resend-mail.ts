import type { SignInMailPort } from "@/repositories/ports/sign-in-mail";
export class ResendSignInMail implements SignInMailPort {
  constructor(
    private readonly key: string,
    private readonly from: string,
    private readonly replyTo: string,
  ) {}
  async send(message: { to: string; subject: string; text: string; html: string }) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, reply_to: this.replyTo, ...message }),
    });
    if (!response.ok) throw new Error("Mail delivery unavailable.");
  }
}
