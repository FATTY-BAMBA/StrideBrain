import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { priceQuery } from "../domain/price-input";
import type {
  PriceListRepositoryPort,
  PriceReadResult,
} from "@/repositories/ports/price-list-repository";
export type PriceReadOutcome =
  | (PriceReadResult & Readonly<{ kind: "AVAILABLE" }>)
  | Readonly<{ kind: "UNAVAILABLE" | "INVALID" }>;
export class ReadPriceList {
  constructor(private readonly repository: PriceListRepositoryPort) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<PriceReadOutcome> {
    if (!context.capabilities.has("project:read") || !context.capabilities.has("quote:read"))
      return { kind: "UNAVAILABLE" };
    const query = priceQuery(raw);
    if (!query) return { kind: "INVALID" };
    try {
      const result = await this.repository.read(context, query);
      return result ? { kind: "AVAILABLE", ...result } : { kind: "UNAVAILABLE" };
    } catch {
      return { kind: "UNAVAILABLE" };
    }
  }
}
