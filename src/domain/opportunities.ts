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

export const OPPORTUNITY_DISPLAY_NAMES: Record<OpportunityId, string> = {
  easy_clean: "Easy-clean design",
  quiet_durable: "Quiet and durable design",
  low_consumables: "Low consumables cost design",
};

export type OpportunityWeights = Record<OpportunityDimension, number>;

export interface DimensionScore {
  dimension: OpportunityDimension;
  value: number | null;
  evidenceIds: string[];
  reasoning: string;
  evidenceKind: string;
}

export interface Opportunity {
  id: OpportunityId;
  displayName: string;
  dimensions: DimensionScore[];
}

export interface WeightIssue {
  kind: "weights";
  code: "missing_key" | "extra_key" | "not_finite" | "negative" | "total";
  key?: string;
  message: string;
}

export interface DimensionIssue {
  kind: "dimension";
  dimension?: string;
  code: "missing" | "duplicate" | "extra" | "invalid_value" | "missing_evidence";
  message: string;
}

export type OpportunityIssue = WeightIssue | DimensionIssue;

export type WeightValidation =
  | { valid: true; issues: [] }
  | { valid: false; issues: WeightIssue[] };

export interface OpportunityContribution {
  dimension: OpportunityDimension;
  value: number;
  weight: number;
  contribution: number;
  evidenceIds: string[];
  reasoning: string;
  evidenceKind: string;
}

export type OpportunityScore =
  | {
      opportunityId: OpportunityId;
      status: "complete";
      total: number;
      contributions: OpportunityContribution[];
      issues: [];
    }
  | {
      opportunityId: OpportunityId;
      status: "incomplete";
      total: null;
      contributions: OpportunityContribution[];
      issues: OpportunityIssue[];
    };

export type RankingResult =
  | {
      status: "winner";
      winnerId: OpportunityId;
      scores: OpportunityScore[];
      issues: [];
    }
  | {
      status: "no_clear_winner";
      winnerId: null;
      scores: OpportunityScore[];
      issues: [];
    }
  | {
      status: "incomplete";
      winnerId: null;
      scores: OpportunityScore[];
      issues: OpportunityIssue[];
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

const validateDimensions = (input: unknown): DimensionIssue[] => {
  if (!Array.isArray(input)) {
    return [{ kind: "dimension", code: "missing", message: "Dimensions must be an array." }];
  }
  const issues: DimensionIssue[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    const dimension = item && typeof item === "object" && "dimension" in item ? String((item as { dimension?: unknown }).dimension) : "unknown";
    if (!isOpportunityDimension(dimension)) {
      issues.push({ kind: "dimension", code: "extra", dimension, message: `Unexpected dimension ${dimension}.` });
      continue;
    }
    if (seen.has(dimension)) {
      issues.push({ kind: "dimension", code: "duplicate", dimension, message: `Duplicate dimension ${dimension}.` });
    }
    seen.add(dimension);
    const value = item && typeof item === "object" ? (item as { value?: unknown }).value : undefined;
    const evidenceIds = item && typeof item === "object" ? (item as { evidenceIds?: unknown }).evidenceIds : undefined;
    if (value === null) {
      issues.push({ kind: "dimension", code: "missing", dimension, message: `Dimension ${dimension} is missing.` });
    } else if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
      issues.push({ kind: "dimension", code: "invalid_value", dimension, message: `Dimension ${dimension} must be null or a finite value from 0 to 100.` });
    }
    if (value !== null && Array.isArray(evidenceIds) && evidenceIds.length === 0) {
      issues.push({ kind: "dimension", code: "missing_evidence", dimension, message: `Dimension ${dimension} needs evidence IDs when it has a value.` });
    }
  }
  for (const dimension of OPPORTUNITY_DIMENSIONS) {
    if (!seen.has(dimension)) {
      issues.push({ kind: "dimension", code: "missing", dimension, message: `Missing dimension ${dimension}.` });
    }
  }
  return issues;
};

export function scoreOpportunity(opportunity: Opportunity, weights: unknown): OpportunityScore {
  const opportunityId = opportunity?.id;
  const safeId = (OPPORTUNITY_IDS as readonly unknown[]).includes(opportunityId) ? opportunityId as OpportunityId : "easy_clean";
  const weightResult = validateWeights(weights);
  const dimensionIssues = validateDimensions(opportunity && typeof opportunity === "object" ? opportunity.dimensions : undefined);
  const issues: OpportunityIssue[] = [
    ...(weightResult.valid ? [] : weightResult.issues),
    ...dimensionIssues,
  ];
  const validWeights = weightResult.valid ? (weights as OpportunityWeights) : null;
  const dimensionMap = new Map<OpportunityDimension, DimensionScore>();

  if (Array.isArray(opportunity?.dimensions)) {
    for (const dimension of opportunity.dimensions) {
      if (isOpportunityDimension(dimension?.dimension) && !dimensionMap.has(dimension.dimension)) {
        dimensionMap.set(dimension.dimension, dimension);
      }
    }
  }
  const contributions: OpportunityContribution[] = [];
  for (const dimension of OPPORTUNITY_DIMENSIONS) {
    const entry = dimensionMap.get(dimension);
    if (!entry || typeof entry.value !== "number" || !Number.isFinite(entry.value) || entry.value < 0 || entry.value > 100) continue;
    const weight = validWeights ? validWeights[dimension] : 0;
    contributions.push({ dimension, value: entry.value, weight, contribution: entry.value * weight / 100, evidenceIds: [...entry.evidenceIds], reasoning: entry.reasoning, evidenceKind: entry.evidenceKind });
  }
  if (issues.length > 0 || contributions.length !== OPPORTUNITY_DIMENSIONS.length) {
    return { opportunityId: safeId, status: "incomplete", total: null, contributions, issues };
  }
  return { opportunityId: safeId, status: "complete", total: contributions.reduce((sum, item) => sum + item.contribution, 0), contributions, issues: [] };
}

export function rankOpportunities(opportunities: Opportunity[], weights: unknown): RankingResult {
  const ids = opportunities.map((item) => item?.id);
  const exactIds = ids.length === OPPORTUNITY_IDS.length && new Set(ids).size === OPPORTUNITY_IDS.length && OPPORTUNITY_IDS.every((id) => ids.includes(id));
  const scores = exactIds ? OPPORTUNITY_IDS.map((id) => scoreOpportunity(opportunities.find((item) => item.id === id) as Opportunity, weights)) : opportunities.map((item) => scoreOpportunity(item, weights));
  const issues: OpportunityIssue[] = exactIds ? scores.flatMap((score) => score.issues) : [{ kind: "dimension", code: "extra", message: "Ranking requires exactly one candidate for each fixed opportunity ID." }];
  if (issues.length > 0 || scores.some((score) => score.status !== "complete")) return { status: "incomplete", winnerId: null, scores, issues };
  const ordered = [...scores].sort((a, b) => (b.status === "complete" ? b.total : -Infinity) - (a.status === "complete" ? a.total : -Infinity));
  const lead = (ordered[0] as Extract<OpportunityScore, { status: "complete" }>).total - (ordered[1] as Extract<OpportunityScore, { status: "complete" }>).total;
  if (lead >= 3) return { status: "winner", winnerId: ordered[0].opportunityId, scores, issues: [] };
  return { status: "no_clear_winner", winnerId: null, scores, issues: [] };
}
