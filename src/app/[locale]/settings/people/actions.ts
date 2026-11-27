"use server";
import { randomUUID } from "node:crypto";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { getPrismaClient } from "@/lib/server/prisma";
import { ChangePeople } from "@/modules/people/application/change-people";
import { canManagePeople, parsePeopleChange } from "@/modules/people/domain/policy";
import { PrismaPeople } from "@/repositories/prisma/prisma-people";
import { PrismaSignInCounter } from "@/repositories/prisma/prisma-sign-in-counter";
import { EMAIL_LIMITS } from "@/modules/sign-in/domain/policy";
import { signInCounterKey } from "@/modules/sign-in/application/email-guard";
import { realSignInSettings } from "@/lib/env/sign-in";
import { ResendSignInMail } from "@/modules/sign-in/infrastructure/resend-mail";
import { invitationMail } from "@/modules/sign-in/domain/mail";
export async function changePerson(value: unknown) {
  try {
    const context = await resolveServerRuntimeContext();
    if (!context || !canManagePeople(context)) return "DENIED";
    const input = parsePeopleChange(value);
    if (!input) return "INVALID";
    const settings = realSignInSettings(process.env);
    const db = getPrismaClient();
    const repository = new PrismaPeople(db);
    if (input.operation === "resend") {
      if (!(await repository.invitation(context, input.membershipId!))) return "DENIED";
      if (
        !(await new PrismaSignInCounter(db).consume(
          signInCounterKey(settings.secret, "invitation", input.membershipId!),
          EMAIL_LIMITS.invitation,
        ))
      )
        return "LIMITED";
    }
    const result = await new ChangePeople(repository).execute(
      { ...context, requestId: randomUUID() },
      input,
    );
    if (result.kind !== "SUCCESS" || !result.sendInvitation) return result.kind;
    const invitation = await repository.invitation(context, result.membershipId);
    if (!invitation?.person.email) return "MAIL_FAILED";
    try {
      await new ResendSignInMail(settings.resendKey, settings.sender, settings.replyTo).send({
        to: invitation.person.email,
        ...invitationMail(
          invitation.organization.primaryLocale === "en" ? "en" : "zh-TW",
          invitation.organization.primaryLocale === "en"
            ? invitation.organization.nameEn
            : invitation.organization.nameZhTw,
          settings.origin,
        ),
      });
    } catch {
      return "MAIL_FAILED";
    }
    return "SUCCESS";
  } catch {
    return "UNAVAILABLE";
  }
}
