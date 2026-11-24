import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { SiteAddressInput } from "@/modules/projects/domain/site-address-input";
export type SiteAddressOutcome = Readonly<{
  kind: "UPDATED" | "UNAVAILABLE" | "CONFLICT" | "INVALID";
}>;
export interface ProjectSiteAddressRepositoryPort {
  read(
    context: RuntimeContext,
    key: string,
  ): Promise<Readonly<{ projectKey: string; siteAddress: string }> | null>;
  updateWithAudit(context: RuntimeContext, input: SiteAddressInput): Promise<SiteAddressOutcome>;
}
