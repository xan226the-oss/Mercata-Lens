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

function cloneReport(report: DecisionReport): DecisionReport {
  return {
    ...report,
    ranking: JSON.parse(JSON.stringify(report.ranking)) as RankingResult,
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
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = downloadName;
  anchor.click();
  URL.revokeObjectURL(url);
}
