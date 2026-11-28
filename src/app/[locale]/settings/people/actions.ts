"use server";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createPeopleServices } from "@/lib/server/people-services";
export async function changePerson(value: unknown) {
  try {
    const context = await resolveServerRuntimeContext();
    if (!context) return "DENIED";
    return await createPeopleServices().change.execute(context, value);
  } catch {
    return "UNAVAILABLE";
  }
}
