import type { FirmListsReader } from "@/repositories/ports/firm-lists-repository";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export class GetFirmLists {
  constructor(private readonly lists: FirmListsReader) {}
  async execute(context: RuntimeContext) {
    if (!context.capabilities.has("project:read") && !context.capabilities.has("firm-lists:manage"))
      return { kind: "UNAVAILABLE" } as const;
    try {
      const lists = await this.lists.read(context);
      return lists ? ({ kind: "AVAILABLE", lists } as const) : ({ kind: "UNAVAILABLE" } as const);
    } catch {
      return { kind: "FAILED" } as const;
    }
  }
}
