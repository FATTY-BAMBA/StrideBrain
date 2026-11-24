import { afterAll, inject } from "vitest";
import { disconnectWorkerPrisma, resetWorkerDatabase } from "./worker";
const run = inject("databaseRun");
if (run) {
  process.env.STRIDEBRAIN_TEST_DATABASE_RUN = JSON.stringify(run);
  await resetWorkerDatabase();
  afterAll(async () => {
    await disconnectWorkerPrisma();
  });
}
