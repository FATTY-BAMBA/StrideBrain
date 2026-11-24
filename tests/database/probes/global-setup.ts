import type { TestProject } from "vitest/node";
import { createRun, cleanupRun, cloneDatabase, workerName } from "../lifecycle";
export default async function setup(project: TestProject) {
  const run = await createRun(process.env.DATABASE_URL!);
  project.provide("databaseRun", run);
  try {
    if (process.env.SB_TEST_PROBE_MODE === "shared" || process.env.SB_TEST_PROBE_MODE === "sticky")
      await cloneDatabase(run, workerName(run, "1"), run.template);
  } catch (error) {
    await cleanupRun(run);
    throw error;
  }
  return async () => {
    await cleanupRun(run);
  };
}
