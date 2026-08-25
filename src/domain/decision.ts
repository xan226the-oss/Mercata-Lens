import type { EconomicResult } from "./economics";
import type { OpportunityId, RankingResult } from "./opportunities";
import type { QualityReport, ResearchState } from "./types";

export type DecisionStatus = "continue_research" | "insufficient_evidence" | "pause";

export interface ValidationAction {
  owner: string;
  action: string;
  evidenceExpected: string;
}

export interface DecisionConditions {
  continueConditions: string[];
  pauseConditions: string[];
  stopConditions: string[];
}

export interface DecisionInput {
  quality: QualityReport;
  painPointsAvailable: boolean;
  ranking: RankingResult;
  economics: Record<OpportunityId, EconomicResult[]>;
  supportEvidenceIds: string[];
  oppositionEvidenceIds: string[];
  assumptions: string[];
  missingData: string[];
  userConditions: DecisionConditions | ResearchState["decisionDraft"];
  triggeredStopConditions: string[];
  nextActions?: ValidationAction[];
  limitations?: string[];
}

export interface DecisionReport {
  status: DecisionStatus;
  ranking: RankingResult;
  supportEvidenceIds: string[];
  oppositionEvidenceIds: string[];
  assumptions: string[];
  missingData: string[];
  nextActions: ValidationAction[];
  continueConditions: string[];
  pauseConditions: string[];
  stopConditions: string[];
  triggeredStopConditions: string[];
  limitations: string[];
}

const FIXED_LIMITATIONS = [
  "This report is a deterministic research aid, not a sales, demand, market-share, sourcing, pricing, launch, or purchase recommendation.",
  "Review counts and pain-point evidence do not establish sales, customers, demand, popularity, or market share.",
] as const;

function stableUnique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

const UNSAFE_ID_SNAPSHOT = {
  kind: "unavailable",
  reason: "candidate_id_not_safely_snapshotable",
} as const;

function unsafeIdSnapshot(): typeof UNSAFE_ID_SNAPSHOT {
  return { ...UNSAFE_ID_SNAPSHOT };
}

function copyCandidateId(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (value === null || (typeof value !== "object" && typeof value !== "function")) return value;
  if (typeof value === "function") return unsafeIdSnapshot();

  const existing = seen.get(value);
  if (existing !== undefined) return existing;

  try {
    if (Array.isArray(value)) {
      const copy: unknown[] = [];
      seen.set(value, copy);
      for (const key of Reflect.ownKeys(value)) {
        if (key === "length") continue;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !("value" in descriptor)) return unsafeIdSnapshot();
        Object.defineProperty(copy, key, {
          ...descriptor,
          value: copyCandidateId(descriptor.value, seen),
        });
      }
      return copy;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return unsafeIdSnapshot();

    const copy = Object.create(prototype) as Record<PropertyKey, unknown>;
    seen.set(value, copy);
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor)) return unsafeIdSnapshot();
      Object.defineProperty(copy, key, {
        ...descriptor,
        value: copyCandidateId(descriptor.value, seen),
      });
    }
    return copy;
  } catch {
    return unsafeIdSnapshot();
  }
}

function copyIssue<T>(issue: T): T {
  if (issue === null || typeof issue !== "object") return issue;
  try {
    const copy: Record<PropertyKey, unknown> = {};
    for (const key of Reflect.ownKeys(issue)) {
      const descriptor = Object.getOwnPropertyDescriptor(issue, key);
      if (!descriptor) continue;
      const value = key === "id"
        ? ("value" in descriptor ? copyCandidateId(descriptor.value) : unsafeIdSnapshot())
        : ("value" in descriptor ? descriptor.value : unsafeIdSnapshot());
      Object.defineProperty(copy, key, { ...descriptor, value, writable: true });
    }
    return copy as T;
  } catch {
    return {
      kind: "candidate",
      code: "invalid_id",
      id: unsafeIdSnapshot(),
      message: "Candidate issue could not be safely snapshotted.",
    } as T;
  }
}

function copyIssues<T>(issues: readonly T[]): T[] {
  return issues.map((issue) => copyIssue(issue));
}

function copyActions(actions: readonly ValidationAction[]): ValidationAction[] {
  return actions.map((action) => ({
    owner: action.owner,
    action: action.action,
    evidenceExpected: action.evidenceExpected,
  }));
}

export function normalizeDecisionConditions(input: DecisionConditions): DecisionConditions {
  const normalize = (values: readonly string[]): string[] => values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value);

  return {
    continueConditions: normalize(input.continueConditions),
    pauseConditions: normalize(input.pauseConditions),
    stopConditions: normalize(input.stopConditions),
  };
}

function allEconomicsIncomplete(economics: DecisionInput["economics"]): boolean {
  const results = Object.values(economics).flat();
  return results.length === 0 || results.every((result) => result.status !== "complete");
}

function defaultMissingData(input: DecisionInput): string[] {
  const missing = [...input.missingData];
  if (input.quality.blockingIssues.length > 0) missing.push("Resolve blocking quality issues.");
  if (!input.painPointsAvailable) missing.push("Pain-point module evidence is unavailable.");
  if (input.ranking.status === "incomplete") missing.push("Complete the opportunity ranking inputs.");
  if (allEconomicsIncomplete(input.economics)) missing.push("Complete at least one relevant economics scenario.");
  return stableUnique(missing);
}

function defaultActions(input: DecisionInput): ValidationAction[] {
  const actions = copyActions(input.nextActions ?? []);
  if (input.ranking.status === "no_clear_winner") {
    actions.push({
      owner: "researcher",
      action: "Collect discriminating evidence to resolve the opportunity tie.",
      evidenceExpected: "A comparable evidence record that separates the tied hypotheses.",
    });
  }
  if (input.ranking.status === "incomplete") {
    actions.push({
      owner: "researcher",
      action: "Complete missing opportunity dimensions and evidence references.",
      evidenceExpected: "A complete ranking result with traceable evidence IDs.",
    });
  }
  if (allEconomicsIncomplete(input.economics)) {
    actions.push({
      owner: "researcher",
      action: "Enter and validate at least one relevant economics scenario.",
      evidenceExpected: "A complete economics result with visible assumptions.",
    });
  }
  if (!input.painPointsAvailable) {
    actions.push({
      owner: "researcher",
      action: "Resolve the pain-point data availability issue.",
      evidenceExpected: "An available pain-point module backed by validated review records.",
    });
  }
  return copyActions(actions);
}

export function buildDecisionReport(input: DecisionInput): DecisionReport {
  const conditions = normalizeDecisionConditions(input.userConditions);
  const triggeredCandidates = input.triggeredStopConditions
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value);
  const stopConditionKeys = new Set(conditions.stopConditions);
  const triggeredStopConditions = stableUnique(
    triggeredCandidates.filter((trigger) => stopConditionKeys.has(trigger)),
  );

  const ranking = {
    ...input.ranking,
    scores: input.ranking.scores.map((score) => ({
      ...score,
      contributions: score.contributions.map((contribution) => ({
        ...contribution,
        evidenceIds: [...contribution.evidenceIds],
      })),
      issues: copyIssues(score.issues),
      })),
      issues: copyIssues(input.ranking.issues),
  } as unknown as RankingResult;

  let status: DecisionStatus = "continue_research";
  if (input.quality.blockingIssues.length > 0 || !input.painPointsAvailable || input.ranking.status === "incomplete" || allEconomicsIncomplete(input.economics)) {
    status = "insufficient_evidence";
  } else if (triggeredStopConditions.length > 0) {
    status = "pause";
  }

  return {
    status,
    ranking,
    supportEvidenceIds: stableUnique(input.supportEvidenceIds),
    oppositionEvidenceIds: stableUnique(input.oppositionEvidenceIds),
    assumptions: [...input.assumptions],
    missingData: defaultMissingData(input),
    nextActions: defaultActions(input),
    continueConditions: [...conditions.continueConditions],
    pauseConditions: [...conditions.pauseConditions],
    stopConditions: [...conditions.stopConditions],
    triggeredStopConditions,
    limitations: [...FIXED_LIMITATIONS, ...(input.limitations ?? [])].filter((value, index, values) => values.indexOf(value) === index),
  };
}
