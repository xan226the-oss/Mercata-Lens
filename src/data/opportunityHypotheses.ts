import type { EconomicScenario, ResearchDataset } from "../domain/types";
import type { Opportunity } from "../domain/opportunities";
import { OPPORTUNITY_DIMENSIONS, OPPORTUNITY_IDS, OPPORTUNITY_NAMES } from "../domain/opportunities";
import type { PainPointSummary } from "../domain/painPoints";
import type { PainPointId } from "../domain/painPointRules";

export const OPPORTUNITY_HYPOTHESIS_VALUES = Object.freeze({
  easy_clean: [70, 60, 65, 75, 55],
  quiet_durable: [65, 58, 60, 70, 60],
  low_consumables: [55, 62, 70, 65, 65],
} as const);

const TARGET_USER = "US cat owners evaluating a household fountain";

const PAIN_POINT_PRIORITY: Record<OpportunityId, readonly PainPointId[]> = {
  easy_clean: ["hard_to_clean"],
  quiet_durable: ["noise", "pump_lifetime"],
  low_consumables: ["filter_cost"],
};

type OpportunityId = (typeof OPPORTUNITY_IDS)[number];

function cloneScenario(scenario: EconomicScenario): EconomicScenario {
  return {
    ...scenario,
    inputs: { ...scenario.inputs },
    provenance: Object.fromEntries(
      Object.entries(scenario.provenance).map(([key, value]) => [key, value ? { ...value } : null]),
    ) as EconomicScenario["provenance"],
  };
}

function reviewEvidenceFor(
  dataset: ResearchDataset,
  summaries: readonly PainPointSummary[],
  ids: readonly PainPointId[],
): string[] {
  const allowed = new Set(ids);
  const reviewOrder = new Map(dataset.reviews.map((review, index) => [review.reviewId, index]));
  return summaries
    .filter((summary) => allowed.has(summary.id))
    .flatMap((summary) => summary.evidence.map((item) => `review:${item.reviewId}`))
    .sort((left, right) => (reviewOrder.get(left.slice("review:".length)) ?? Number.MAX_SAFE_INTEGER) - (reviewOrder.get(right.slice("review:".length)) ?? Number.MAX_SAFE_INTEGER));
}

function firstReviewEvidence(
  dataset: ResearchDataset,
  summaries: readonly PainPointSummary[],
  ids: readonly PainPointId[],
): string | null {
  return reviewEvidenceFor(dataset, summaries, ids)[0] ?? null;
}

function supportEvidenceIds(
  id: OpportunityId,
  dataset: ResearchDataset,
  summaries: readonly PainPointSummary[],
): string[] {
  const evidence: string[] = reviewEvidenceFor(dataset, summaries, PAIN_POINT_PRIORITY[id]);
  evidence.push("economics:base", `assumption:${id}:demand`);
  return evidence;
}

function oppositionEvidenceIds(id: OpportunityId): string[] {
  return [`assumption:${id}:risk`];
}

function demoOpportunity(
  id: OpportunityId,
  dataset: ResearchDataset,
  summaries: readonly PainPointSummary[],
  economics: readonly EconomicScenario[],
): Opportunity {
  const values = OPPORTUNITY_HYPOTHESIS_VALUES[id];
  const dimensions = OPPORTUNITY_DIMENSIONS.map((dimension, index) => {
    const reviewEvidence = firstReviewEvidence(dataset, summaries, PAIN_POINT_PRIORITY[id]);
    const evidenceIds = dimension === "economics"
      ? ["economics:base", `assumption:${id}:economics`, ...(reviewEvidence ? [reviewEvidence] : [])]
      : [`assumption:${id}:${dimension}`];
    return {
      dimension,
      value: values[index],
      evidenceIds,
      reasoning: `Curated Demo assumption: ${dimension} is a bounded hypothesis input for ${OPPORTUNITY_NAMES[id]}; it is not an observed market conclusion.`,
      evidenceKind: "assumption" as const,
    };
  });
  return {
    id,
    name: OPPORTUNITY_NAMES[id],
    targetUser: TARGET_USER,
    scenario: `A household compares the ${OPPORTUNITY_NAMES[id].toLowerCase()} hypothesis using explicit evidence links and visible assumptions.`,
    dimensions,
    economics: economics.map(cloneScenario),
    supportEvidenceIds: supportEvidenceIds(id, dataset, summaries),
    oppositionEvidenceIds: oppositionEvidenceIds(id),
    unknowns: [
      "The Demo values are curated assumptions awaiting user challenge.",
      "Current-session user input is required before treating this hypothesis as complete for uploaded data.",
    ],
  };
}

function uploadOpportunity(id: OpportunityId, economics: readonly EconomicScenario[]): Opportunity {
  return {
    id,
    name: OPPORTUNITY_NAMES[id],
    targetUser: TARGET_USER,
    scenario: "User-uploaded evidence is awaiting current-session hypothesis inputs.",
    dimensions: OPPORTUNITY_DIMENSIONS.map((dimension) => ({
      dimension,
      value: null,
      evidenceIds: [],
      reasoning: "Current-session user input is required; no score is inherited from Demo data.",
      evidenceKind: "assumption" as const,
    })),
    economics: economics.map(cloneScenario),
    supportEvidenceIds: [],
    oppositionEvidenceIds: [],
    unknowns: [
      "Current-session user input is required for all five dimensions.",
      "No Demo score or winner is inherited by a user upload.",
    ],
  };
}

export function createOpportunityHypotheses(
  dataset: ResearchDataset,
  summaries: readonly PainPointSummary[],
  economics: readonly EconomicScenario[],
): Opportunity[] {
  if (dataset.sourceKind === "user_upload") {
    return OPPORTUNITY_IDS.map((id) => uploadOpportunity(id, economics));
  }
  return OPPORTUNITY_IDS.map((id) => demoOpportunity(id, dataset, summaries, economics));
}
