import type {
  FirmListSettingsReader,
  FirmListsWriter,
} from "@/repositories/ports/firm-lists-repository";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { validateFirmListChange } from "../domain/list-change";

export const canManageFirmLists = (context: RuntimeContext): boolean =>
  context.role === "ORGANIZATION_ADMIN" && context.capabilities.has("firm-lists:manage");

export class GetFirmListSettings {
  constructor(private readonly lists: FirmListSettingsReader) {}
  async execute(context: RuntimeContext) {
    if (!canManageFirmLists(context)) return { kind: "UNAVAILABLE" } as const;
    try {
      const lists = await this.lists.read(context);
      if (!lists) return { kind: "UNAVAILABLE" } as const;
      const mappingLockedKeys = await this.lists.referencedCategories(context);
      return mappingLockedKeys
        ? ({ kind: "AVAILABLE", lists, mappingLockedKeys } as const)
        : ({ kind: "UNAVAILABLE" } as const);
    } catch {
      return { kind: "FAILED" } as const;
    }
  }
}
export class ChangeFirmList {
  constructor(private readonly lists: FirmListsWriter) {}
  async execute(context: RuntimeContext, raw: unknown) {
    if (!canManageFirmLists(context)) return { kind: "UNAVAILABLE" } as const;
    const parsed = validateFirmListChange(raw);
    if (parsed.kind === "INVALID") return parsed;
    try {
      return await this.lists.changeWithAudit(context, parsed.input);
    } catch {
      return { kind: "FAILED" } as const;
    }
  }
}
