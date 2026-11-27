import type { PrismaClient } from "../../../.generated/prisma/client";
import type { SignInCounterPort } from "@/repositories/ports/sign-in-counter";

/** Both windows are decided in one atomic UPSERT; cleanup excludes the current key. */
export class PrismaSignInCounter implements SignInCounterPort {
  constructor(private readonly db: PrismaClient) {}
  async consume(key: string, limits: { shortSeconds: number; shortMax: number; dayMax: number }) {
    const rows = await this.db.$queryRaw<{ key: string }[]>`
      WITH cleanup AS (
        DELETE FROM "SignInCounter" WHERE "expiresAt" < CURRENT_TIMESTAMP AND "key" <> ${key}
      )
      INSERT INTO "SignInCounter" ("key", "shortStartedAt", "shortCount", "dayStartedAt", "dayCount", "expiresAt")
      VALUES (${key}, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP + interval '24 hours')
      ON CONFLICT ("key") DO UPDATE SET
        "shortCount" = CASE WHEN "SignInCounter"."shortStartedAt" + ${limits.shortSeconds} * interval '1 second' <= CURRENT_TIMESTAMP THEN 1 ELSE "SignInCounter"."shortCount" + 1 END,
        "shortStartedAt" = CASE WHEN "SignInCounter"."shortStartedAt" + ${limits.shortSeconds} * interval '1 second' <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP ELSE "SignInCounter"."shortStartedAt" END,
        "dayCount" = CASE WHEN "SignInCounter"."dayStartedAt" + interval '24 hours' <= CURRENT_TIMESTAMP THEN 1 ELSE "SignInCounter"."dayCount" + 1 END,
        "dayStartedAt" = CASE WHEN "SignInCounter"."dayStartedAt" + interval '24 hours' <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP ELSE "SignInCounter"."dayStartedAt" END,
        "expiresAt" = CURRENT_TIMESTAMP + interval '24 hours'
      WHERE ("SignInCounter"."shortStartedAt" + ${limits.shortSeconds} * interval '1 second' <= CURRENT_TIMESTAMP OR "SignInCounter"."shortCount" < ${limits.shortMax})
        AND ("SignInCounter"."dayStartedAt" + interval '24 hours' <= CURRENT_TIMESTAMP OR "SignInCounter"."dayCount" < ${limits.dayMax})
      RETURNING "key"`;
    return rows.length === 1;
  }
}
