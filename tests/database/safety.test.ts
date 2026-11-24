import { describe, expect, it } from "vitest";
import { localDatabaseUrl, ownedName, workerName, fixturePaths } from "./lifecycle";
const run = {
  adminUrl: "postgresql://test@localhost/test",
  prefix: "sb_test_0123456789abcdef_",
  template: "sb_test_0123456789abcdef_template",
};
describe("test database boundaries", () => {
  it.each(["localhost", "127.0.0.1", "[::1]"])("allows local server %s", (host) => {
    expect(
      new URL(localDatabaseUrl(`postgresql://test@${host}/existing?schema=public`, false)).hostname,
    ).toBe(host);
  });
  it("allows the CI service only in CI", () => {
    expect(() => localDatabaseUrl("postgresql://test@postgres/existing", false)).toThrow(
      "LOCAL_SERVER_REQUIRED",
    );
    expect(localDatabaseUrl("postgresql://test@postgres/existing", true)).toContain("@postgres/");
  });
  it.each([
    "postgresql://test@hosted.example/db",
    "postgresql://test@localhost.evil/db",
    "https://localhost/db",
    "postgresql://test@localhost/db?host=hosted.example",
    "postgresql://test@localhost/db?hostaddr=1.2.3.4",
    "postgresql://test@localhost/db?service=hosted",
    "postgresql://test@localhost/db?sslmode=require",
  ])("refuses remote or overridden routing %s", (url) => {
    expect(() => localDatabaseUrl(url, false)).toThrow("LOCAL_SERVER_REQUIRED");
  });
  it("restricts database names to this run and rejects SQL or another run", () => {
    expect(workerName(run, "2")).toBe(`${run.prefix}worker_2`);
    for (const name of [
      "stridebrain",
      "template0",
      `${run.prefix}worker_1"; DROP DATABASE stridebrain;--`,
      "sb_test_ffffffffffffffff_worker_1",
    ])
      expect(() => ownedName(run, name)).toThrow("OWNED_NAME_REQUIRED");
    expect(() => workerName(run, "../1")).toThrow("WORKER_REQUIRED");
  });
  it("uses the application fixture order and all existing invariant scripts", () => {
    expect(fixturePaths("db:seed")[0]).toBe("prisma/fixtures/horizon-atelier.sql");
    expect(fixturePaths("db:verify")).toContain("prisma/fixtures/verify-firm-lists.sql");
  });
});
