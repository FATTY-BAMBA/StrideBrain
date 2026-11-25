import { BUSINESS_KEY } from "@/modules/projects/domain/job-input";
import { validateClientSearch, validateClientUpdate } from "../domain/client-input";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ClientRepositoryPort } from "@/repositories/ports/client-repository";

export class ListClients {
  constructor(private readonly clients: ClientRepositoryPort) {}
  async execute(context: RuntimeContext, raw: unknown) {
    if (!context.capabilities.has("client:read")) return { kind: "UNAVAILABLE" } as const;
    const input = validateClientSearch(raw);
    if (!input) return { kind: "INVALID" } as const;
    try {
      const result = await this.clients.list(context, input);
      return result ? { kind: "AVAILABLE" as const, ...result } : { kind: "UNAVAILABLE" as const };
    } catch {
      return { kind: "FAILED" } as const;
    }
  }
}
export class GetClient {
  constructor(private readonly clients: ClientRepositoryPort) {}
  async execute(context: RuntimeContext, key: unknown) {
    if (
      !context.capabilities.has("client:read") ||
      typeof key !== "string" ||
      !BUSINESS_KEY.test(key)
    )
      return { kind: "UNAVAILABLE" } as const;
    try {
      const client = await this.clients.get(context, key);
      return client
        ? { kind: "AVAILABLE" as const, client, canEdit: context.capabilities.has("client:write") }
        : { kind: "UNAVAILABLE" as const };
    } catch {
      return { kind: "FAILED" } as const;
    }
  }
}
export class UpdateClient {
  constructor(private readonly clients: ClientRepositoryPort) {}
  async execute(context: RuntimeContext, raw: unknown) {
    if (!context.capabilities.has("client:read") || !context.capabilities.has("client:write"))
      return { kind: "UNAVAILABLE" } as const;
    const parsed = validateClientUpdate(raw, context.firmLists?.clientTypes ?? []);
    if (parsed.kind === "INVALID") return parsed;
    try {
      return await this.clients.updateWithAudit(context, parsed.input);
    } catch {
      return { kind: "FAILED" } as const;
    }
  }
}
