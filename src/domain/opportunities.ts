import type { EconomicScenario, EvidenceKind } from "./types";

export const OPPORTUNITY_IDS = ["easy_clean", "quiet_durable", "low_consumables"] as const;
export type OpportunityId = (typeof OPPORTUNITY_IDS)[number];

export const OPPORTUNITY_DIMENSIONS = [
  "demand",
  "supply_gap",
  "economics",
  "differentiation",
  "risk",
] as const;
export type OpportunityDimension = (typeof OPPORTUNITY_DIMENSIONS)[number];

export const OPPORTUNITY_NAMES: Readonly<Record<OpportunityId, string>> = Object.freeze({
  easy_clean: "Easy-clean design",
  quiet_durable: "Quiet and durable design",
  low_consumables: "Low consumables cost design",
});

export type OpportunityWeights = Readonly<Record<OpportunityDimension, number>>;

export interface DimensionScore {
  readonly dimension: OpportunityDimension;
  readonly value: number | null;
  readonly evidenceIds: readonly string[];
  readonly reasoning: string;
  readonly evidenceKind: EvidenceKind;
}

export interface Opportunity {
  readonly id: OpportunityId;
  readonly name: string;
  readonly targetUser: string;
  readonly scenario: string;
  readonly dimensions: readonly DimensionScore[];
  readonly economics: readonly EconomicScenario[];
  readonly supportEvidenceIds: readonly string[];
  readonly oppositionEvidenceIds: readonly string[];
  readonly unknowns: readonly string[];
}

export interface WeightIssue {
  readonly kind: "weights";
  readonly code: "missing_key" | "extra_key" | "not_finite" | "negative" | "total";
  readonly key?: string;
  readonly message: string;
}

export interface DimensionIssue {
  readonly kind: "dimension";
  readonly dimension?: string;
  readonly code:
    | "missing"
    | "duplicate"
    | "extra"
    | "invalid_value"
    | "missing_evidence"
    | "invalid_evidence"
    | "invalid_reasoning"
    | "invalid_evidence_kind";
  readonly message: string;
}

export interface CandidateIssue {
  readonly kind: "candidate";
  readonly code: "invalid_id" | "duplicate_id" | "missing_id" | "extra_candidate";
  readonly candidateIndex?: number;
  readonly id?: unknown;
  readonly message: string;
}

export type OpportunityIssue = WeightIssue | DimensionIssue | CandidateIssue;

export type WeightValidation =
  | { readonly valid: true; readonly issues: readonly [] }
  | { readonly valid: false; readonly issues: readonly WeightIssue[] };

export interface OpportunityContribution {
  readonly dimension: OpportunityDimension;
  readonly value: number;
  readonly weight: number;
  readonly contribution: number;
  readonly evidenceIds: readonly string[];
  readonly reasoning: string;
  readonly evidenceKind: EvidenceKind;
}

export type OpportunityScore =
  | {
      readonly opportunityId: OpportunityId;
      readonly status: "complete";
      readonly total: number;
      readonly contributions: readonly OpportunityContribution[];
      readonly issues: readonly [];
    }
  | {
      readonly opportunityId: OpportunityId | null;
      readonly status: "incomplete";
      readonly total: null;
      readonly contributions: readonly OpportunityContribution[];
      readonly issues: readonly OpportunityIssue[];
    };

export type RankingResult =
  | {
      readonly status: "winner";
      readonly winnerId: OpportunityId;
      readonly scores: readonly OpportunityScore[];
      readonly issues: readonly [];
    }
  | {
      readonly status: "no_clear_winner";
      readonly winnerId: null;
      readonly scores: readonly OpportunityScore[];
      readonly issues: readonly [];
    }
  | {
      readonly status: "incomplete";
      readonly winnerId: null;
      readonly scores: readonly OpportunityScore[];
      readonly issues: readonly OpportunityIssue[];
    };

export const DEFAULT_OPPORTUNITY_WEIGHTS: OpportunityWeights = Object.freeze({
  demand: 30,
  supply_gap: 25,
  economics: 20,
  differentiation: 15,
  risk: 10,
});

const hasOwn = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);

export function validateWeights(input: unknown): WeightValidation {
  const issues: WeightIssue[] = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return {
      valid: false,
      issues: [{ kind: "weights", code: "extra_key", message: "Weights must be an object with the five fixed dimensions." }],
    };
  }

  const weights = input as Record<string, unknown>;
  for (const key of OPPORTUNITY_DIMENSIONS) {
    if (!hasOwn(weights, key)) {
      issues.push({ kind: "weights", code: "missing_key", key, message: `Missing weight for ${key}.` });
    }
  }
  for (const key of Object.keys(weights).sort()) {
    if (!(OPPORTUNITY_DIMENSIONS as readonly string[]).includes(key)) {
      issues.push({ kind: "weights", code: "extra_key", key, message: `Unexpected weight key ${key}.` });
    }
  }
  for (const key of OPPORTUNITY_DIMENSIONS) {
    if (!hasOwn(weights, key)) continue;
    const value = weights[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push({ kind: "weights", code: "not_finite", key, message: `Weight ${key} must be finite.` });
    } else if (value < 0) {
      issues.push({ kind: "weights", code: "negative", key, message: `Weight ${key} must be non-negative.` });
    }
  }
  const values = OPPORTUNITY_DIMENSIONS.map((key) => weights[key]);
  if (values.every((value): value is number => typeof value === "number" && Number.isFinite(value))) {
    const total = values.reduce((sum, value) => sum + value, 0);
    if (total !== 100) {
      issues.push({ kind: "weights", code: "total", message: `Weights must total exactly 100; received ${total}.` });
    }
  }
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

const isOpportunityDimension = (value: unknown): value is OpportunityDimension =>
  typeof value === "string" && (OPPORTUNITY_DIMENSIONS as readonly string[]).includes(value);

const isEvidenceKind = (value: unknown): value is EvidenceKind =>
  value === "observed" || value === "assumption" || value === "derived";

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const validateDimensions = (input: unknown): DimensionIssue[] => {
  if (!Array.isArray(input)) {
    return [{ kind: "dimension", code: "missing", message: "Dimensions must be an array." }];
  }
  const issues: DimensionIssue[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : null;
    const dimension = record && "dimension" in record ? String(record.dimension) : "unknown";
    if (!isOpportunityDimension(dimension)) {
      issues.push({ kind: "dimension", code: "extra", dimension, message: `Unexpected dimension ${dimension}.` });
      continue;
    }
    if (seen.has(dimension)) {
      issues.push({ kind: "dimension", code: "duplicate", dimension, message: `Duplicate dimension ${dimension}.` });
    }
    seen.add(dimension);

    const value = record?.value;
    if (value === null) {
      issues.push({ kind: "dimension", code: "missing", dimension, message: `Dimension ${dimension} is missing.` });
      continue;
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
      issues.push({ kind: "dimension", code: "invalid_value", dimension, message: `Dimension ${dimension} must be null or a finite value from 0 to 100.` });
      continue;
    }

    const evidenceIds = record?.evidenceIds;
    if (!Array.isArray(evidenceIds) || evidenceIds.length === 0 || evidenceIds.some((id) => !isNonEmptyString(id))) {
      issues.push({ kind: "dimension", code: "invalid_evidence", dimension, message: `Dimension ${dimension} needs non-empty string evidence IDs.` });
    }
    if (!isNonEmptyString(record?.reasoning)) {
      issues.push({ kind: "dimension", code: "invalid_reasoning", dimension, message: `Dimension ${dimension} needs non-empty reasoning.` });
    }
    if (!isEvidenceKind(record?.evidenceKind)) {
      issues.push({ kind: "dimension", code: "invalid_evidence_kind", dimension, message: `Dimension ${dimension} needs a valid evidence kind.` });
    }
  }
  for (const dimension of OPPORTUNITY_DIMENSIONS) {
    if (!seen.has(dimension)) {
      issues.push({ kind: "dimension", code: "missing", dimension, message: `Missing dimension ${dimension}.` });
    }
  }
  return issues;
};

const candidateId = (opportunity: unknown): unknown =>
  opportunity && typeof opportunity === "object" ? (opportunity as { id?: unknown }).id : undefined;

const validOpportunityId = (id: unknown): id is OpportunityId =>
  (OPPORTUNITY_IDS as readonly unknown[]).includes(id);

export function scoreOpportunity(opportunity: Opportunity, weights: unknown): OpportunityScore {
  const rawId = candidateId(opportunity);
  const opportunityId = validOpportunityId(rawId) ? rawId : null;
  const candidateIssues: CandidateIssue[] = validOpportunityId(rawId)
    ? []
    : [{ kind: "candidate", code: "invalid_id", id: rawId, message: "Opportunity ID must be one of the fixed opportunity IDs." }];
  const weightResult = validateWeights(weights);
  const dimensionIssues = validateDimensions(opportunity && typeof opportunity === "object" ? opportunity.dimensions : undefined);
  const issues: OpportunityIssue[] = [
    ...candidateIssues,
    ...(weightResult.valid ? [] : weightResult.issues),
    ...dimensionIssues,
  ];
  const dimensionMap = new Map<OpportunityDimension, DimensionScore>();
  if (Array.isArray(opportunity?.dimensions)) {
    for (const dimension of opportunity.dimensions) {
      if (isOpportunityDimension(dimension?.dimension) && !dimensionMap.has(dimension.dimension)) {
        dimensionMap.set(dimension.dimension, dimension);
      }
    }
  }

  const contributions: OpportunityContribution[] = [];
  const validWeights = weightResult.valid ? (weights as OpportunityWeights) : null;
  if (validWeights) {
    for (const dimension of OPPORTUNITY_DIMENSIONS) {
      const entry = dimensionMap.get(dimension);
      if (!entry || typeof entry.value !== "number" || !Number.isFinite(entry.value) || entry.value < 0 || entry.value > 100) continue;
      if (!Array.isArray(entry.evidenceIds) || entry.evidenceIds.length === 0 || entry.evidenceIds.some((id) => !isNonEmptyString(id))) continue;
      if (!isNonEmptyString(entry.reasoning) || !isEvidenceKind(entry.evidenceKind)) continue;
      contributions.push({
        dimension,
        value: entry.value,
        weight: validWeights[dimension],
        contribution: entry.value * validWeights[dimension] / 100,
        evidenceIds: [...entry.evidenceIds],
        reasoning: entry.reasoning,
        evidenceKind: entry.evidenceKind,
      });
    }
  }
  if (issues.length > 0 || contributions.length !== OPPORTUNITY_DIMENSIONS.length) {
    return { opportunityId, status: "incomplete", total: null, contributions: [], issues };
  }
  return {
    opportunityId: opportunityId as OpportunityId,
    status: "complete",
    total: contributions.reduce((sum, item) => sum + item.contribution, 0),
    contributions,
    issues: [],
  };
}

const candidateSetIssues = (opportunities: readonly unknown[]): CandidateIssue[] => {
  const issues: CandidateIssue[] = [];
  const ids = opportunities.map(candidateId);
  ids.forEach((id, index) => {
    if (!validOpportunityId(id)) {
      issues.push({ kind: "candidate", code: "invalid_id", candidateIndex: index, id, message: "Candidate ID must be one of the fixed opportunity IDs." });
    }
  });
  for (const id of OPPORTUNITY_IDS) {
    const matches = ids.filter((candidate) => candidate === id).length;
    if (matches === 0) issues.push({ kind: "candidate", code: "missing_id", id, message: `Missing candidate ${id}.` });
    if (matches > 1) issues.push({ kind: "candidate", code: "duplicate_id", id, message: `Duplicate candidate ${id}.` });
  }
  if (ids.length > OPPORTUNITY_IDS.length) {
    for (let index = OPPORTUNITY_IDS.length; index < ids.length; index += 1) {
      issues.push({ kind: "candidate", code: "extra_candidate", candidateIndex: index, id: ids[index], message: "Ranking accepts exactly the three fixed candidates." });
    }
  }
  return issues;
};

export function rankOpportunities(opportunities: readonly Opportunity[], weights: unknown): RankingResult {
  const setIssues = candidateSetIssues(opportunities);
  const issues: OpportunityIssue[] = [...setIssues];
  if (issues.length > 0) {
    return {
      status: "incomplete",
      winnerId: null,
      scores: [],
      issues,
    };
  }
  const scores = OPPORTUNITY_IDS.map((id) => {
    const candidate = opportunities.find((item) => candidateId(item) === id);
    return candidate ? scoreOpportunity(candidate, weights) : { opportunityId: id, status: "incomplete", total: null, contributions: [], issues: [{ kind: "candidate", code: "missing_id", id, message: `Missing candidate ${id}.` }] } as OpportunityScore;
  });
  const scoreIssues: OpportunityIssue[] = scores.flatMap((score) => score.issues);
  if (scoreIssues.length > 0 || scores.some((score) => score.status !== "complete")) {
    return { status: "incomplete", winnerId: null, scores, issues: scoreIssues };
  }
  const completeScores = scores as Array<Extract<OpportunityScore, { status: "complete" }>>;
  const ordered = [...completeScores].sort((a, b) => b.total - a.total);
  const lead = ordered[0].total - ordered[1].total;
  if (lead >= 3) return { status: "winner", winnerId: ordered[0].opportunityId, scores, issues: [] };
  return { status: "no_clear_winner", winnerId: null, scores, issues: [] };
}
