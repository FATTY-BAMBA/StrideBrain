import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { currentQuoteRow, quoteListSearch } from "@/modules/quotes/domain/quote-list";
export type QuoteListRow = NonNullable<ReturnType<typeof currentQuoteRow>> &
  Readonly<{
    quoteKey: string;
    projectKey: string;
    projectName: string;
    clientName: string;
  }>;
export interface QuoteListRepository {
  list(
    context: RuntimeContext,
    input: NonNullable<ReturnType<typeof quoteListSearch>>,
  ): Promise<{ rows: readonly QuoteListRow[]; hasMore: boolean } | null>;
}
