import "server-only";
import { after } from "next/server";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { PrismaAssistantRepository } from "@/repositories/prisma/prisma-assistant-repository";
import { getPrismaClient } from "./prisma";

/** after runs once the response finishes; the timing write cannot delay that response. */
export function scheduleAssistantTurnTiming(context: RuntimeContext, startedAt: Date) {
  after(async () => {
    const completedAt = new Date();
    try {
      await new PrismaAssistantRepository(getPrismaClient()).recordTurnTiming(
        context,
        startedAt,
        completedAt,
      );
    } catch {
      console.warn(
        JSON.stringify({ event: "ASSISTANT_TIMING_UNAVAILABLE", requestId: context.requestId }),
      );
    }
  });
}
