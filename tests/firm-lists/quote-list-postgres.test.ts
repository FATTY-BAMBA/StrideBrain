import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assistantDatabase } from "../assistant/database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaQuoteListRepository } from "@/repositories/prisma/prisma-quote-list-repository";
import { PrismaClientJobsRepository } from "@/repositories/prisma/prisma-client-jobs-repository";
import { ListQuotes } from "@/modules/quotes/application/list-quotes";
import { GetClientJobs } from "@/modules/clients/application/get-client-jobs";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("Quotes and client jobs access", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  const quotes = () => new ListQuotes(new PrismaQuoteListRepository(getPrismaClient()));
  const jobs = () => new GetClientJobs(new PrismaClientJobsRepository(getPrismaClient()));
  it("selects one current version, keeps issued total and filters the selected status", async () => {
    await db.sql.query(
      `UPDATE "QuoteVersion" SET status='ISSUED',"documentNumber"='SB066-Q-001',"issuedAt"=TIMESTAMP '2026-11-24',"issuedByMembershipId"='membership_horizon_admin',"validUntil"=DATE '2026-12-24',"documentSnapshot"='{}'::jsonb,"approvedAt"=NOW(),"authorityState"='APPROVED_COMMERCIAL' WHERE id='qv_xinyi_026_v3'`,
    );
    await db.sql.query(
      `INSERT INTO "QuoteVersion" (id,"organizationId","quoteId","versionNumber",status,"authorityState",currency,"amountBeforeTax","taxAmount","totalAmount") VALUES ('sb066-revision','org_horizon','quote_prj_xinyi_026',4,'DRAFT','HUMAN_REVIEWED','TWD',1,0.05,1.05)`,
    );
    const result = await quotes().execute(await db.actor(), { status: "ISSUED", page: 1 });
    expect(result.kind).toBe("AVAILABLE");
    if (result.kind !== "AVAILABLE") return;
    expect(result.rows.filter((r) => r.projectKey === "PRJ-XINYI-026")).toEqual([
      expect.objectContaining({
        documentNumber: "SB066-Q-001",
        status: "ISSUED",
        totalAmount: "17304000.00",
        revisionInDraft: true,
      }),
    ]);
    const draft = await quotes().execute(await db.actor(), { status: "DRAFT", page: 1 });
    expect(draft.kind).toBe("AVAILABLE");
    if (draft.kind === "AVAILABLE")
      expect(draft.rows.some((r) => r.projectKey === "PRJ-XINYI-026")).toBe(false);
  });
  it("lists client jobs and quotes only within the member's readable jobs", async () => {
    const c = await db.actor("membership_horizon_mei");
    const result = await jobs().execute(c, "CLIENT-01");
    expect(result.kind).toBe("AVAILABLE");
    if (result.kind !== "AVAILABLE") return;
    expect(result.jobs.length).toBeGreaterThan(0);
    const allowed = (
      await db.sql.query('SELECT "businessKey" FROM "Project" WHERE id=ANY($1)', [
        [...c.assignedProjectIds!],
      ])
    ).rows.map((r) => r.businessKey);
    expect(result.jobs.every((r) => allowed.includes(r.businessKey))).toBe(true);
    const q = await quotes().execute(c, { status: null, page: 1, clientKey: "CLIENT-01" });
    expect(q.kind).toBe("AVAILABLE");
    if (q.kind === "AVAILABLE")
      expect(q.rows.every((r) => allowed.includes(r.projectKey))).toBe(true);
  });
  it("Viewer gets no amounts and cannot open client history; foreign context is refused", async () => {
    const viewer = await db.actor("membership_horizon_viewer");
    const result = await quotes().execute(viewer, { status: null, page: 1 });
    expect(result.kind).toBe("AVAILABLE");
    if (result.kind !== "AVAILABLE") return;
    expect(result.rows.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toMatch(/totalAmount|17304000/);
    expect(await jobs().execute(viewer, "CLIENT-01")).toEqual({ kind: "UNAVAILABLE" });
    const foreign = { ...(await db.actor()), organizationId: "org_northern" };
    expect(await quotes().execute(foreign, { status: null, page: 1 })).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(await jobs().execute(foreign, "CLIENT-01")).toEqual({ kind: "UNAVAILABLE" });
    expect(await jobs().execute(await db.actor(), "UNKNOWN-CLIENT")).toEqual({
      kind: "UNAVAILABLE",
    });
  });
});
