import { getPrismaClient } from "@/lib/server/prisma";
import { GetComparisonFreshness } from "@/modules/comparisons/application/get-comparison-freshness";
import { GetComparisonRun } from "@/modules/comparisons/application/get-comparison-run";
import { RunComparableProjectAnalysis } from "@/modules/comparisons/application/run-comparable-project-analysis";
import { GetHistoricalEconomicsEnrichment } from "@/modules/economics/application/get-historical-economics-enrichment";
import { RunHistoricalEconomicsEnrichment } from "@/modules/economics/application/run-historical-economics-enrichment";
import { GetEvidencePanel } from "@/modules/evidence-panel/application/get-evidence-panel";
import {
  PrismaComparableProjectRepository,
  type PrismaComparableProjectDatabase,
} from "@/repositories/prisma/prisma-comparable-project-repository";
import {
  PrismaComparisonRunRepository,
  type PrismaComparisonRunDatabase,
} from "@/repositories/prisma/prisma-comparison-run-repository";
import {
  PrismaEconomicsEnrichmentRunRepository,
  type PrismaEconomicsEnrichmentDatabase,
} from "@/repositories/prisma/prisma-economics-enrichment-run-repository";
import {
  PrismaEconomicsObservationRepository,
  type PrismaEconomicsObservationDatabase,
} from "@/repositories/prisma/prisma-economics-observation-repository";
import {
  PrismaEvidencePanelRepository,
  type PrismaEvidencePanelDatabase,
} from "@/repositories/prisma/prisma-evidence-panel-repository";
import {
  PrismaProjectRepository,
  type PrismaProjectReader,
} from "@/repositories/prisma/prisma-project-repository";

type ComparisonDatabase = PrismaProjectReader &
  PrismaComparableProjectDatabase &
  PrismaComparisonRunDatabase &
  PrismaEconomicsObservationDatabase &
  PrismaEconomicsEnrichmentDatabase &
  PrismaEvidencePanelDatabase;

export type ComparisonServices = Readonly<{
  runComparison: RunComparableProjectAnalysis;
  getComparison: GetComparisonRun;
  runEconomics: RunHistoricalEconomicsEnrichment;
  getEconomics: GetHistoricalEconomicsEnrichment;
  getEvidencePanel: GetEvidencePanel;
  getFreshness: GetComparisonFreshness;
}>;

/**
 * Stage 6 composition root. Presentation code receives only application
 * services and permission-safe DTOs; it never imports Prisma or recalculates
 * ranking/economics.
 */
export function createComparisonServices(): ComparisonServices {
  const database = getPrismaClient() as unknown as ComparisonDatabase;
  const projects = new PrismaProjectRepository(database);
  const candidates = new PrismaComparableProjectRepository(database);
  const comparisonRuns = new PrismaComparisonRunRepository(database);
  const observations = new PrismaEconomicsObservationRepository(database);
  const economicsRuns = new PrismaEconomicsEnrichmentRunRepository(database);
  const evidencePanel = new PrismaEvidencePanelRepository(database);

  const freshness = new GetComparisonFreshness(
    projects,
    candidates,
    comparisonRuns,
    observations,
    economicsRuns,
    evidencePanel,
  );

  return Object.freeze({
    runComparison: new RunComparableProjectAnalysis(projects, candidates, comparisonRuns),
    getComparison: new GetComparisonRun(comparisonRuns),
    runEconomics: new RunHistoricalEconomicsEnrichment(comparisonRuns, observations, economicsRuns),
    getEconomics: new GetHistoricalEconomicsEnrichment(economicsRuns),
    getFreshness: freshness,
    getEvidencePanel: new GetEvidencePanel(comparisonRuns, economicsRuns, evidencePanel, freshness),
  });
}
