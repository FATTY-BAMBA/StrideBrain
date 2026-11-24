import type { FirmLists } from "@/modules/firm-lists/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { FirmListChange } from "@/modules/firm-lists/domain/list-change";

export interface FirmListsReader {
  read(context: RuntimeContext): Promise<FirmLists | null>;
}
export interface FirmListSettingsReader extends FirmListsReader {
  referencedCategories(context: RuntimeContext): Promise<readonly string[] | null>;
}

export type FirmListChangeResult =
  | Readonly<{ kind: "SAVED"; key: string | null }>
  | Readonly<{ kind: "UNAVAILABLE" | "CHANGED" | "CONFLICT" | "LIMIT" | "MAPPING_IN_USE" }>
  | Readonly<{ kind: "INVALID"; fields: readonly string[] }>;
export interface FirmListsWriter {
  changeWithAudit(context: RuntimeContext, input: FirmListChange): Promise<FirmListChangeResult>;
}
