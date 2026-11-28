import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { PeopleChange } from "@/modules/people/domain/policy";
export type PeopleOutcome =
  | { kind: "SUCCESS"; membershipId: string; sendInvitation: boolean }
  | { kind: "DENIED" | "INVALID" | "LAST_OWNER" | "SELF_DEACTIVATION" | "DUPLICATE" };
export interface PeopleRepositoryPort {
  invitationDay(context: RuntimeContext): Promise<string>;
  invitation(
    context: RuntimeContext,
    membershipId: string,
  ): Promise<{ email: string; locale: "en" | "zh-TW"; firm: string } | null>;
  recordDelivery(
    context: RuntimeContext,
    membershipId: string,
    idempotencyKey: string,
    sent: boolean,
  ): Promise<void>;
  change(context: RuntimeContext, change: PeopleChange): Promise<PeopleOutcome>;
}
