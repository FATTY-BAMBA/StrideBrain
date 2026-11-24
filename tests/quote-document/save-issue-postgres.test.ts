import { createComparisonServices } from "@/lib/server/comparison-services";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "../assistant/database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { CreateProject } from "@/modules/projects/application/create-project";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { PrismaQuoteIssueRepository } from "@/repositories/prisma/prisma-quote-issue-repository";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { SignedQuoteIssueCodec } from "@/modules/quote-issue/application/issue-codec";
import { SaveQuoteDraft } from "@/modules/quote-draft/application/save-quote-draft";
import { GetQuoteDraft } from "@/modules/quote-draft/application/get-quote-draft";
import { PreviewQuoteTotals } from "@/modules/quote-draft/application/preview-quote-totals";
import {
  GetQuoteDocument,
  GetQuoteIssue,
  IssueQuote,
  PrepareQuoteIssue,
  ReviseIssuedQuote,
} from "@/modules/quote-issue/application/issue-services";
import { ProjectSiteAddress } from "@/modules/projects/application/project-site-address";
import { PrismaProjectSiteAddressRepository } from "@/repositories/prisma/prisma-project-site-address-repository";
import { jobInput } from "../projects/job-fixture";
import type { QuoteDocumentDraft } from "@/modules/quote-draft/domain/document-input";
const suite = process.env.DATABASE_URL ? describe.sequential : describe.skip;
let db: Awaited<ReturnType<typeof assistantDatabase>>;
beforeAll(async () => {
  if (process.env.DATABASE_URL) db = await assistantDatabase();
});
afterAll(async () => {
  await db?.close();
});
function services() {
  const draft = new PrismaQuoteDraftRepository(getPrismaClient());
  const issue = new PrismaQuoteIssueRepository(getPrismaClient());
  const secret = "quote-document-synthetic-test-signing-secret";
  const codec = new SignedQuoteIssueCodec(secret);
  return {
    save: new SaveQuoteDraft(draft, new SignedDraftPreparationCodec(secret)),
    read: new GetQuoteDraft(draft),
    totals: new PreviewQuoteTotals(draft),
    prepare: new PrepareQuoteIssue(issue, codec),
    issue: new IssueQuote(issue, codec),
    revise: new ReviseIssuedQuote(issue),
    document: new GetQuoteDocument(issue),
    issueView: new GetQuoteIssue(issue),
    address: new ProjectSiteAddress(new PrismaProjectSiteAddressRepository(getPrismaClient())),
  };
}
const line = (description: string, quantity: string, unitPrice: string, unit = "式") => ({
  kind: "ITEM" as const,
  description,
  quantity,
  unit,
  unitPrice,
  remark: "",
});
function document(): QuoteDocumentDraft {
  return {
    sections: [
      {
        title: "木作",
        categoryId: "CUSTOM_MILLWORK",
        lines: [line("天花板", "30", "3500", "坪"), line("系統櫃", "1", "180000")],
      },
      {
        title: "水電",
        categoryId: "LIGHTING_ELECTRICAL",
        lines: [line("插座", "12", "1250", "個"), { kind: "NOTE", description: "現場複核尺寸" }],
      },
      {
        title: "管理",
        categoryId: null,
        lines: [
          { kind: "PERCENTAGE", description: "監工管理費", percentage: "8", remark: "施工期間" },
        ],
      },
    ],
    discount: { amount: "4000", label: "優惠折讓" },
  };
}
async function newJob() {
  const context = await db.actor();
  const input = jobInput();
  expect(
    await new CreateProject(new PrismaProjectWriteRepository(getPrismaClient())).execute(
      context,
      input,
    ),
  ).toEqual({ kind: "CREATED", businessKey: input.businessKey });
  return {
    context,
    key: input.businessKey,
    input: {
      projectKey: input.businessKey,
      baseVersionId: null,
      idempotencyKey: randomUUID(),
      preparationToken: null,
      ...document(),
    },
  };
}
suite("SB-065 authorized document saves and immutable issue", () => {
  it("compares the combined category across sections while fees and discount stay in the overall amount", async () => {
    const { context, key, input } = await newJob(),
      app = services();
    const source = document();
    const [wood, electrical, fees] = source.sections;
    const sections = [
      { ...wood!, lines: [wood!.lines[0]!] },
      { ...wood!, title: "櫃體", lines: [wood!.lines[1]!] },
      electrical!,
      { ...fees!, categoryId: "CUSTOM_MILLWORK" },
    ];
    expect((await app.save.execute(context, { ...input, sections })).kind).toBe("SAVED");
    const comparisons = createComparisonServices();
    const compared = await comparisons.runComparison.execute(context, key);
    if (compared.kind !== "COMPLETE") throw new Error("COMPARISON_REQUIRED");
    const economics = await comparisons.runEconomics.execute(
      context,
      compared.result.run.id,
      compared.result.defaultSelectedProjectKeys,
    );
    if (!("result" in economics)) throw new Error("ECONOMICS_REQUIRED");
    expect(
      economics.result.categories.find((category) => category.categoryId === "CUSTOM_MILLWORK")
        ?.quoteVariance.currentAmount,
    ).toBe("285000.00");
    expect(
      economics.result.categories.find((category) => category.categoryId === "LIGHTING_ELECTRICAL")
        ?.quoteVariance.currentAmount,
    ).toBe("15000");
    expect(economics.result.categories.some((category) => !category.categoryId)).toBe(false);
    expect(
      economics.result.claims.find((claim) => claim.kind === "OVERALL_QUOTED_VARIANCE")?.value
        .currentAmount,
    ).toBe("320000");
  });

  it("saves, signs, issues and revises the 30-section / 300-line document limit", async () => {
    const { context, key, input } = await newJob(),
      app = services();
    const sections = Array.from({ length: 30 }, (_, si) => ({
      title: `Section ${si + 1}`,
      categoryId: "CUSTOM_MILLWORK",
      lines: Array.from({ length: 10 }, (_, li) =>
        si === 0 && li === 0
          ? {
              kind: "ITEM" as const,
              description: "合".repeat(500),
              quantity: "100",
              unit: "式",
              unitPrice: "10000",
              remark: "備".repeat(200),
            }
          : {
              kind: "PERCENTAGE" as const,
              description: "費".repeat(500),
              percentage: "1",
              remark: "備".repeat(200),
            },
      ),
    }));
    const saved = await app.save.execute(context, { ...input, sections });
    if (saved.kind !== "SAVED") throw new Error("SAVE_REQUIRED");
    const prepared = await app.prepare.execute(context, {
      projectKey: key,
      versionId: saved.versionId,
      options: { language: "zh-TW", attention: "", terms: "條".repeat(10000) },
    });
    if (prepared.kind !== "PREPARED") throw new Error("PREPARATION_REQUIRED");
    expect(prepared.preparation.blockers).toEqual([]);
    expect(prepared.token.length).toBeLessThanOrEqual(2500000);
    expect(
      (
        await app.issue.execute(context, {
          projectKey: key,
          token: prepared.token,
          idempotencyKey: randomUUID(),
        })
      ).kind,
    ).toBe("ISSUED");
    const revised = await app.revise.execute(context, {
      projectKey: key,
      versionId: saved.versionId,
      idempotencyKey: randomUUID(),
    });
    expect(revised.kind).toBe("REVISED");
    const result = await app.read.execute(context, key);
    if (result.kind !== "AVAILABLE" || !result.saved?.document)
      throw new Error("DOCUMENT_REQUIRED");
    expect(result.saved.document.sections).toHaveLength(30);
    expect(result.saved.document.sections.flatMap((section) => section.lines)).toHaveLength(300);
    expect(result.saved.document.totalAmount).toBe("4185300.00");
  }, 30000);

  it("keeps a blank discount label through saving and defaults it only in the document's language", async () => {
    const { context, key, input } = await newJob(),
      app = services();
    const saved = await app.save.execute(context, {
      ...input,
      discount: { amount: "4000", label: "" },
    });
    if (saved.kind !== "SAVED") throw Error("SAVE_REQUIRED");
    expect(await app.read.execute(context, key)).toMatchObject({
      saved: { document: { discount: { label: "" } } },
    });
    for (const language of ["en", "zh-TW"] as const) {
      const prepared = await app.prepare.execute(context, {
        projectKey: key,
        versionId: saved.versionId,
        options: { language, attention: "" },
      });
      expect(prepared).toMatchObject({
        preparation: {
          snapshot: {
            document: { discount: { label: language === "en" ? "Discount" : "優惠折讓" } },
          },
        },
      });
    }
    const renamed = await app.save.execute(
      { ...context, requestId: randomUUID() },
      {
        ...input,
        baseVersionId: saved.versionId,
        idempotencyKey: randomUUID(),
        discount: { amount: "4000", label: "忠誠客戶" },
      },
    );
    if (renamed.kind !== "SAVED") throw Error("SAVE_REQUIRED");
    const prepared = await app.prepare.execute(context, {
      projectKey: key,
      versionId: renamed.versionId,
      options: { language: "en", attention: "" },
    });
    expect(prepared).toMatchObject({
      preparation: { snapshot: { document: { discount: { label: "忠誠客戶" } } } },
    });
  });

  it("starts without a comparison, ignores client amounts, saves twice, and replays one audited success", async () => {
    const { context, key, input } = await newJob(),
      app = services();
    const tampered = {
      ...input,
      totals: { totalAmount: "1" },
      sections: input.sections.map((section) => ({
        ...section,
        subtotal: "1",
        lines: section.lines.map((item) => ({ ...item, amount: "1" })),
      })),
    };
    expect(await app.totals.execute(context, tampered)).toMatchObject({
      amountBeforeTax: "320000.00",
      taxAmount: "16000.00",
      totalAmount: "336000.00",
    });
    const [saved, replay] = await Promise.all([
      app.save.execute(context, tampered),
      app.save.execute(context, input),
    ]);
    expect(saved.kind).toBe("SAVED");
    expect(replay).toEqual(saved);
    if (saved.kind !== "SAVED") throw new Error("SAVE_REQUIRED");
    expect(
      (
        await db.sql.query(
          'SELECT count(*)::int AS count FROM "AuditEvent" WHERE "idempotencyKey"=$1',
          [input.idempotencyKey],
        )
      ).rows,
    ).toEqual([{ count: 1 }]);
    const read = await app.read.execute(context, key);
    expect(read.kind).toBe("AVAILABLE");
    if (read.kind !== "AVAILABLE" || !read.saved?.document) throw new Error("DOCUMENT_REQUIRED");
    expect(read.saved.document).toMatchObject({
      sections: [
        { title: "木作", subtotal: "285000.00" },
        { title: "水電", subtotal: "15000.00" },
        { title: "管理", subtotal: "0.00" },
      ],
      totalAmount: "336000.00",
    });
    const second = await app.save.execute(
      { ...context, requestId: randomUUID() },
      {
        ...input,
        baseVersionId: saved.versionId,
        idempotencyKey: randomUUID(),
        sections: read.saved.document.sections,
      },
    );
    expect(second.kind).toBe("SAVED");
    expect(
      (
        await db.sql.query(
          'SELECT count(*)::int AS count FROM "ComparisonRun" r JOIN "Project" p ON p.id=r."activeProjectId" WHERE p."businessKey"=$1',
          [key],
        )
      ).rows,
    ).toEqual([{ count: 0 }]);
    expect(await app.read.execute({ ...context, locale: "zh-TW" }, key)).toMatchObject({
      saved: {
        document: {
          sections: expect.arrayContaining([
            expect.objectContaining({
              lines: expect.arrayContaining([expect.objectContaining({ description: "天花板" })]),
            }),
          ]),
        },
      },
    });
    expect(
      await app.save.execute(context, {
        ...input,
        idempotencyKey: randomUUID(),
        discount: { amount: "999999999", label: "Too much" },
      }),
    ).toEqual({ kind: "DISCOUNT_EXCEEDS_SUBTOTAL" });
  });
  it("blocks empty sections and zero financial lines only at issue; absence of comparison is a warning", async () => {
    const { context, key, input } = await newJob(),
      app = services();
    const saved = await app.save.execute(context, {
      ...input,
      sections: [{ title: "Work", categoryId: null, lines: [] }],
      discount: { amount: "0", label: "Discount" },
    });
    if (saved.kind !== "SAVED") throw new Error("SAVE_REQUIRED");
    const prepared = await app.prepare.execute(context, {
      projectKey: key,
      versionId: saved.versionId,
      options: { language: "zh-TW", attention: "" },
    });
    expect(prepared.kind).toBe("PREPARED");
    if (prepared.kind !== "PREPARED") throw new Error("PREPARATION_REQUIRED");
    expect(prepared.preparation.blockers).toContain("EMPTY_SECTION");
    expect(prepared.preparation.warnings).toContain("NO_COMPARISON");
    expect(
      await app.issue.execute(context, {
        projectKey: key,
        token: prepared.token,
        idempotencyKey: randomUUID(),
      }),
    ).toMatchObject({ kind: "CHANGED", blockers: expect.arrayContaining(["EMPTY_SECTION"]) });
  });
  it("issues a version 2 document with frozen site/client details and revises all rows without changing the issued snapshot", async () => {
    const { context, key, input } = await newJob(),
      app = services();
    const address = {
      businessKey: key,
      expectedSiteAddress: "",
      siteAddress: "合成工程地址100號",
      idempotencyKey: randomUUID(),
    };
    expect(await app.address.update(context, address)).toEqual({ kind: "UPDATED" });
    expect(await app.address.update(context, address)).toEqual({ kind: "UPDATED" });
    const saved = await app.save.execute(context, input);
    if (saved.kind !== "SAVED") throw new Error("SAVE_REQUIRED");
    const prepared = await app.prepare.execute(context, {
      projectKey: key,
      versionId: saved.versionId,
      options: { language: "zh-TW", attention: "合成收件人" },
    });
    if (prepared.kind !== "PREPARED") throw new Error("PREPARATION_REQUIRED");
    expect(prepared.preparation.blockers).toEqual([]);
    expect(prepared.preparation.snapshot).toMatchObject({
      schemaVersion: "QUOTE-DOCUMENT-2.0",
      siteAddress: address.siteAddress,
      document: {
        totalAmount: "336000.00",
        subtotal: "300000.00",
        sections: [{ subtotal: "285000.00" }, { subtotal: "15000.00" }, { subtotal: "0.00" }],
      },
    });
    expect(
      (
        await app.issue.execute(context, {
          projectKey: key,
          token: prepared.token,
          idempotencyKey: randomUUID(),
        })
      ).kind,
    ).toBe("ISSUED");
    const before = await app.document.execute(context, saved.versionId);
    expect(
      await app.address.update(
        { ...context, requestId: randomUUID() },
        {
          ...address,
          expectedSiteAddress: address.siteAddress,
          siteAddress: "New address after issue",
          idempotencyKey: randomUUID(),
        },
      ),
    ).toEqual({ kind: "UPDATED" });
    expect(await app.issueView.execute(context, key)).toMatchObject({
      issuedHeader: {
        siteAddress: address.siteAddress,
        projectName: prepared.preparation.snapshot.projectName,
        issueDate: prepared.preparation.snapshot.issueDate,
      },
    });
    const revised = await app.revise.execute(context, {
      projectKey: key,
      versionId: saved.versionId,
      idempotencyKey: randomUUID(),
    });
    expect(revised.kind).toBe("REVISED");
    const draft = await app.read.execute(context, key);
    expect(draft).toMatchObject({
      saved: {
        status: "DRAFT",
        document: {
          sections: [
            { title: "木作" },
            {
              title: "水電",
              lines: [{ description: "插座" }, { kind: "NOTE", description: "現場複核尺寸" }],
            },
            { title: "管理" },
          ],
          discount: { amount: "4000.00" },
          totalAmount: "336000.00",
        },
      },
    });
    expect(await app.document.execute(context, saved.versionId)).toEqual(before);
    expect(
      JSON.stringify(
        (
          await db.sql.query('SELECT payload FROM "AuditEvent" WHERE "idempotencyKey"=$1', [
            address.idempotencyKey,
          ])
        ).rows,
      ),
    ).not.toContain(address.siteAddress);
  });
  it("redacts every financial field for Viewer and refuses Viewer and cross-tenant writes/reads", async () => {
    const { context, key, input } = await newJob(),
      app = services();
    expect((await app.save.execute(context, input)).kind).toBe("SAVED");
    await db.sql.query(
      `INSERT INTO "ProjectAssignment" (id,"organizationId","projectId","membershipId","canReadActuals","canCreateAction") SELECT $1,'org_horizon',id,'membership_horizon_viewer',false,false FROM "Project" WHERE "businessKey"=$2`,
      [randomUUID(), key],
    );
    const viewer = await db.actor("membership_horizon_viewer"),
      other = await db.actor("membership_northern_owner");
    const visible = await app.read.execute(viewer, key);
    expect(visible).toMatchObject({
      kind: "AVAILABLE",
      canDraft: false,
      canReadAmounts: false,
      saved: null,
      structure: { sections: [{ title: "木作" }, { title: "水電" }, { title: "管理" }] },
    });
    expect(JSON.stringify(visible)).not.toMatch(
      /"(?:amount|unitPrice|totalAmount|taxAmount|percentage|discount)":/,
    );
    for (const actor of [viewer, other]) {
      expect(await app.save.execute(actor, { ...input, idempotencyKey: randomUUID() })).toEqual({
        kind: "UNAVAILABLE",
      });
      expect(await app.totals.execute(actor, input)).toBeNull();
      expect(
        await app.address.update(actor, {
          businessKey: key,
          siteAddress: "Forbidden",
          expectedSiteAddress: "",
          idempotencyKey: randomUUID(),
        }),
      ).toEqual({ kind: "UNAVAILABLE" });
    }
    expect(await app.read.execute(other, key)).toEqual({ kind: "UNAVAILABLE" });
    expect(await app.address.read(other, key)).toBeNull();
    expect(await app.address.read(viewer, key)).toMatchObject({ projectKey: key, canEdit: false });
  });
});
