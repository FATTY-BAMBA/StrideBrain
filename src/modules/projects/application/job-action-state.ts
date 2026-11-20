import type { JobErrors } from "@/modules/projects/domain/job-input";
export type JobActionState = Readonly<{
  message?: "validation" | "unavailable" | "failed" | "conflict" | "updated";
  errors?: JobErrors;
}>;
