import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "../../.generated/prisma/client";
import { EvidencePanel } from "@/components/evidence/evidence-panel";
import { ComparisonExperienceClient } from "@/components/comparisons/comparison-experience-client";
import { ActionReceipt } from "@/components/internal-review/action-receipt";
import { ProjectWorkspaceOverview } from "@/components/projects/project-workspace-overview";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { disconnectPrismaClientForTests, getPrismaClient } from "@/lib/server/prisma";
import { buildComparisonExperience } from "@/modules/comparison-experience/build-comparison-experience";
import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";
import type { EvidencePanelSelection } from "@/modules/evidence-panel/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/en/projects/PRJ-XINYI-026/compare",
  useSearchParams: () => new URLSearchParams(),
}));

const originalDatabaseUrl = process.env.DATABASE_URL;
const describePostgres = originalDatabaseUrl ? describe.sequential : describe.skip;
const databaseName = `stridebrain_sb029_copy_${randomUUID().replaceAll("-", "")}`;
const safeDatabaseName = /^stridebrain_sb029_copy_[a-f0-9]{32}$/;
const secret = "independent-copy-review-synthetic-signing-secret-32-bytes";
const noop = () => {};
const locales = ["en", "zh-TW"] as const;
let administrator: PrismaClient | undefined;
let context: RuntimeContext;
let comparison: Stage4ComparisonResult;
let economics: Stage5EconomicsResult;

function visibleText(markup: string): string {
  return markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

function assertNoInternalCopy(text: string, contextLabel: string): void {
  expect(text, contextLabel).not.toMatch(
    /\b[A-Z]+(?:_[A-Z0-9]+)+\b|CPI-(?:SIM|ECON|CALC|ELIGIBILITY)-|EVIDENCE-AUTHORITY-|\b(?:cost-line|forecast-cost-line|quote-item|forecast-cost-version)\b|source\(s\)|Description unavailable|此項說明尚未提供|Currentnormalizedamount|Descriptionen|Descriptionzhtw|Unitprice/,
  );
}

describePostgres("Independent SB-029 stored-data presentation review", () => {
  beforeAll(async () => {
    if (!originalDatabaseUrl || !safeDatabaseName.test(databaseName))
      throw new Error("ISOLATED_REVIEW_DATABASE_REQUIRED");
    administrator = new PrismaClient({
      adapter: new PrismaPg({ connectionString: originalDatabaseUrl }),
    });
    await administrator.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    const isolated = new URL(originalDatabaseUrl);
    isolated.pathname = `/${databaseName}`;
    const environment = { ...process.env, DATABASE_URL: isolated.toString() };
    for (const script of ["db:migrate", "db:seed"]) {
      execFileSync("npm", ["run", script], {
        env: environment,
        stdio: "pipe",
        timeout: 90_000,
      });
    }
    await disconnectPrismaClientForTests();
    process.env.DATABASE_URL = isolated.toString();
    const repository = new PrismaDemoSessionRepository(
      getPrismaClient() as unknown as PrismaDemoSessionDatabase,
    );
    const issued = await new DemoSessionService(repository, secret).issueForMembership(
      "membership_horizon_mei",
      { locale: "en", ttlSeconds: 3600 },
    );
    if (!issued) throw new Error("SYNTHETIC_REVIEW_SESSION_REQUIRED");
    const resolved = await new SignedDemoIdentityContext(repository, secret).resolve(
      new Request("https://stridebrain.test/en/projects/PRJ-XINYI-026/compare", {
        headers: { cookie: issued.setCookie.split(";")[0]! },
      }),
    );
    if (!resolved) throw new Error("SYNTHETIC_REVIEW_CONTEXT_REQUIRED");
    context = resolved;
    const services = createComparisonServices();
    const structural = await services.runComparison.execute(context, "PRJ-XINYI-026");
    if (structural.kind !== "COMPLETE") throw new Error("COMPARISON_REQUIRED");
    comparison = structural.result;
    const enriched = await services.runEconomics.execute(
      context,
      comparison.run.id,
      comparison.defaultSelectedProjectKeys,
    );
    if (!("result" in enriched)) throw new Error("ECONOMICS_REQUIRED");
    economics = enriched.result;
  }, 180_000);

  afterAll(async () => {
    await disconnectPrismaClientForTests();
    if (originalDatabaseUrl) process.env.DATABASE_URL = originalDatabaseUrl;
    if (administrator && safeDatabaseName.test(databaseName)) {
      await administrator.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
      );
      await administrator.$disconnect();
    }
  }, 30_000);

  it.each(locales)(
    "F-07 opens the authoritative supported or insufficient table claim in %s",
    async (locale) => {
      const services = createComparisonServices();
      const saved = JSON.stringify(economics);
      const view = buildComparisonExperience({ stage4: comparison, economics, locale });
      const rows = view.table.sections.flatMap((section) => section.rows);
      const lighting = rows.find((row) => row.key === "LIGHTING_ELECTRICAL-ACTUAL")!;
      const gap = view.synthesis.gaps.find((item) => item.key === "lighting-gap")!;
      const selection = (claimKey: string): EvidencePanelSelection => ({
        mode: "CLAIM",
        comparisonRunId: comparison.run.id,
        enrichmentRunId: economics.run.id,
        claimKey,
      });
      expect(lighting.cells.__ACTIVE_PROJECT__?.claimKey).toBe(gap.claimKey);
      expect(gap.claimKey).toBe("XINYI_LIGHTING_ELECTRICAL_ACTUAL_INSUFFICIENT");
      const panel = await services.getEvidencePanel.execute(
        context,
        selection(lighting.cells.__ACTIVE_PROJECT__!.claimKey!),
        locale,
      );
      const gapPanel = await services.getEvidencePanel.execute(
        context,
        selection(gap.claimKey!),
        locale,
      );
      expect(panel).toEqual(gapPanel);
      if (panel.kind !== "READY") throw Error("INSUFFICIENCY_PANEL_REQUIRED");
      expect(panel.view.claim?.sufficiencyLabel).toBe(
        locale === "en" ? "Insufficient actual-cost evidence" : "實際成本資料不足",
      );
      expect(panel.view.claim?.valueLabel).toContain("2");
      expect(panel.view.claim?.valueLabel).toContain("3");
      expect(panel.view.sources.length).toBeGreaterThan(0);
      expect(panel.view.trace).toBeUndefined();
      const stored = economics.categories.find(
        (category) => category.categoryId === "LIGHTING_ELECTRICAL",
      )!;
      expect(stored.actualHistory).toMatchObject({
        state: "INSUFFICIENT",
        eligibleObservationCount: 2,
        requiredObservationCount: 3,
      });
      expect(stored.forecastVariance.variancePercent).toBeUndefined();
      expect(stored.actualHistory.minimumNormalizedAmount).toBeUndefined();
      expect(stored.actualHistory.maximumNormalizedAmount).toBeUndefined();

      const supportedKey = rows.find((row) => row.key === "IMPORTED_STONE-ACTUAL")!.cells
        .__ACTIVE_PROJECT__!.claimKey!;
      const supported = await services.getEvidencePanel.execute(
        context,
        selection(supportedKey),
        locale,
      );
      if (supported.kind !== "READY") throw Error("SUPPORTED_PANEL_REQUIRED");
      expect(supported.view.claim?.claimKey).toBe("XINYI_IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE");
      expect(supported.view.trace?.kind).toBe("FINANCIAL");
      expect(supported.view.claim?.valueLabel).toContain("+18.4%");
      const unavailable = await services.getEvidencePanel.execute(
        context,
        selection("XINYI_LIGHTING_ELECTRICAL_FORECAST_ACTUAL_VARIANCE"),
        locale,
      );
      expect(unavailable.kind).toBe("UNAVAILABLE");
      expect(JSON.stringify(economics)).toBe(saved);
    },
  );

  it("preserves stored forecast and actual authority at every visible comparison cell", () => {
    const saved = JSON.stringify({ comparison, economics });
    expect(economics.current.forecastDirectCost).toMatch(/^12650000(?:\.0+)?$/);
    expect(economics.overall.forecastVariance.currentBasis).toBe("FORECAST");
    expect(economics.overall.actualHistory.observationType).toBe("RECONCILED_ACTUAL_COST");
    for (const locale of locales) {
      const view = buildComparisonExperience({ stage4: comparison, economics, locale });
      const rows = view.table.sections.flatMap((section) => section.rows);
      for (const key of ["overall-actual", "IMPORTED_STONE-ACTUAL", "LIGHTING_ELECTRICAL-ACTUAL"]) {
        const row = rows.find((candidate) => candidate.key === key)!;
        const active = row.cells.__ACTIVE_PROJECT__!;
        expect(active.observationType).toBe("FORECAST_DIRECT_COST");
        expect(active.observationLabel).toBe(
          locale === "en" ? "Forecast direct cost" : "預估直接成本",
        );
        for (const project of view.initialSelectedProjectKeys) {
          expect(row.cells[project]?.observationType).toBe("RECONCILED_ACTUAL_COST");
          expect(row.cells[project]?.observationLabel).toBe(
            locale === "en" ? "Reconciled actual cost" : "已核對實際成本",
          );
        }
      }
      const html = renderToStaticMarkup(createElement(ComparisonExperienceClient, { view }));
      expect(html).toMatch(/<h1 tabindex="-1">/);
      const text = visibleText(html);
      assertNoInternalCopy(text, `${locale} comparison`);
      if (locale === "zh-TW") {
        expect(text).not.toMatch(/\b(?:District|Taipei|weeks)\b/);
        for (const label of [
          "零售旗艦店",
          "臺北市內湖區",
          "新北市板橋區",
          "16 週",
          "19–22 週",
          "專案相似度",
        ]) {
          expect(text).toContain(label);
        }
        expect(html).toMatch(/aria-label="[^"]*16 週/);
      } else {
        expect(text).toContain("Retail flagship");
        expect(text).toContain("Neihu District, Taipei City");
        expect(text).toContain("16 weeks");
      }
      expect(html).toContain("NT$12,650,000");
      expect(html).toContain("NT$2,360,000");
      expect(html).toMatch(
        locale === "en"
          ? /aria-label="[^"]*Forecast direct cost[^"]*NT\$2,360,000/
          : /aria-label="[^"]*預估直接成本[^"]*NT\$2,360,000/,
      );
    }
    expect(JSON.stringify({ comparison, economics })).toBe(saved);
  });

  it("renders every real claim, factor and linked source without internal enum or policy copy", async () => {
    const services = createComparisonServices();
    const selections: EvidencePanelSelection[] = economics.claims.map((claim) => ({
      mode: "CLAIM",
      comparisonRunId: comparison.run.id,
      enrichmentRunId: economics.run.id,
      claimKey: claim.claimKey,
    }));
    for (const match of comparison.matches) {
      for (const factorKey of comparison.summary.factorsUsed) {
        selections.push({
          mode: "FACTOR",
          comparisonRunId: comparison.run.id,
          candidateProjectKey: match.project.projectKey,
          factorKey,
        });
      }
    }
    const observationTypes = new Set<string>();
    let panels = 0;
    for (const locale of locales) {
      const sourceSelections = new Map<string, EvidencePanelSelection>();
      async function inspect(selection: EvidencePanelSelection) {
        const outcome = await services.getEvidencePanel.execute(context, selection, locale);
        expect(outcome.kind, `${locale} ${JSON.stringify(selection)}`).toBe("READY");
        if (outcome.kind !== "READY") throw new Error("EVIDENCE_REQUIRED");
        const text = visibleText(
          renderToStaticMarkup(
            createElement(EvidencePanel, {
              outcome,
              locale,
              onClose: noop,
              onNavigate: noop,
            }),
          ),
        );
        assertNoInternalCopy(text, `${locale} ${JSON.stringify(selection)}`);
        if (locale === "zh-TW") {
          expect(text).not.toMatch(
            /\b(?:Code|State|Current context|Historical context|District|Taipei|weeks|programmeWeeks)\b/,
          );
        }
        for (const source of outcome.view.sources) {
          if (source.observationType) observationTypes.add(source.observationType);
          sourceSelections.set(source.sourceKey, source.sourceSelection);
        }
        panels++;
      }
      for (const selection of selections) await inspect(selection);
      for (const selection of [...sourceSelections.values()]) await inspect(selection);
    }
    expect(observationTypes).toEqual(
      new Set(["QUOTED_PRICE", "SUPPLIER_OFFER", "FORECAST_DIRECT_COST", "RECONCILED_ACTUAL_COST"]),
    );
    expect(panels).toBeGreaterThan(100);
  }, 90_000);

  it("keeps forecast versus actual meaning through authorized proposal, receipt and workspace", async () => {
    const services = createInternalReviewServices();
    const prepared = await services.prepare(context, {
      projectKey: comparison.activeContext.projectKey,
      comparisonRunId: comparison.run.id,
      enrichmentRunId: economics.run.id,
      locale: "en",
      returnContext: { selectedProjectKeys: economics.selectedProjectKeys },
    });
    expect(prepared.kind).toBe("PREPARED");
    if (prepared.kind !== "PREPARED") throw new Error("PROPOSAL_REQUIRED");
    expect(
      prepared.proposal.mandatoryStatements.find((statement) => statement.key === "STONE")?.text,
    ).toContain("forecast direct cost differs by +18.4% from eligible reconciled-actual history");
    const created = await services.confirm(context, {
      version: "internal-review-command.v1",
      proposalKey: prepared.proposal.businessKey,
      title: prepared.proposal.title,
      rationale: prepared.proposal.rationale,
      assigneeKey: prepared.proposal.suggestedAssigneeKey,
      dueDate: null,
      confirmation: true,
      idempotencyKey: prepared.proposal.idempotencyKey,
      locale: "en",
    });
    expect(created.kind).toBe("CREATED");
    if (!("receipt" in created)) throw new Error("RECEIPT_REQUIRED");
    for (const locale of locales) {
      const result = await services.getReceipt(context, created.receipt.businessKey, locale);
      if (result.kind !== "AVAILABLE") throw new Error("AUTHORIZED_RECEIPT_REQUIRED");
      const receiptText = visibleText(
        renderToStaticMarkup(
          createElement(ActionReceipt, {
            receipt: result.receipt,
            locale,
          }),
        ),
      );
      expect(receiptText).toContain(
        locale === "en"
          ? "forecast direct cost differs by +18.4% from eligible reconciled-actual history"
          : "預估直接成本與符合條件的已核對實際成本歷史比較，差異為 +18.4%",
      );
      const workspace = await createProjectWorkspaceService().execute(
        { ...context, locale },
        "PRJ-XINYI-026",
      );
      if (workspace.kind !== "AVAILABLE") throw new Error("WORKSPACE_REQUIRED");
      expect(workspace.workspace.commercial.activeForecast).toMatchObject({
        state: "VALUE",
        observationType: "FORECAST_DIRECT_COST",
        money: { amount: expect.stringMatching(/^12650000(?:\.0+)?$/) },
      });
      expect(
        workspace.workspace.openActions.find(
          (action) => action.actionKey === created.receipt.businessKey,
        )?.title,
      ).toBe(result.receipt.title);
      const text = visibleText(
        renderToStaticMarkup(
          createElement(ProjectWorkspaceOverview, {
            workspace: workspace.workspace,
            locale,
          }),
        ),
      );
      expect(text).toContain(locale === "en" ? "Forecast direct cost" : "預估直接成本");
      expect(text).toContain("12,650,000");
      expect(text).not.toMatch(/FORECAST_DIRECT_COST|HUMAN_REVIEWED|RECONCILED_ACTUAL/);
      expect(text).toContain(locale === "en" ? "Xinyi District, Taipei City" : "臺北市信義區");
      if (locale === "zh-TW") expect(text).not.toMatch(/\b(?:District|Taipei|weeks)\b/);
    }
  }, 30_000);
});
