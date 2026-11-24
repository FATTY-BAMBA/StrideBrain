import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { BUSINESS_KEY } from "../domain/job-input";
import { validateSiteAddress } from "../domain/site-address-input";
import type {
  ProjectSiteAddressRepositoryPort,
  SiteAddressOutcome,
} from "@/repositories/ports/project-site-address-repository";
export class ProjectSiteAddress {
  constructor(private readonly repository: ProjectSiteAddressRepositoryPort) {}
  async read(context: RuntimeContext, key: string) {
    if (!context.capabilities.has("project:read") || !BUSINESS_KEY.test(key)) return null;
    const row = await this.repository.read(context, key);
    return row ? { ...row, canEdit: context.capabilities.has("project:update") } : null;
  }
  async update(context: RuntimeContext, raw: unknown): Promise<SiteAddressOutcome> {
    if (!context.capabilities.has("project:update") || !context.capabilities.has("project:read"))
      return { kind: "UNAVAILABLE" };
    const input = validateSiteAddress(raw);
    return input ? this.repository.updateWithAudit(context, input) : { kind: "INVALID" };
  }
}
