import type { Locale } from "@/modules/localization/config";
import type { FirmLists } from "@/modules/firm-lists/domain/contracts";

export type DataMode = "DEMO_SYNTHETIC" | "TENANT_PRIVATE";

export type Role =
  "ORGANIZATION_ADMIN" | "PROJECT_MANAGER_ESTIMATOR" | "FINANCIAL_REVIEWER" | "VIEWER";

export type Capability =
  | "project:read"
  | "project:create"
  | "project:update"
  | "project:compare"
  | "quote:read"
  | "quote:draft"
  | "quote:issue"
  | "commercial:forecast-read"
  | "commercial:actual-read"
  | "evidence:read"
  | "action:internal-review:propose"
  | "action:internal-review:create"
  | "action:assign"
  | "authority:financial-conflict:resolve"
  | "settings:manage"
  | "client:read"
  | "client:write"
  | "firm-lists:manage";

export type CapabilityGrantEffect = "ALLOW" | "DENY";

export type ProjectAssignmentGrant = Readonly<{
  projectId: string;
  canReadActuals: boolean;
  canCreateAction: boolean;
}>;

export type RuntimeContext = {
  identityKind?: "real" | "demo";
  /** Verified server-only session selector; never accepted from a request body. */
  sessionId?: string | undefined;
  requestId: string;
  userId: string;
  membershipId: string;
  organizationId: string;
  role: Role;
  capabilities: ReadonlySet<Capability>;
  assignedProjectIds?: ReadonlySet<string>;
  projectAssignments?: ReadonlyMap<string, ProjectAssignmentGrant>;
  locale: Locale;
  dataMode: DataMode;
  /** Current server-loaded tenant configuration; never accepted from a form or token. */
  firmLists?: FirmLists | undefined;
};

export interface IdentityContextPort {
  resolve(request: Request): Promise<RuntimeContext | null>;
}
