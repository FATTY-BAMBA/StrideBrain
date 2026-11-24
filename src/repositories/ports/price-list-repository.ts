import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { PriceQuery } from "@/modules/price-list/domain/price-input";
export type QuotedItemPrice = Readonly<{
  description: string;
  unit: string;
  unitPrice: string;
  currency: string;
  issuedOn: string;
  documentNumber: string;
  versionId: string;
  projectKey: string;
  projectName: string;
  clientName: string;
}>;
export type PriceListRow = QuotedItemPrice &
  Readonly<{ timesQuoted: number; clientPrice?: QuotedItemPrice }>;
export type PriceReadResult = Readonly<{ rows: readonly PriceListRow[]; hasMore: boolean }>;
export interface PriceListRepositoryPort {
  read(context: RuntimeContext, query: PriceQuery): Promise<PriceReadResult | null>;
}
