import type { TestProject } from "vitest/node";
import { createRun, cleanupRun, type DatabaseRun } from "./lifecycle";
export default async function setup(project: TestProject) {
  if (!process.env.DATABASE_URL) return;
  const started = performance.now();
  const run = await createRun(process.env.DATABASE_URL);
  project.provide("databaseRun", run);
  console.info(`TEST_DATABASE_TEMPLATE_MS=${Math.round(performance.now() - started)}`);
  return async () => {
    await cleanupRun(run);
  };
}
declare module "vitest" {
  export interface ProvidedContext {
    databaseRun?: DatabaseRun;
  }
}
