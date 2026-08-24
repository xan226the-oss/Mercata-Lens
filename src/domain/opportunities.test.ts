import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPPORTUNITY_WEIGHTS,
  OPPORTUNITY_DIMENSIONS,
  OPPORTUNITY_IDS,
  OPPORTUNITY_DISPLAY_NAMES,
  rankOpportunities,
  scoreOpportunity,
  validateWeights,
  type DimensionScore,
  type Opportunity,
  type OpportunityWeights,
} from "./opportunities";

const dimensions = (overrides: Partial<Record<DimensionScore["dimension"], Partial<DimensionScore>>> = {}): DimensionScore[] =>
  OPPORTUNITY_DIMENSIONS.map((dimension) => ({
    dimension,
    value: 50,
    evidenceIds: [`${dimension}-evidence`],
    reasoning: `${dimension} reasoning`,
    evidenceKind: "assumption",
    ...overrides[dimension],
  }));

const opportunity = (id: Opportunity["id"], overrides: Partial<Opportunity> = {}): Opportunity => ({
  id,
  displayName: OPPORTUNITY_DISPLAY_NAMES[id],
  dimensions: dimensions(),
  ...overrides,
});

const completeWeights = (): OpportunityWeights => ({ ...DEFAULT_OPPORTUNITY_WEIGHTS });

const completeScores = (values: [number, number, number]): Opportunity[] =>
  OPPORTUNITY_IDS.map((id, index) => opportunity(id, {
    dimensions: dimensions({
      demand: { value: values[index] },
      supply_gap: { value: 50 },
      economics: { value: 50 },
      differentiation: { value: 50 },
      risk: { value: 50 },
    }),
  }));

describe("opportunity scoring contracts", () => {
  it("exports the exact fixed IDs, names, dimensions, and default weights", () => {
    expect(OPPORTUNITY_IDS).toEqual(["easy_clean", "quiet_durable", "low_consumables"]);
    expect(OPPORTUNITY_DISPLAY_NAMES).toEqual({
      easy_clean: "Easy-clean design",
      quiet_durable: "Quiet and durable design",
      low_consumables: "Low consumables cost design",
    });
    expect(OPPORTUNITY_DIMENSIONS).toEqual([
      "demand",
      "supply_gap",
      "economics",
      "differentiation",
      "risk",
    ]);
    expect(DEFAULT_OPPORTUNITY_WEIGHTS).toEqual({
      demand: 30,
      supply_gap: 25,
      economics: 20,
      differentiation: 15,
      risk: 10,
    });
  });

  it.each([
    ["missing key", { demand: 30, supply_gap: 25, economics: 20, differentiation: 15 }],
    ["extra key", { ...completeWeights(), extra: 10 }],
    ["negative value", { ...completeWeights(), risk: -1 }],
    ["NaN", { ...completeWeights(), demand: Number.NaN }],
    ["infinity", { ...completeWeights(), demand: Number.POSITIVE_INFINITY }],
    ["99.99 total", { ...completeWeights(), risk: 9.99 }],
    ["100.01 total", { ...completeWeights(), risk: 10.01 }],
  ])("rejects %s with stable issues and does not throw", (_label, weights) => {
    const result = validateWeights(weights);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("accepts fractional weights only when their exact total is 100", () => {
    expect(validateWeights({ demand: 30.5, supply_gap: 24.5, economics: 20, differentiation: 15, risk: 10 })).toEqual({ valid: true, issues: [] });
  });

  it("does not mutate weights", () => {
    const weights = completeWeights();
    const before = structuredClone(weights);
    validateWeights(weights);
    expect(weights).toEqual(before);
  });

  it("calculates the hand-checked score and retains per-dimension evidence", () => {
    const result = scoreOpportunity(opportunity("easy_clean", {
      dimensions: dimensions({
        demand: { value: 80, evidenceIds: ["review-1"] },
        supply_gap: { value: 60, evidenceIds: ["product-1"] },
        economics: { value: 40, evidenceIds: ["base-economics"] },
        differentiation: { value: 20, evidenceIds: ["assumption-1"] },
        risk: { value: 10, evidenceIds: ["risk-1"] },
      }),
    }), completeWeights());

    expect(result).toMatchObject({ opportunityId: "easy_clean", status: "complete", total: 51, issues: [] });
    if (result.status === "complete") {
      expect(result.contributions).toEqual([
        expect.objectContaining({ dimension: "demand", value: 80, weight: 30, contribution: 24, evidenceIds: ["review-1"] }),
        expect.objectContaining({ dimension: "supply_gap", value: 60, weight: 25, contribution: 15, evidenceIds: ["product-1"] }),
        expect.objectContaining({ dimension: "economics", value: 40, weight: 20, contribution: 8, evidenceIds: ["base-economics"] }),
        expect.objectContaining({ dimension: "differentiation", value: 20, weight: 15, contribution: 3, evidenceIds: ["assumption-1"] }),
        expect.objectContaining({ dimension: "risk", value: 10, weight: 10, contribution: 1, evidenceIds: ["risk-1"] }),
      ]);
    }
  });

  it("treats zero as valid and null as missing without mutating the opportunity", () => {
    const input = opportunity("easy_clean", { dimensions: dimensions({ demand: { value: 0 }, economics: { value: null, evidenceIds: [] } }) });
    const before = structuredClone(input);
    const result = scoreOpportunity(input, completeWeights());
    expect(result.status).toBe("incomplete");
    expect(result.issues).toEqual([expect.objectContaining({ dimension: "economics" })]);
    expect(input).toEqual(before);
  });

  it("rejects invalid, duplicate, missing, and extra dimensions", () => {
    const invalid = opportunity("easy_clean", { dimensions: [
      ...dimensions().filter(({ dimension }) => dimension !== "risk"),
      { dimension: "risk", value: 101, evidenceIds: ["bad"], reasoning: "bad", evidenceKind: "assumption" },
      { dimension: "risk", value: 20, evidenceIds: ["duplicate"], reasoning: "bad", evidenceKind: "assumption" },
    ] });
    const result = scoreOpportunity(invalid, completeWeights());
    expect(result.status).toBe("incomplete");
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ dimension: "risk" }),
    ]));
  });

  it("returns incomplete for invalid weights", () => {
    const result = scoreOpportunity(opportunity("easy_clean"), { ...completeWeights(), risk: 11 });
    expect(result.status).toBe("incomplete");
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "weights" })]));
  });
});

describe("rankOpportunities", () => {
  it("returns a winner only at an exact three-point lead", () => {
    const result = rankOpportunities(completeScores([60, 50, 40]), completeWeights());
    expect(result.status).toBe("winner");
    expect(result.winnerId).toBe("easy_clean");
  });

  it("returns no_clear_winner below three points and for exact ties", () => {
    expect(rankOpportunities(completeScores([60, 50.00333333333333, 40]), completeWeights()).status).toBe("no_clear_winner");
    expect(rankOpportunities(completeScores([60, 60, 40]), completeWeights())).toMatchObject({ status: "no_clear_winner", winnerId: null });
  });

  it("returns incomplete when any candidate is incomplete or IDs are not exactly the fixed three", () => {
    const incomplete = opportunity("easy_clean", { dimensions: dimensions({ demand: { value: null, evidenceIds: [] } }) });
    expect(rankOpportunities([incomplete, ...completeScores([50, 40, 30]).slice(1)], completeWeights()).status).toBe("incomplete");
    expect(rankOpportunities([opportunity("easy_clean"), opportunity("easy_clean"), opportunity("quiet_durable")], completeWeights()).status).toBe("incomplete");
    expect(rankOpportunities([opportunity("easy_clean"), opportunity("quiet_durable")], completeWeights()).status).toBe("incomplete");
  });

  it("keeps stable candidate order for ties without turning ties into winners", () => {
    const input = completeScores([50, 50, 50]);
    const before = structuredClone(input);
    const result = rankOpportunities(input, completeWeights());
    expect(result.status).toBe("no_clear_winner");
    expect(result.scores.map(({ opportunityId }) => opportunityId)).toEqual(OPPORTUNITY_IDS);
    expect(input).toEqual(before);
  });
});
