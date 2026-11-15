import type {
  AuthorizedEvidenceBundleDTO,
  AuthorizedEvidenceSourceDTO,
  EvidenceReferenceSnapshot,
  StructuredEconomicsClaimDTO,
} from "@/modules/economics/domain/contracts";

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)]);
}

function toSource(reference: EvidenceReferenceSnapshot): AuthorizedEvidenceSourceDTO {
  return Object.freeze({
    referenceId: reference.id,
    subjectType: reference.subjectType,
    subjectId: reference.subjectId,
    ...(reference.documentVersionId ? { documentVersionId: reference.documentVersionId } : {}),
    locator: reference.locator,
    claimKey: reference.claimKey,
    ...(reference.supportedValue ? { supportedValue: reference.supportedValue } : {}),
    authorityState: reference.authorityState,
    ...(reference.observationType ? { observationType: reference.observationType } : {}),
    dataClassification: reference.dataClassification,
    ...(reference.effectiveAt ? { effectiveAt: reference.effectiveAt } : {}),
    ...(reference.staleAt ? { staleAt: reference.staleAt } : {}),
    conflictIds: Object.freeze([...reference.conflictIds]),
  });
}

function claimReferenceIds(claim: StructuredEconomicsClaimDTO): readonly string[] {
  const traceReferences =
    claim.calculationTrace?.inputs.flatMap((input) => input.evidenceReferenceIds) ?? [];
  return unique([...claim.evidenceReferenceIds, ...traceReferences]);
}

export class ComparisonEvidenceBundleService {
  build(
    claims: readonly StructuredEconomicsClaimDTO[],
    evidence: readonly EvidenceReferenceSnapshot[],
  ): readonly AuthorizedEvidenceBundleDTO[] {
    const byId = new Map(evidence.map((reference) => [reference.id, reference] as const));

    return Object.freeze(
      claims.map((claim) => {
        const referenceIds = claimReferenceIds(claim);
        const missing = referenceIds.filter((referenceId) => !byId.has(referenceId));
        if (missing.length > 0) {
          throw new Error(`UNSUPPORTED_EVIDENCE_REFERENCE:${claim.claimKey}:${missing.join(",")}`);
        }

        const sources = referenceIds
          .map((referenceId) => byId.get(referenceId))
          .filter((reference): reference is EvidenceReferenceSnapshot => reference !== undefined)
          .sort((left, right) => left.id.localeCompare(right.id))
          .map(toSource);

        return Object.freeze({
          claimKey: claim.claimKey,
          sources: Object.freeze(sources),
          ...(claim.calculationTrace ? { calculationTrace: claim.calculationTrace } : {}),
          warningCodes: Object.freeze([...claim.warningCodes]),
        });
      }),
    );
  }
}
