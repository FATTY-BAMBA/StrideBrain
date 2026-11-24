import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { QuoteListRepository } from "@/repositories/ports/quote-list-repository";
import { quoteListSearch } from "../domain/quote-list";
export class ListQuotes {
  constructor(private readonly quotes: QuoteListRepository) {}
  async execute(context: RuntimeContext, raw: unknown) {
    if (!context.capabilities.has("project:read")) return { kind: "UNAVAILABLE" } as const;
    const input = quoteListSearch(raw);
    if (!input) return { kind: "INVALID" } as const;
    if (input.clientKey && !context.capabilities.has("client:read"))
      return { kind: "UNAVAILABLE" } as const;
    try {
      const result = await this.quotes.list(context, input);
      return result ? { kind: "AVAILABLE" as const, ...result } : { kind: "UNAVAILABLE" as const };
    } catch {
      return { kind: "FAILED" } as const;
    }
  }
}
