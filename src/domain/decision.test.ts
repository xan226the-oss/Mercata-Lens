import { describe, expect, it } from "vitest";
import {
  buildDecisionReport,
  normalizeDecisionConditions,
  type DecisionInput,
} from "./decision";
import type { EconomicResult } from "./economics";
import type { RankingResult } from "./opportunities";
import type { QualityReport } from "./types";

const quality = (blockingIssues: QualityReport["blockingIssues"] = []): QualityReport => ({
  blockingIssues,
  warnings: [],
  moduleAvailability: {
    category: "available",
    pain_points: "available",
    economics: "incomplete",
    opportunities: "available",
  },
  summary: { validProducts: 3, validReviews: 10, duplicateProducts: 0, duplicateReviews: 0 },
});

const winner: RankingResult = {
  status: "winner",
  winnerId: "easy_clean",
  scores: [],
  issues: [],
};

const noClearWinner: RankingResult = {
  status: "no_clear_winner",
  winnerId: null,
  scores: [],
  issues: [],
};

const incompleteRanking: RankingResult = {
  status: "incomplete",
  winnerId: null,
  scores: [],
  issues: [],
};

const completeEconomics: EconomicResult = {
  status: "complete",
  contributionCents: 100,
  marginRate: 0.2,
  referralFeeCents: 10,
  totalCostCents: 400,
  assumptions: ["salePriceCents"],
};

const incompleteEconomics: EconomicResult = {
  status: "incomplete",
  missingFields: ["salePriceCents"],
  partialKnownCostsCents: 0,
};

function input(overrides: Partial<DecisionInput> = {}): DecisionInput {
  return {
    quality: quality(),
    painPointsAvailable: true,
    ranking: winner,
    economics: {
      easy_clean: [completeEconomics],
      quiet_durable: [completeEconomics],
      low_consumables: [completeEconomics],
    },
    supportEvidenceIds: ["review:r1", "review:r1", "economics:base"],
    oppositionEvidenceIds: ["review:r2", "review:r2"],
    assumptions: ["Demo assumption"],
    missingData: [],
    userConditions: {
      continueConditions: ["  collect more reviews  ", "", "collect more reviews"],
      pauseConditions: ["  stop if contribution is negative  "],
      stopConditions: ["Stop when a human audit is complete"],
    },
    triggeredStopConditions: [],
    ...overrides,
  };
}

describe("normalizeDecisionConditions", () => {
  it("removes blank entries, trims for matching, preserves non-blank text and order", () => {
    expect(normalizeDecisionConditions({
      continueConditions: ["  first  ", " ", "second"],
      pauseConditions: [" pause "],
      stopConditions: [" stop ", "stop"],
    })).toEqual({
      continueConditions: ["  first  ", "second"],
      pauseConditions: [" pause "],
      stopConditions: [" stop ", "stop"],
    });
  });
});

describe("buildDecisionReport truth table", () => {
  it("covers the complete precedence truth table before pause evaluation", () => {
    const matchingStop = "Stop when a human audit is complete";
    const cases: Array<{ name: string; overrides: Partial<DecisionInput>; expected: "insufficient_evidence" | "pause" }> = [
      {
        name: "blocking quality issue",
        overrides: { quality: quality([{ row: 1, field: "x", code: "required", value: null, message: "missing" }]) },
        expected: "insufficient_evidence",
      },
      { name: "pain points unavailable", overrides: { painPointsAvailable: false }, expected: "insufficient_evidence" },
      { name: "ranking incomplete", overrides: { ranking: incompleteRanking }, expected: "insufficient_evidence" },
      {
        name: "all economics incomplete",
        overrides: { economics: { easy_clean: [incompleteEconomics], quiet_durable: [incompleteEconomics], low_consumables: [incompleteEconomics] } },
        expected: "insufficient_evidence",
      },
      { name: "all blockers absent with exact stop", overrides: { }, expected: "pause" },
    ];

    for (const testCase of cases) {
      expect(buildDecisionReport(input({ ...testCase.overrides, triggeredStopConditions: [matchingStop] })).status, testCase.name).toBe(testCase.expected);
    }
  });

  it("gives quality precedence over a triggered stop condition", () => {
    const report = buildDecisionReport(input({
      quality: quality([{ row: 1, field: "x", code: "required", value: null, message: "missing" }]),
      triggeredStopConditions: ["Stop when a human audit is complete"],
    }));
    expect(report.status).toBe("insufficient_evidence");
    expect(report.triggeredStopConditions).toEqual(["Stop when a human audit is complete"]);
  });

  it("returns insufficient_evidence when pain points are unavailable", () => {
    expect(buildDecisionReport(input({ painPointsAvailable: false })).status).toBe("insufficient_evidence");
  });

  it("returns insufficient_evidence for incomplete ranking or all incomplete economics", () => {
    expect(buildDecisionReport(input({ ranking: incompleteRanking })).status).toBe("insufficient_evidence");
    expect(buildDecisionReport(input({ economics: {
      easy_clean: [incompleteEconomics], quiet_durable: [incompleteEconomics], low_consumables: [incompleteEconomics],
    } })).status).toBe("insufficient_evidence");
  });

  it("pauses only for an exact user-authored stop condition", () => {
    expect(buildDecisionReport(input({ triggeredStopConditions: ["Stop when a human audit is complete"] })).status).toBe("pause");
    expect(buildDecisionReport(input({ triggeredStopConditions: ["unknown trigger"] })).status).toBe("continue_research");
    expect(buildDecisionReport(input({ triggeredStopConditions: ["stop when a human audit is complete"] })).status).toBe("continue_research");
    expect(buildDecisionReport(input({ triggeredStopConditions: ["prefix Stop when a human audit is complete"] })).status).toBe("continue_research");
  });

  it("keeps exact triggers only, including duplicates and blank values", () => {
    const report = buildDecisionReport(input({
      triggeredStopConditions: ["", "  ", "Stop when a human audit is complete", "Stop when a human audit is complete", " Stop when a human audit is complete "],
    }));
    expect(report.status).toBe("pause");
    expect(report.triggeredStopConditions).toEqual(["Stop when a human audit is complete"]);
  });

  it("accepts one complete economics result even when another is incomplete or invalid", () => {
    const report = buildDecisionReport(input({
      economics: {
        easy_clean: [completeEconomics],
        quiet_durable: [incompleteEconomics],
        low_consumables: [{ status: "invalid", issues: [] }],
      },
    }));
    expect(report.status).toBe("continue_research");
  });

  it("returns continue_research for negative economics without automatically pausing", () => {
    const negative: EconomicResult = {
      status: "complete",
      contributionCents: -50,
      marginRate: -0.1,
      referralFeeCents: 10,
      totalCostCents: 550,
      assumptions: ["salePriceCents"],
    };
    const report = buildDecisionReport(input({
      economics: { easy_clean: [negative], quiet_durable: [negative], low_consumables: [negative] },
    }));
    expect(report.status).toBe("continue_research");
  });

  it("does not pause for a real low-score, high-risk, complete ranking", () => {
    const ranking: RankingResult = {
      status: "winner",
      winnerId: "easy_clean",
      scores: [
        {
          opportunityId: "easy_clean",
          status: "complete",
          total: 12,
          contributions: [{
            dimension: "risk",
            value: 10,
            weight: 10,
            contribution: 1,
            evidenceIds: ["risk:high"],
            reasoning: "Observed risk remains high and needs validation.",
            evidenceKind: "observed",
          }],
          issues: [],
        },
      ],
      issues: [],
    } as RankingResult;
    const report = buildDecisionReport(input({ ranking }));
    expect(report.status).toBe("continue_research");
    expect(report.ranking.scores[0].total).toBe(12);
  });

  it("does not infer a stop from review text, score, economics, or risk", () => {
    const report = buildDecisionReport(input({
      triggeredStopConditions: ["negative review text", "low score", "negative economics", "risk is high"],
    }));
    expect(report.status).toBe("continue_research");
    expect(report.triggeredStopConditions).toEqual([]);
  });

  it("returns stable evidence IDs and deeply defensive copies without mutating input", () => {
    const source = input({
      supportEvidenceIds: ["a", "b", "a"],
      oppositionEvidenceIds: ["c", "c"],
      assumptions: ["assumption"],
      missingData: ["missing"],
      nextActions: [{ owner: "owner", action: "action", evidenceExpected: "evidence" }],
      limitations: ["custom limitation"],
      userConditions: {
        continueConditions: ["continue"],
        pauseConditions: ["pause"],
        stopConditions: ["stop"],
      },
      triggeredStopConditions: ["stop", "stop"],
      ranking: {
        status: "incomplete",
        winnerId: null,
        scores: [{
          opportunityId: "easy_clean",
          status: "incomplete",
          total: null,
          contributions: [{
            dimension: "demand",
            value: 60,
            weight: 30,
            contribution: 18,
            evidenceIds: ["review:1", "review:1"],
            reasoning: "Observed review evidence.",
            evidenceKind: "observed",
          }],
          issues: [{ kind: "dimension", code: "missing", dimension: "risk", message: "Risk evidence is missing." }],
        }],
        issues: [{ kind: "dimension", code: "missing", dimension: "risk", message: "Risk evidence is missing." }],
      } as unknown as RankingResult,
    });
    const before = JSON.stringify(source);
    const first = buildDecisionReport(source);
    const second = buildDecisionReport(source);
    expect(first).toEqual(second);
    expect(first.supportEvidenceIds).toEqual(["a", "b"]);
    expect(first.oppositionEvidenceIds).toEqual(["c"]);
    expect(first.triggeredStopConditions).toEqual(["stop"]);
    first.supportEvidenceIds.push("mutated");
    first.oppositionEvidenceIds.push("mutated");
    first.assumptions.push("mutated");
    first.missingData.push("mutated");
    first.continueConditions.push("mutated");
    first.pauseConditions.push("mutated");
    first.stopConditions.push("mutated");
    first.triggeredStopConditions.push("mutated");
    first.limitations.push("mutated");
    first.nextActions[0].action = "mutated";
    (first.ranking.scores[0].contributions[0].evidenceIds as string[]).push("mutated");
    const firstContribution = first.ranking.scores[0].contributions[0] as unknown as { reasoning: string };
    firstContribution.reasoning = "mutated";
    const firstScoreIssue = first.ranking.scores[0].issues[0] as unknown as { message: string };
    firstScoreIssue.message = "mutated";
    (first.ranking.scores[0].issues as Array<{ kind: "dimension"; code: "missing"; dimension: string; message: string }>).push({ kind: "dimension", code: "missing", dimension: "economics", message: "mutated" });
    (first.ranking.issues as Array<{ kind: "dimension"; code: "missing"; dimension: string; message: string }>).push({ kind: "dimension", code: "missing", dimension: "economics", message: "mutated" });
    expect(JSON.stringify(source)).toBe(before);
    expect(buildDecisionReport(source)).toEqual(second);
  });

  it("keeps empty inputs deterministic and reports missing evidence", () => {
    const report = buildDecisionReport(input({
      supportEvidenceIds: [],
      oppositionEvidenceIds: [],
      assumptions: [],
      missingData: ["  explicit gap  "],
      economics: { easy_clean: [], quiet_durable: [], low_consumables: [] },
    }));
    expect(report.status).toBe("insufficient_evidence");
    expect(report.missingData).toContain("  explicit gap  ");
    expect(report.supportEvidenceIds).toEqual([]);
    expect(report.oppositionEvidenceIds).toEqual([]);
  });

  it("continues research by default and handles no clear winner without forcing a winner", () => {
    const report = buildDecisionReport(input({ ranking: noClearWinner }));
    expect(report.status).toBe("continue_research");
    expect(report.ranking.status).toBe("no_clear_winner");
    expect(report.nextActions).toContainEqual(expect.objectContaining({ owner: "researcher", action: expect.stringContaining("tie") }));
  });
});
