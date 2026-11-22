import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  DraftPreparation,
  DraftPreparationCodec,
} from "@/repositories/ports/quote-draft-repository";
/** Domain-separated MAC; Prepare remains read-only and the browser cannot invent a basis. */
export class SignedDraftPreparationCodec implements DraftPreparationCodec {
  constructor(
    private readonly secret: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    if (Buffer.byteLength(secret) < 32) throw new Error("QUOTE_DRAFT_SIGNING_KEY_TOO_SHORT");
  }
  private signature(payload: string) {
    return createHmac("sha256", this.secret)
      .update(`quote-draft-preparation:v1:${payload}`)
      .digest();
  }
  seal(value: DraftPreparation): string {
    const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
    return `${payload}.${this.signature(payload).toString("base64url")}`;
  }
  open(token: string): DraftPreparation | null {
    if (token.length > 100_000) return null;
    const [payload, signature, ...extra] = token.split(".");
    if (!payload || !signature || extra.length) return null;
    const actual = Buffer.from(signature, "base64url"),
      expected = this.signature(payload);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    try {
      const value = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      ) as DraftPreparation;
      const age = this.now().getTime() - new Date(value.calculatedAt).getTime();
      return Number.isFinite(age) && age >= 0 && age <= 60 * 60 * 1000 ? value : null;
    } catch {
      return null;
    }
  }
}
