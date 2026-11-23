import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { assistantDatabase } from "../assistant/database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaClientRepository } from "@/repositories/prisma/prisma-client-repository";
import {
  GetClient,
  ListClients,
  UpdateClient,
} from "@/modules/clients/application/client-services";
import {
  CLIENT_DETAIL_FIELDS,
  type UpdateClientInput,
} from "@/modules/clients/domain/client-input";
import type { PrismaClient } from "../../.generated/prisma/client";
import { jobContext } from "../projects/job-fixture";
import { roleBundle } from "@/modules/runtime-context/capabilities";

const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("client records in PostgreSQL", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  const repository = () => new PrismaClientRepository(getPrismaClient());
  async function input(): Promise<UpdateClientInput> {
    const row = await repository().get(await db.actor(), "CLIENT-01");
    if (!row) throw new Error("CLIENT_REQUIRED");
    return {
      ...(Object.fromEntries(CLIENT_DETAIL_FIELDS.map((key) => [key, row[key]])) as Pick<
        UpdateClientInput,
        (typeof CLIENT_DETAIL_FIELDS)[number]
      >),
      businessKey: row.businessKey,
      expectedUpdatedAt: row.updatedAt,
      idempotencyKey: randomUUID(),
    };
  }
  it("allows owner and manager to change details, finance to read, and searches both names", async () => {
    for (const membership of ["membership_horizon_admin", "membership_horizon_mei"]) {
      const context = await db.actor(membership);
      const saved = await new UpdateClient(repository()).execute(context, {
        ...(await input()),
        nameEn: "Synthetic searchable client",
        nameZhTw: "合成可搜尋客戶",
        contactPerson: "Test contact",
        taxId: "12345678",
      });
      expect(saved.kind).toBe("SAVED");
    }
    const finance = await db.actor("membership_horizon_finance");
    const read = await new GetClient(repository()).execute(finance, "CLIENT-01");
    expect(read).toMatchObject({
      kind: "AVAILABLE",
      canEdit: false,
      client: { taxId: "12345678", contactPerson: "Test contact" },
    });
    for (const search of ["SEARCHABLE", "可搜尋"]) {
      const list = await new ListClients(repository()).execute(finance, { search, page: 1 });
      expect(list).toMatchObject({ kind: "AVAILABLE", clients: [{ businessKey: "CLIENT-01" }] });
      expect(JSON.stringify(list)).not.toContain("contactPerson");
    }
    expect(await new UpdateClient(repository()).execute(finance, await input())).toEqual({
      kind: "UNAVAILABLE",
    });
  });
  it("rejects Viewer and foreign client keys, and never trusts a foreign membership", async () => {
    const viewer = await db.actor("membership_horizon_viewer"),
      owner = await db.actor();
    expect(await repository().get(viewer, "CLIENT-01")).toBeNull();
    expect(await repository().list(viewer, { search: "", page: 1 })).toBeNull();
    expect(await repository().updateWithAudit(viewer, await input())).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(await new GetClient(repository()).execute(owner, "CLIENT-NORTH-01")).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(
      await new UpdateClient(repository()).execute(owner, {
        ...(await input()),
        businessKey: "CLIENT-NORTH-01",
      }),
    ).toEqual({ kind: "UNAVAILABLE" });
    expect(
      await repository().get({ ...owner, organizationId: "org_northern" }, "CLIENT-NORTH-01"),
    ).toBeNull();
    expect(
      await repository().list({ ...owner, userId: "someone-else" }, { search: "", page: 1 }),
    ).toBeNull();
  });
  it("replays identical retries, rejects changed retries/stale edits and audits field names only", async () => {
    const owner = await db.actor(),
      value = {
        ...(await input()),
        phone: "02-9876-5432",
        email: "private@example.test",
        note: "Private contact note",
      };
    const saved = await repository().updateWithAudit(owner, value);
    expect(saved.kind).toBe("SAVED");
    expect(await repository().updateWithAudit(owner, value)).toEqual(saved);
    expect(await repository().updateWithAudit(owner, { ...value, phone: "different" })).toEqual({
      kind: "CONFLICT",
    });
    expect(
      await repository().updateWithAudit(owner, { ...value, idempotencyKey: randomUUID() }),
    ).toEqual({ kind: "CHANGED" });
    const events = await db.sql.query('SELECT * FROM "AuditEvent" WHERE "idempotencyKey"=$1', [
      value.idempotencyKey,
    ]);
    expect(events.rowCount).toBe(1);
    expect(events.rows[0].payload.changedFields).toEqual(["phone", "email", "note"]);
    for (const secret of [value.phone, value.email, value.note])
      expect(JSON.stringify(events.rows)).not.toContain(secret);
  });
  it("rolls back the client update if its audit cannot be saved", async () => {
    const owner = await db.actor(),
      before = await repository().get(owner, "CLIENT-01");
    await db.sql.query(
      `CREATE FUNCTION reject_client_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."eventType" = 'CLIENT_UPDATED' THEN RAISE EXCEPTION 'TEST_AUDIT_FAILURE'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_client_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION reject_client_audit()`,
    );
    try {
      expect(
        await new UpdateClient(repository()).execute(owner, {
          ...(await input()),
          contactPerson: "Must roll back",
        }),
      ).toEqual({ kind: "FAILED" });
      expect(await repository().get(owner, "CLIENT-01")).toEqual(before);
    } finally {
      await db.sql.query(
        'DROP TRIGGER reject_client_audit ON "AuditEvent"; DROP FUNCTION reject_client_audit()',
      );
    }
  });
});

it("repository capability denial happens before any database read", async () => {
  const findFirst = vi.fn(),
    findMany = vi.fn(),
    transaction = vi.fn();
  const repo = new PrismaClientRepository({
    membership: { findFirst },
    client: { findFirst, findMany },
    $transaction: transaction,
  } as unknown as PrismaClient);
  const viewer = jobContext({ capabilities: roleBundle("VIEWER"), role: "VIEWER" });
  expect(await repo.get(viewer, "CLIENT-01")).toBeNull();
  expect(await repo.list(viewer, { search: "", page: 1 })).toBeNull();
  expect(findFirst).not.toHaveBeenCalled();
  expect(findMany).not.toHaveBeenCalled();
  expect(transaction).not.toHaveBeenCalled();
});
