import type { ActiveProjectComparisonContext } from "@/modules/comparisons/domain/contracts";
import {
  permissionFingerprint,
  profileFingerprint,
} from "@/modules/comparisons/application/fingerprints";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparableProjectRepositoryPort } from "@/repositories/ports/comparable-project-repository";

export type ResolvedActiveComparisonContext = Readonly<{
  context: ActiveProjectComparisonContext;
  activeQuoteVersionInternalId?: string | undefined;
}>;

export class ActiveProjectContextService {
  constructor(
    private readonly repository: ComparableProjectRepositoryPort,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async resolve(
    runtimeContext: RuntimeContext,
    activeProjectId: string,
  ): Promise<ResolvedActiveComparisonContext | null> {
    const record = await this.repository.getActiveComparisonProfile(
      runtimeContext,
      activeProjectId,
    );
    if (!record || record.profile.organizationId !== runtimeContext.organizationId) return null;

    const snapshotDate = this.clock().toISOString().slice(0, 10);
    const context: ActiveProjectComparisonContext = Object.freeze({
      ...record.profile,
      snapshotDate,
      activeQuoteVersionKey: record.activeQuoteVersionKey,
      sourceFingerprint: profileFingerprint(record.profile),
      permissionFingerprint: permissionFingerprint(runtimeContext, activeProjectId),
    });

    return Object.freeze({
      context,
      activeQuoteVersionInternalId: record.activeQuoteVersionId,
    });
  }
}
