import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { PeopleChange } from "@/modules/people/domain/policy";
export type PeopleOutcome =
  | { kind: "SUCCESS"; membershipId: string; sendInvitation: boolean }
  | { kind: "DENIED" | "INVALID" | "LAST_OWNER" | "SELF_DEACTIVATION" | "DUPLICATE" };
export interface PeopleRepositoryPort {
  change(context: RuntimeContext, change: PeopleChange): Promise<PeopleOutcome>;
}
