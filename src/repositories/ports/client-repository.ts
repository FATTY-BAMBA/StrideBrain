import type { ClientDetails, UpdateClientInput } from "@/modules/clients/domain/client-input";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export type ClientSummary = Readonly<{
  businessKey: string;
  nameEn: string;
  nameZhTw: string;
  clientType: string;
  active: boolean;
}>;
export type ClientRecord = ClientDetails &
  Readonly<{
    businessKey: string;
    active: boolean;
    updatedAt: string;
  }>;
export type ClientUpdateResult =
  | Readonly<{ kind: "SAVED"; businessKey: string; updatedAt: string }>
  | Readonly<{ kind: "UNAVAILABLE" | "CHANGED" | "CONFLICT" }>;
export interface ClientRepositoryPort {
  list(
    context: RuntimeContext,
    input: Readonly<{ search: string; page: number }>,
  ): Promise<Readonly<{ clients: readonly ClientSummary[]; hasMore: boolean }> | null>;
  get(context: RuntimeContext, businessKey: string): Promise<ClientRecord | null>;
  updateWithAudit(context: RuntimeContext, input: UpdateClientInput): Promise<ClientUpdateResult>;
}
