// Negative control only: both files deliberately get one database with no per-file reset.
import { inject } from "vitest";
import { databaseUrl, workerName } from "../lifecycle";
const run = inject("databaseRun")!;
process.env.DATABASE_URL = databaseUrl(run, workerName(run, "1"));
