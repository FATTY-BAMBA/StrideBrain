import type { Locale } from "@/modules/localization/config";

export type DataMode = "DEMO_SYNTHETIC" | "TENANT_PRIVATE";

export type Role =
  "ORGANIZATION_ADMIN" | "PROJECT_MANAGER_ESTIMATOR" | "FINANCIAL_REVIEWER" | "VIEWER";

export type Capability =
  | "project:read"
  | "project:compare"
  | "quote:read"
  | "commercial:forecast-read"
  | "commercial:actual-read"
  | "evidence:read"
  | "action:internal-review:propose"
  | "action:internal-review:create"
  | "action:assign"
  | "settings:manage";

export type RuntimeContext = {
  requestId: string;
  userId: string;
  membershipId: string;
  organizationId: string;
  role: Role;
  capabilities: ReadonlySet<Capability>;
  assignedProjectIds?: ReadonlySet<string>;
  locale: Locale;
  dataMode: DataMode;
};

export interface IdentityContextPort {
  resolve(request: Request): Promise<RuntimeContext | null>;
}
