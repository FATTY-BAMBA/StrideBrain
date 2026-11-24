import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { setTimeout } from "node:timers/promises";
import { Client } from "pg";
import { expect } from "vitest";
async function wait(path: string) {
  const deadline = Date.now() + 15000;
  while (!existsSync(path)) {
    if (Date.now() > deadline) throw new Error("ISOLATION_PROBE_BARRIER_TIMEOUT");
    await setTimeout(20);
  }
}
export async function rowProbe(label: "a" | "b") {
  const directory = process.env.SB_TEST_PROBE_DIR!;
  const sql = new Client({ connectionString: process.env.DATABASE_URL });
  await sql.connect();
  const read = async () =>
    (await sql.query('SELECT "nameEn" FROM "Project" WHERE id=$1', ["prj_xinyi_026"])).rows[0]
      .nameEn as string;
  try {
    expect(await read(), "ISOLATION_SEEDED_STATE").toBe("Xinyi Flagship Renovation");
    const database = (await sql.query("SELECT current_database() AS name")).rows[0].name;
    const mode = process.env.SB_TEST_PROBE_MODE;
    if (mode === "parallel" || mode === "shared") {
      writeFileSync(`${directory}/${label}-ready`, "ready");
      await wait(`${directory}/${label === "a" ? "b" : "a"}-ready`);
      if (label === "b") await wait(`${directory}/a-wrote`);
    }
    await sql.query('UPDATE "Project" SET "nameEn"=$1 WHERE id=$2', [
      `isolation-${label}`,
      "prj_xinyi_026",
    ]);
    writeFileSync(`${directory}/${label}-wrote`, "wrote");
    if (mode === "parallel" || mode === "shared") await wait(`${directory}/b-wrote`);
    const observed = await read();
    appendFileSync(
      `${directory}/observations.jsonl`,
      JSON.stringify({ label, database, worker: process.env.VITEST_POOL_ID, observed }) + "\n",
    );
    expect(observed, "ISOLATION_SAME_ROW").toBe(`isolation-${label}`);
    // Deliberately leave the mutation in place: the next file must get the template again.
  } finally {
    await sql.end();
  }
}
