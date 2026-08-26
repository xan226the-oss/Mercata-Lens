import type { EconomicScenario, ResearchDataset } from "../domain/types";
import type { PainPointCorrections } from "../domain/painPoints";
import type { OpportunityWeights, RankingResult } from "../domain/opportunities";
import type { DecisionConditions, DecisionReport } from "../domain/decision";

export const RESEARCH_EXPORT_SCHEMA_VERSION = 1 as const;

export interface ResearchExportInput {
  dataset: ResearchDataset;
  corrections: PainPointCorrections;
  economicScenarios: readonly EconomicScenario[];
  weights: OpportunityWeights;
  conditions: DecisionConditions;
  report: DecisionReport;
  rulesetVersion: string;
}

export interface ResearchExport {
  schemaVersion: typeof RESEARCH_EXPORT_SCHEMA_VERSION;
  datasetProvenance: {
    sourceKind: ResearchDataset["sourceKind"];
    market: ResearchDataset["market"];
    currency: ResearchDataset["currency"];
    category: string;
    importedAt: string;
    productCount: number;
    reviewCount: number;
  };
  rulesetVersion: string;
  corrections: PainPointCorrections;
  economicsScenarios: EconomicScenario[];
  weights: Record<keyof OpportunityWeights, number>;
  conditions: DecisionConditions;
  report: DecisionReport;
  limitations: string[];
}

function cloneCorrectionMap(corrections: PainPointCorrections): PainPointCorrections {
  return Object.fromEntries(Object.entries(corrections).sort(([a], [b]) => a.localeCompare(b)).map(([id, correction]) => [id, { add: [...correction.add], remove: [...correction.remove], reason: correction.reason }])) as PainPointCorrections;
}

function cloneScenario(scenario: EconomicScenario): EconomicScenario {
  return { ...scenario, inputs: { ...scenario.inputs }, provenance: Object.fromEntries(Object.entries(scenario.provenance).map(([key, value]) => [key, value ? { ...value } : null])) as EconomicScenario["provenance"] };
}

function cloneOpportunityScore(score: RankingResult["scores"][number]): RankingResult["scores"][number] {
  if (score.status === "complete") {
    return {
      opportunityId: score.opportunityId,
      status: "complete",
      total: score.total,
      contributions: score.contributions.map((contribution) => ({ ...contribution, evidenceIds: [...contribution.evidenceIds] })),
      issues: [],
    };
  }
  return {
    opportunityId: score.opportunityId,
    status: "incomplete",
    total: null,
    contributions: score.contributions.map((contribution) => ({ ...contribution, evidenceIds: [...contribution.evidenceIds] })),
    issues: score.issues.map((issue) => ({ ...issue })),
  };
}

function cloneRanking(ranking: RankingResult): RankingResult {
  const scores = ranking.scores.map(cloneOpportunityScore);
  if (ranking.status === "winner") return { status: "winner", winnerId: ranking.winnerId, scores, issues: [] };
  if (ranking.status === "no_clear_winner") return { status: "no_clear_winner", winnerId: null, scores, issues: [] };
  return { status: "incomplete", winnerId: null, scores, issues: ranking.issues.map((issue) => ({ ...issue })) };
}

function cloneReport(report: DecisionReport): DecisionReport {
  return {
    ...report,
    ranking: cloneRanking(report.ranking),
    supportEvidenceIds: [...report.supportEvidenceIds],
    oppositionEvidenceIds: [...report.oppositionEvidenceIds],
    assumptions: [...report.assumptions],
    missingData: [...report.missingData],
    nextActions: report.nextActions.map((action) => ({ ...action })),
    continueConditions: [...report.continueConditions],
    pauseConditions: [...report.pauseConditions],
    stopConditions: [...report.stopConditions],
    triggeredStopConditions: [...report.triggeredStopConditions],
    limitations: [...report.limitations],
  };
}

export function buildResearchExport(input: ResearchExportInput): ResearchExport {
  return {
    schemaVersion: RESEARCH_EXPORT_SCHEMA_VERSION,
    datasetProvenance: {
      sourceKind: input.dataset.sourceKind,
      market: input.dataset.market,
      currency: input.dataset.currency,
      category: input.dataset.category,
      importedAt: input.dataset.importedAt,
      productCount: input.dataset.products.length,
      reviewCount: input.dataset.reviews.length,
    },
    rulesetVersion: input.rulesetVersion,
    corrections: cloneCorrectionMap(input.corrections),
    economicsScenarios: input.economicScenarios.map(cloneScenario),
    weights: { demand: input.weights.demand, supply_gap: input.weights.supply_gap, economics: input.weights.economics, differentiation: input.weights.differentiation, risk: input.weights.risk },
    conditions: { continueConditions: [...input.conditions.continueConditions], pauseConditions: [...input.conditions.pauseConditions], stopConditions: [...input.conditions.stopConditions] },
    report: cloneReport(input.report),
    limitations: [...input.report.limitations],
  };
}

export function serializeResearchExport(input: ResearchExportInput): string {
  return JSON.stringify(buildResearchExport(input), null, 2) + "\n";
}

export function downloadResearchExport(input: ResearchExportInput, downloadName = "mercata-lens-research.json"): void {
  const blob = new Blob([serializeResearchExport(input)], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = downloadName;
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
