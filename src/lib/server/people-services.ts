import { getPrismaClient } from "./prisma";
import { PrismaPeople } from "@/repositories/prisma/prisma-people";
import { PrismaSignInCounter } from "@/repositories/prisma/prisma-sign-in-counter";
import { realSignInSettings } from "@/lib/env/sign-in";
import { ResendSignInMail } from "@/modules/sign-in/infrastructure/resend-mail";
import { ManagePeople } from "@/modules/people/application/manage-people";
export function createPeopleServices() {
  const settings = realSignInSettings(process.env),
    db = getPrismaClient();
  const repository = new PrismaPeople(db);
  return {
    read: repository.read.bind(repository),
    change: new ManagePeople(
      repository,
      new PrismaSignInCounter(db),
      new ResendSignInMail(settings.resendKey, settings.sender, settings.replyTo),
      settings,
    ),
  };
}
