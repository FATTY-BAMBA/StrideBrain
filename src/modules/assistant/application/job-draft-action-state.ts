import type { ProjectClientOption } from "@/modules/projects/application/list-project-clients";
import type { DraftJobOutcome } from "./draft-job";
export type JobDraftFormSeed = Readonly<{
  businessKey: string;
  idempotencyKey: string;
  clients: readonly ProjectClientOption[];
}>;
export type JobDraftActionState = Readonly<{ outcome: DraftJobOutcome; form?: JobDraftFormSeed }>;
