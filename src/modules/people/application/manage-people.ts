import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { canManagePeople, parsePeopleChange } from "@/modules/people/domain/policy";
import type { PeopleRepositoryPort } from "@/repositories/ports/people";
import type { SignInCounterPort } from "@/repositories/ports/sign-in-counter";
import type { SignInMailPort } from "@/repositories/ports/sign-in-mail";
import { EMAIL_LIMITS } from "@/modules/sign-in/domain/policy";
import { signInCounterKey } from "@/modules/sign-in/application/email-guard";
import { invitationMail } from "@/modules/sign-in/domain/mail";
/** Owner decision commits atomically; bounded notification delivery is a separate whole step. */
export class ManagePeople {
  constructor(
    private readonly repository: PeopleRepositoryPort,
    private readonly counter: SignInCounterPort,
    private readonly mail: SignInMailPort,
    private readonly settings: { secret: string; origin: string },
  ) {}
  async execute(context: RuntimeContext, value: unknown) {
    if (!canManagePeople(context)) return "DENIED";
    const input = parsePeopleChange(value);
    if (!input) return "INVALID";
    if (input.operation === "resend") {
      if (!(await this.repository.invitation(context, input.membershipId!))) return "DENIED";
      if (
        !(await this.counter.consume(
          signInCounterKey(this.settings.secret, "invitation", input.membershipId!),
          EMAIL_LIMITS.invitation,
        ))
      )
        return "LIMITED";
    }
    const result = await this.repository.change(context, input);
    if (result.kind !== "SUCCESS" || !result.sendInvitation) return result.kind;
    // Initial send starts the same resend budget; no immediate repeat after a timeout.
    if (
      input.operation === "invite" &&
      !(await this.counter.consume(
        signInCounterKey(this.settings.secret, "invitation", result.membershipId),
        EMAIL_LIMITS.invitation,
      ))
    )
      return "LIMITED";
    const invitation = await this.repository.invitation(context, result.membershipId);
    let sent = false;
    if (invitation) {
      try {
        await this.mail.send({
          to: invitation.email,
          ...invitationMail(invitation.locale, invitation.firm, this.settings.origin),
        });
        sent = true;
      } catch {
        /* The delivery receipt records failure without provider text or personal data. */
      }
    }
    await this.repository.recordDelivery(context, result.membershipId, input.idempotencyKey, sent);
    return sent ? "SUCCESS" : "MAIL_FAILED";
  }
}
