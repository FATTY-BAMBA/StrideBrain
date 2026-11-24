import { createHmac, timingSafeEqual } from "node:crypto";
import type { IssuePreparation } from "@/modules/quote-issue/domain/contracts";
import { MAX_QUOTE_ISSUE_TOKEN_LENGTH } from "@/modules/quote-issue/domain/contracts";
import type { QuoteIssueCodec } from "@/repositories/ports/quote-issue-repository";
/** Domain-separated MAC; Prepare remains read-only and the browser cannot invent a basis. */
export class SignedQuoteIssueCodec implements QuoteIssueCodec {
  constructor(
    private readonly secret: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    if (Buffer.byteLength(secret) < 32) throw new Error("QUOTE_ISSUE_SIGNING_KEY_TOO_SHORT");
  }
  private signature(payload: string) {
    return createHmac("sha256", this.secret)
      .update(`quote-issue-preparation:v1:${payload}`)
      .digest();
  }
  seal(value: IssuePreparation): string {
    const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
    return `${payload}.${this.signature(payload).toString("base64url")}`;
  }
  open(token: string): IssuePreparation | null {
    if (token.length > MAX_QUOTE_ISSUE_TOKEN_LENGTH) return null;
    const [payload, signature, ...extra] = token.split(".");
    if (!payload || !signature || extra.length) return null;
    const actual = Buffer.from(signature, "base64url"),
      expected = this.signature(payload);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    try {
      const value = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      ) as IssuePreparation;
      const age = this.now().getTime() - new Date(value.preparedAt).getTime();
      return Number.isFinite(age) && age >= 0 && age <= 15 * 60 * 1000 ? value : null;
    } catch {
      return null;
    }
  }
}
