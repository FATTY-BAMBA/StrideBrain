import { describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { validateClientUpdate, validateClientSearch } from "@/modules/clients/domain/client-input";
import {
  GetClient,
  ListClients,
  UpdateClient,
} from "@/modules/clients/application/client-services";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import { jobContext } from "../projects/job-fixture";

export const clientInput = () => ({
  businessKey: "CLIENT-01",
  nameEn: "Synthetic client",
  nameZhTw: "合成客戶",
  clientType: "RETAIL",
  contactPerson: "Sample contact",
  phone: "02-1234-5678",
  email: "sample@example.test",
  address: "Synthetic address",
  taxId: "12345678",
  note: "Sample note\nSecond line",
  expectedUpdatedAt: "2026-11-24T00:00:00.000Z",
  idempotencyKey: randomUUID(),
});

describe("client details and access", () => {
  it("allows optional details and bounds and validates all fields", () => {
    expect(validateClientUpdate(clientInput(), jobContext().firmLists!.clientTypes).kind).toBe(
      "VALID",
    );
    expect(
      validateClientUpdate(
        { ...clientInput(), taxId: "", email: "" },
        jobContext().firmLists!.clientTypes,
      ).kind,
    ).toBe("VALID");
    for (const invalid of [
      { taxId: "1234567" },
      { taxId: "１２３４５６７８" },
      { phone: "x".repeat(81) },
      { note: "x".repeat(4001) },
      { contactPerson: "a\nb" },
      { email: "wrong" },
      { nameEn: "" },
      { clientType: "OTHER" },
      { organizationId: "foreign" },
      { expectedUpdatedAt: "tomorrow" },
      { idempotencyKey: "not-a-key" },
    ])
      expect(
        validateClientUpdate({ ...clientInput(), ...invalid }, jobContext().firmLists!.clientTypes)
          .kind,
      ).toBe("INVALID");
    expect(validateClientSearch({ search: " x ", page: 1 })).toEqual({ search: "x", page: 1 });
    for (const input of [
      { search: "", page: 0 },
      { search: "x".repeat(101), page: 1 },
      { search: "", page: 1, organizationId: "foreign" },
    ])
      expect(validateClientSearch(input)).toBeNull();
  });
  it("denies Viewer before any repository call and finance before writes", async () => {
    const repository = { get: vi.fn(), list: vi.fn(), updateWithAudit: vi.fn() };
    const viewer = jobContext({ role: "VIEWER", capabilities: roleBundle("VIEWER") });
    expect(await new GetClient(repository).execute(viewer, "CLIENT-01")).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(await new ListClients(repository).execute(viewer, { search: "", page: 1 })).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(await new UpdateClient(repository).execute(viewer, clientInput())).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(
      await new UpdateClient(repository).execute(
        jobContext({ role: "FINANCIAL_REVIEWER", capabilities: roleBundle("FINANCIAL_REVIEWER") }),
        clientInput(),
      ),
    ).toEqual({ kind: "UNAVAILABLE" });
    Object.values(repository).forEach((method) => expect(method).not.toHaveBeenCalled());
  });
  it("contains failures without returning database text", async () => {
    const repository = {
      get: vi.fn().mockRejectedValue(new Error("private")),
      list: vi.fn().mockRejectedValue(new Error("private")),
      updateWithAudit: vi.fn().mockRejectedValue(new Error("private")),
    };
    expect(await new GetClient(repository).execute(jobContext(), "CLIENT-01")).toEqual({
      kind: "FAILED",
    });
    expect(
      await new ListClients(repository).execute(jobContext(), { search: "", page: 1 }),
    ).toEqual({ kind: "FAILED" });
    expect(await new UpdateClient(repository).execute(jobContext(), clientInput())).toEqual({
      kind: "FAILED",
    });
  });
});
