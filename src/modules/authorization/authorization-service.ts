import type {
  Capability,
  RuntimeContext,
} from "@/modules/runtime-context/contracts";

export type PublicAuthorizationError =
  | "PROJECT_UNAVAILABLE"
  | "EVIDENCE_UNAVAILABLE"
  | "ACTION_NOT_AUTHORIZED";

export type CommercialKind =
  | "QUOTE"
  | "FORECAST"
  | "ACTUAL"
  | "SUPPLIER_OFFER";

export type CommercialScope =
  | "NONE"
  | "QUOTE_ONLY"
  | "QUOTE_AND_FORECAST"
  | "FULL_ACTUAL";

export type EvidenceAccessScope = "NONE" | "NON_SENSITIVE" | "AUTHORIZED";

export type AuthorizationDecision = Readonly<{
  allowed: boolean;
  publicError?: PublicAuthorizationError;
  internalReason:
    | "ALLOWED"
    | "MISSING_CAPABILITY"
    | "MISSING_ASSIGNMENT"
    | "ACTUAL_READ_DENIED"
    | "ACTION_ASSIGNMENT_DENIED";
}>;

export type ProjectAccessDecision = AuthorizationDecision &
  Readonly<{
    commercialScope: CommercialScope;
    evidenceScope: EvidenceAccessScope;
  }>;

function capabilityDecision(
  context: RuntimeContext,
  capability: Capability,
  publicError: PublicAuthorizationError,
): AuthorizationDecision {
  if (!context.capabilities.has(capability)) {
    return Object.freeze({
      allowed: false,
      publicError,
      internalReason: "MISSING_CAPABILITY",
    });
  }
  return Object.freeze({ allowed: true, internalReason: "ALLOWED" });
}

function hasProjectAssignment(
  context: RuntimeContext,
  projectId: string,
): boolean {
  return (
    context.role === "ORGANIZATION_ADMIN" ||
    context.assignedProjectIds?.has(projectId) === true
  );
}

function assignmentAllowsActual(
  context: RuntimeContext,
  projectId: string,
): boolean {
  return (
    context.role === "ORGANIZATION_ADMIN" ||
    context.projectAssignments?.get(projectId)?.canReadActuals === true
  );
}

function assignmentAllowsAction(
  context: RuntimeContext,
  projectId: string,
): boolean {
  return (
    context.role === "ORGANIZATION_ADMIN" ||
    context.projectAssignments?.get(projectId)?.canCreateAction === true
  );
}

function commercialScope(
  context: RuntimeContext,
  projectId: string,
): CommercialScope {
  if (
    context.capabilities.has("commercial:actual-read") &&
    assignmentAllowsActual(context, projectId)
  ) {
    return "FULL_ACTUAL";
  }
  if (context.capabilities.has("commercial:forecast-read")) {
    return "QUOTE_AND_FORECAST";
  }
  if (context.capabilities.has("quote:read")) return "QUOTE_ONLY";
  return "NONE";
}

function evidenceScope(
  context: RuntimeContext,
  projectId: string,
): EvidenceAccessScope {
  if (!context.capabilities.has("evidence:read")) return "NONE";
  return context.capabilities.has("commercial:actual-read") &&
    assignmentAllowsActual(context, projectId)
    ? "AUTHORIZED"
    : "NON_SENSITIVE";
}

export class AuthorizationService {
  canReadProject(
    context: RuntimeContext,
    projectId: string,
  ): ProjectAccessDecision {
    if (!context.capabilities.has("project:read")) {
      return Object.freeze({
        allowed: false,
        publicError: "PROJECT_UNAVAILABLE",
        internalReason: "MISSING_CAPABILITY",
        commercialScope: "NONE",
        evidenceScope: "NONE",
      });
    }
    if (!hasProjectAssignment(context, projectId)) {
      return Object.freeze({
        allowed: false,
        publicError: "PROJECT_UNAVAILABLE",
        internalReason: "MISSING_ASSIGNMENT",
        commercialScope: "NONE",
        evidenceScope: "NONE",
      });
    }

    return Object.freeze({
      allowed: true,
      internalReason: "ALLOWED",
      commercialScope: commercialScope(context, projectId),
      evidenceScope: evidenceScope(context, projectId),
    });
  }

  canRunComparison(
    context: RuntimeContext,
    projectId: string,
  ): AuthorizationDecision {
    const project = this.canReadProject(context, projectId);
    if (!project.allowed) return project;
    return capabilityDecision(context, "project:compare", "PROJECT_UNAVAILABLE");
  }

  canReadCommercial(
    context: RuntimeContext,
    projectId: string,
    kind: CommercialKind,
  ): AuthorizationDecision {
    const project = this.canReadProject(context, projectId);
    if (!project.allowed) return project;

    if (kind === "ACTUAL" && !assignmentAllowsActual(context, projectId)) {
      return Object.freeze({
        allowed: false,
        publicError: "PROJECT_UNAVAILABLE",
        internalReason: "ACTUAL_READ_DENIED",
      });
    }

    const capability: Capability =
      kind === "ACTUAL"
        ? "commercial:actual-read"
        : kind === "FORECAST" || kind === "SUPPLIER_OFFER"
          ? "commercial:forecast-read"
          : "quote:read";
    const decision = capabilityDecision(
      context,
      capability,
      "PROJECT_UNAVAILABLE",
    );
    if (!decision.allowed && kind === "ACTUAL") {
      return Object.freeze({
        ...decision,
        internalReason: "ACTUAL_READ_DENIED",
      });
    }
    return decision;
  }

  canReadEvidence(
    context: RuntimeContext,
    projectId: string,
  ): AuthorizationDecision {
    const project = this.canReadProject(context, projectId);
    if (!project.allowed) {
      return Object.freeze({
        allowed: false,
        publicError: "EVIDENCE_UNAVAILABLE",
        internalReason: project.internalReason,
      });
    }
    return capabilityDecision(context, "evidence:read", "EVIDENCE_UNAVAILABLE");
  }

  canProposeInternalReview(
    context: RuntimeContext,
    projectId: string,
  ): AuthorizationDecision {
    const project = this.canReadProject(context, projectId);
    if (!project.allowed) {
      return Object.freeze({
        allowed: false,
        publicError: "ACTION_NOT_AUTHORIZED",
        internalReason: project.internalReason,
      });
    }
    if (!assignmentAllowsAction(context, projectId)) {
      return Object.freeze({
        allowed: false,
        publicError: "ACTION_NOT_AUTHORIZED",
        internalReason: "ACTION_ASSIGNMENT_DENIED",
      });
    }
    return capabilityDecision(
      context,
      "action:internal-review:propose",
      "ACTION_NOT_AUTHORIZED",
    );
  }

  canCreateInternalReview(
    context: RuntimeContext,
    projectId: string,
  ): AuthorizationDecision {
    const proposal = this.canProposeInternalReview(context, projectId);
    if (!proposal.allowed) return proposal;
    return capabilityDecision(
      context,
      "action:internal-review:create",
      "ACTION_NOT_AUTHORIZED",
    );
  }

  canAssignInternalReview(
    context: RuntimeContext,
    projectId: string,
  ): AuthorizationDecision {
    const create = this.canCreateInternalReview(context, projectId);
    if (!create.allowed) return create;
    return capabilityDecision(context, "action:assign", "ACTION_NOT_AUTHORIZED");
  }
}

export type PublicAuthorizationResult = Readonly<{
  allowed: boolean;
  error?: PublicAuthorizationError;
}>;

export function toPublicAuthorizationResult(
  decision: AuthorizationDecision,
): PublicAuthorizationResult {
  return decision.allowed
    ? Object.freeze({ allowed: true })
    : Object.freeze({
        allowed: false,
        error: decision.publicError ?? "PROJECT_UNAVAILABLE",
      });
}
