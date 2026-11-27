import { pageRoutes, pageDefects } from "../design/route-sweep";
import { randomBytes } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { workerRun } from "../database/worker";
import { assistantDatabase } from "../assistant/database-fixture";
import { issuedPrice, priceItem, priceJob, priceServices } from "../price-list/fixtures";
import { getPrismaClient } from "@/lib/server/prisma";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";

const suite = process.env.DATABASE_URL ? describe.sequential : describe.skip;
suite("private quote routes through a running Next HTTP server", () => {
  let server: ChildProcess | undefined;
  let origin: string;
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  let projectKey: string;
  let ownerCookie: string;
  let viewerCookie: string;
  let serverOutput = "";
  const secret = randomBytes(32).toString("base64url");
  beforeAll(async () => {
    if (!workerRun()) throw Error("MANAGED_LOCAL_DATABASE_REQUIRED");
    db = await assistantDatabase();
    const owner = await db.actor();
    const source = await priceJob(owner);
    await issuedPrice(owner, source, [priceItem()]);
    const job = await priceJob(owner);
    projectKey = job.projectKey;
    const saved = await priceServices().save.execute(owner, {
      projectKey,
      baseVersionId: null,
      preparationToken: null,
      idempotencyKey: crypto.randomUUID(),
      sections: [{ title: "Ceilings", categoryId: "DEMOLITION_CEILING", lines: [priceItem()] }],
      discount: { label: "", amount: "0" },
    });
    expect(saved.kind).toBe("SAVED");
    const sessions = new DemoSessionService(
      new PrismaDemoSessionRepository(getPrismaClient() as unknown as PrismaDemoSessionDatabase),
      secret,
    );
    ownerCookie = (await sessions.issueForMembership("membership_horizon_admin", {
      locale: "zh-TW",
      ttlSeconds: 3600,
    }))!.setCookie.split(";")[0]!;
    viewerCookie = (await sessions.issueForMembership("membership_horizon_viewer", {
      locale: "zh-TW",
      ttlSeconds: 3600,
    }))!.setCookie.split(";")[0]!;
    const socket = createServer();
    socket.listen(0, "127.0.0.1");
    await once(socket, "listening");
    const address = socket.address();
    if (!address || typeof address === "string") throw Error("PORT_REQUIRED");
    const port = address.port;
    await new Promise<void>((resolve, reject) =>
      socket.close((error) => (error ? reject(error) : resolve())),
    );
    // Next normalizes loopback request URLs to localhost; keep the configured origin identical.
    origin = `http://localhost:${port}`;
    server = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)],
      {
        cwd: process.cwd(),
        // Only synthetic credentials and the managed worker DB enter the child.
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          TMPDIR: process.env.TMPDIR,
          NODE_ENV: "development",
          NEXT_TELEMETRY_DISABLED: "1",
          DATABASE_URL: process.env.DATABASE_URL,
          STRIDEBRAIN_DATA_MODE: "DEMO_SYNTHETIC",
          NEXT_PUBLIC_STRIDEBRAIN_ENV: "preview",
          STRIDEBRAIN_AI_ENABLED: "false",
          STRIDEBRAIN_AI_PAID_TIER_CONFIRMED: "false",
          STRIDEBRAIN_APP_ORIGIN: origin,
          STRIDEBRAIN_DEMO_SESSION_SECRET: secret,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(Error(`NEXT_START_TIMEOUT\n${serverOutput}`)), 60_000);
      const read = (chunk: Buffer) => {
        serverOutput = (serverOutput + chunk.toString()).slice(-6000);
        if (serverOutput.includes("Ready in")) {
          clearTimeout(timer);
          resolve();
        }
      };
      server!.stdout!.on("data", read);
      server!.stderr!.on("data", read);
      server!.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      server!.once("exit", (code) => {
        clearTimeout(timer);
        reject(Error(`NEXT_EXIT_${code}\n${serverOutput}`));
      });
    });
  }, 90_000);
  afterAll(async () => {
    if (server && server.exitCode === null && server.signalCode === null) {
      const exited = once(server, "exit");
      server.kill("SIGTERM");
      const timer = setTimeout(() => server?.kill("SIGKILL"), 5000);
      await exited;
      clearTimeout(timer);
    }
    await db?.close();
  });
  it("sweeps every page as owner and Viewer in both languages over HTTP", async () => {
    const client = await getPrismaClient().client.findFirstOrThrow({
      where: { organizationId: "org_horizon" },
    });
    const defects: string[] = [];
    for (const [role, cookie] of [
      ["owner", ownerCookie],
      ["viewer", viewerCookie],
    ] as const) {
      for (const locale of ["en", "zh-TW"]) {
        for (const template of Object.values(pageRoutes).flat()) {
          const path = template.replace("{locale}", locale).replace("{client}", client.businessKey);
          const response = await fetch(`${origin}${path}`, {
            headers: { cookie, "user-agent": "Twitterbot" },
            signal: AbortSignal.timeout(60_000),
          });
          const html = await response.text();
          // This route denies the Viewer; it is not a page that role may open.
          if (role === "viewer" && path.endsWith("/quotes/prices")) {
            expect(html).not.toMatch(/NT\$[0-9]/);
            continue;
          }
          const denied = role === "viewer" && /\/clients(?:\/|$)/.test(path);
          if (path.endsWith("/nothing-here") || denied) {
            expect(response.status, path).toBe(404);
            continue;
          }
          expect(response.status, `${role} ${path}`).toBe(200);
          for (const defect of pageDefects(html)) defects.push(`${role} ${path}: ${defect}`);
        }
      }
    }
    console.info("SB077_ROUTE_SWEEP", JSON.stringify(defects));
    expect(defects).toEqual([]);
  }, 240_000);
  it("returns the same 404 for unknown, unassigned and other-organization overview addresses", async () => {
    const otherJob = await getPrismaClient().project.findFirstOrThrow({
      where: { organizationId: { not: "org_horizon" } },
    });
    const otherClient = await getPrismaClient().client.findFirstOrThrow({
      where: { organizationId: { not: "org_horizon" } },
    });
    for (const locale of ["en", "zh-TW"]) {
      for (const [path, cookie] of [
        [`/${locale}/projects/NO-SUCH-JOB`, ownerCookie],
        [`/${locale}/projects/${otherJob.businessKey}`, ownerCookie],
        [`/${locale}/projects/PRJ-ACTIVE-003`, viewerCookie],
        [`/${locale}/clients/NO-SUCH-CLIENT`, ownerCookie],
        [`/${locale}/clients/${otherClient.businessKey}`, ownerCookie],
      ]) {
        const response = await fetch(`${origin}${path}`, {
          headers: { cookie: cookie!, "user-agent": "Twitterbot" },
          signal: AbortSignal.timeout(60_000),
        });
        expect(response.status, path).toBe(404);
        const html = await response.text();
        const visible = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]*>/g, "");
        expect(visible).not.toContain(path!.split("/").at(-1));
      }
    }
  }, 90_000);
  const comparison = (cookie = ownerCookie, body?: string) =>
    fetch(`${origin}/api/projects/${projectKey}/quote-comparison?locale=zh-TW`, {
      method: "POST",
      headers: { origin, cookie },
      ...(body === undefined ? {} : { body }),
      signal: AbortSignal.timeout(60_000),
    });
  const prices = (cookie = ownerCookie) =>
    fetch(`${origin}/api/quotes/prices`, {
      method: "POST",
      headers: {
        origin,
        cookie,
        "content-type": "application/json",
        "x-stridebrain-price-read": "1",
      },
      body: JSON.stringify({
        locale: "zh-TW",
        mode: "SUGGEST",
        search: "天花",
        unit: "",
        page: 1,
        projectKey,
      }),
      signal: AbortSignal.timeout(60_000),
    });
  it("Run and Refresh accept empty HTTP POSTs, persist audited results, and GET does not write", async () => {
    const prisma = getPrismaClient();
    const before = await prisma.comparisonRun.count();
    for (const body of [undefined, ""]) {
      const response = await comparison(ownerCookie, body);
      expect(response.status, serverOutput).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      const result = await response.json();
      expect(result.kind).toBe("CURRENT");
      expect(result.jobs).toHaveLength(3);
    }
    expect(await prisma.comparisonRun.count()).toBe(before + 2);
    const runs = await prisma.comparisonRun.findMany({
      where: { activeProject: { businessKey: projectKey } },
      select: { id: true },
    });
    expect(
      await prisma.auditEvent.count({
        where: { comparisonRunId: { in: runs.map((run) => run.id) } },
      }),
    ).toBeGreaterThanOrEqual(2);
    const start = performance.now();
    const read = await fetch(`${origin}/api/projects/${projectKey}/quote-comparison?locale=zh-TW`, {
      headers: { cookie: ownerCookie },
      signal: AbortSignal.timeout(60_000),
    });
    expect((await read.json()).kind).toBe("CURRENT");
    console.info(`QUOTE_PANEL_WARM_HTTP_GET_MS=${(performance.now() - start).toFixed(2)}`);
    expect(await prisma.comparisonRun.count()).toBe(before + 2);
    expect((await comparison(ownerCookie, " ")).status).toBe(404);
    expect(await prisma.comparisonRun.count()).toBe(before + 2);
  }, 90_000);
  it("price suggestions traverse Next, authentication and the real read repository", async () => {
    const response = await prices();
    expect(response.status, serverOutput).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const result = await response.json();
    expect(result.kind).toBe("AVAILABLE");
    expect(
      result.rows.some(
        (row: { description: string; unitPrice: string }) =>
          row.description === "天花板" && row.unitPrice === "3500",
      ),
    ).toBe(true);
  }, 90_000);
  it("both HTTP routes deny a Viewer and an anonymous caller without creating a run", async () => {
    const before = await getPrismaClient().comparisonRun.count();
    for (const cookie of [viewerCookie, ""]) {
      for (const request of [comparison, prices]) {
        const response = await request(cookie);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ kind: "UNAVAILABLE" });
      }
    }
    expect(await getPrismaClient().comparisonRun.count()).toBe(before);
  }, 30_000);
});
