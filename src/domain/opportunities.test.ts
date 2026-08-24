import { describe, expect, it } from "vitest";
import type { EconomicScenario, EvidenceKind } from "./types";
import {
  DEFAULT_OPPORTUNITY_WEIGHTS,
  OPPORTUNITY_DIMENSIONS,
  OPPORTUNITY_IDS,
  OPPORTUNITY_NAMES,
  rankOpportunities,
  scoreOpportunity,
  validateWeights,
  type DimensionScore,
  type Opportunity,
  type OpportunityWeights,
} from "./opportunities";

const economics: EconomicScenario[] = [
  {
    id: "pessimistic",
    label: "Pessimistic scenario",
    inputs: {
      salePriceCents: 3499,
      sourcingCostCents: 1400,
      inboundFreightCents: 350,
      referralFeeRate: 0.15,
      fulfillmentCostCents: 700,
      advertisingCostCents: 500,
      returnLossCents: 150,
      otherCostCents: 49,
    },
    provenance: {
      salePriceCents: null,
      sourcingCostCents: null,
      inboundFreightCents: null,
      referralFeeRate: null,
      fulfillmentCostCents: null,
      advertisingCostCents: null,
      returnLossCents: null,
      otherCostCents: null,
    },
  },
  {
    id: "base",
    label: "Base scenario",
    inputs: {
      salePriceCents: 3999,
      sourcingCostCents: 1200,
      inboundFreightCents: 300,
      referralFeeRate: 0.15,
      fulfillmentCostCents: 650,
      advertisingCostCents: 400,
      returnLossCents: 100,
      otherCostCents: 49,
    },
    provenance: {
      salePriceCents: null,
      sourcingCostCents: null,
      inboundFreightCents: null,
      referralFeeRate: null,
      fulfillmentCostCents: null,
      advertisingCostCents: null,
      returnLossCents: null,
      otherCostCents: null,
    },
  },
  {
    id: "optimistic",
    label: "Optimistic scenario",
    inputs: {
      salePriceCents: 4499,
      sourcingCostCents: 1050,
      inboundFreightCents: 250,
      referralFeeRate: 0.15,
      fulfillmentCostCents: 600,
      advertisingCostCents: 300,
      returnLossCents: 75,
      otherCostCents: 49,
    },
    provenance: {
      salePriceCents: null,
      sourcingCostCents: null,
      inboundFreightCents: null,
      referralFeeRate: null,
      fulfillmentCostCents: null,
      advertisingCostCents: null,
      returnLossCents: null,
      otherCostCents: null,
    },
  },
];

const dimensions = (overrides: Partial<Record<DimensionScore["dimension"], Partial<DimensionScore>>> = {}): DimensionScore[] =>
  OPPORTUNITY_DIMENSIONS.map((dimension) => ({
    dimension,
    value: 50,
    evidenceIds: [`${dimension}-evidence`],
    reasoning: `${dimension} reasoning`,
    evidenceKind: "assumption" as EvidenceKind,
    ...overrides[dimension],
  }));

const opportunity = (id: Opportunity["id"] | string, overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: id as Opportunity["id"],
  name: typeof id === "string" && id in OPPORTUNITY_NAMES ? OPPORTUNITY_NAMES[id as Opportunity["id"]] : "Malformed opportunity",
  targetUser: "US cat owners",
  scenario: "A household needs a dependable fountain with explicit trade-offs.",
  dimensions: dimensions(),
  economics,
  supportEvidenceIds: ["support-1"],
  oppositionEvidenceIds: ["opposition-1"],
  unknowns: ["unknown-1"],
  ...overrides,
});

const completeWeights = (): OpportunityWeights => ({ ...DEFAULT_OPPORTUNITY_WEIGHTS });

const completeScores = (values: [number, number, number]): Opportunity[] => OPPORTUNITY_IDS.map((id, index) => opportunity(id, {
  dimensions: dimensions({ demand: { value: values[index] } }),
}));

const issueShape = (issue: { kind: string; code: string; key?: string; dimension?: string }) => ({
  kind: issue.kind,
  code: issue.code,
  key: issue.key,
  dimension: issue.dimension,
});

describe("opportunity contract", () => {
  it("exports immutable fixed names, dimensions, and default weights", () => {
    expect(OPPORTUNITY_IDS).toEqual(["easy_clean", "quiet_durable", "low_consumables"]);
    expect(OPPORTUNITY_NAMES).toEqual({
      easy_clean: "Easy-clean design",
      quiet_durable: "Quiet and durable design",
      low_consumables: "Low consumables cost design",
    });
    expect(Object.isFrozen(OPPORTUNITY_NAMES)).toBe(true);
    expect(OPPORTUNITY_DIMENSIONS).toEqual(["demand", "supply_gap", "economics", "differentiation", "risk"]);
    expect(DEFAULT_OPPORTUNITY_WEIGHTS).toEqual({ demand: 30, supply_gap: 25, economics: 20, differentiation: 15, risk: 10 });
  });

  it("carries the complete Task 7B contract", () => {
    const candidate = opportunity("easy_clean");
    expect(candidate).toMatchObject({
      id: "easy_clean",
      name: "Easy-clean design",
      targetUser: "US cat owners",
      scenario: expect.any(String),
      economics,
      supportEvidenceIds: ["support-1"],
      oppositionEvidenceIds: ["opposition-1"],
      unknowns: ["unknown-1"],
    });
    expect(candidate.economics.map(({ id }) => id)).toEqual(["pessimistic", "base", "optimistic"]);
    expect(candidate.economics).toHaveLength(3);
  });

  it.each([
    ["missing key", { demand: 30, supply_gap: 25, economics: 20, differentiation: 15 }, [
      { kind: "weights", code: "missing_key", key: "risk", dimension: undefined },
    ]],
    ["extra key", { ...completeWeights(), extra: 10 }, [
      { kind: "weights", code: "extra_key", key: "extra", dimension: undefined },
    ]],
    ["negative value", { ...completeWeights(), risk: -1 }, [
      { kind: "weights", code: "negative", key: "risk", dimension: undefined },
      { kind: "weights", code: "total", key: undefined, dimension: undefined },
    ]],
    ["NaN", { ...completeWeights(), demand: Number.NaN }, [
      { kind: "weights", code: "not_finite", key: "demand", dimension: undefined },
    ]],
    ["99.99 total", { ...completeWeights(), risk: 9.99 }, [
      { kind: "weights", code: "total", key: undefined, dimension: undefined },
    ]],
    ["100.01 total", { ...completeWeights(), risk: 10.01 }, [
      { kind: "weights", code: "total", key: undefined, dimension: undefined },
    ]],
  ] as const)("rejects %s with exact stable issue shape", (_label, weights, expected) => {
    const result = validateWeights(weights);
    expect(result.valid).toBe(false);
    expect(result.issues.map(issueShape)).toEqual(expected);
  });

  it("accepts fractional weights with exact total and preserves input", () => {
    const weights = { demand: 30.5, supply_gap: 24.5, economics: 20, differentiation: 15, risk: 10 };
    const before = structuredClone(weights);
    expect(validateWeights(weights)).toEqual({ valid: true, issues: [] });
    expect(weights).toEqual(before);
  });
});

describe("scoreOpportunity validation and scoring", () => {
  it("calculates contributions in canonical dimension order and retains evidence", () => {
    const result = scoreOpportunity(opportunity("easy_clean", { dimensions: dimensions({
      demand: { value: 80, evidenceIds: ["review-1"] },
      supply_gap: { value: 60, evidenceIds: ["product-1"] },
      economics: { value: 40, evidenceIds: ["base-economics"] },
      differentiation: { value: 20, evidenceIds: ["assumption-1"] },
      risk: { value: 10, evidenceIds: ["risk-1"] },
    }) }), completeWeights());
    expect(result).toMatchObject({ opportunityId: "easy_clean", status: "complete", total: 51, issues: [] });
    if (result.status === "complete") {
      expect(result.contributions.map(({ dimension }) => dimension)).toEqual([...OPPORTUNITY_DIMENSIONS]);
      expect(result.contributions.map(({ contribution }) => contribution)).toEqual([24, 15, 8, 3, 1]);
      expect(result.contributions[0].evidenceIds).toEqual(["review-1"]);
    }
  });

  it("preserves economics arrays and nested scenarios during scoring and ranking", () => {
    const input = completeScores([50, 50, 50]);
    const before = structuredClone(input);
    const score = scoreOpportunity(input[0], completeWeights());
    const ranking = rankOpportunities(input, completeWeights());
    expect(score.status).toBe("complete");
    expect(ranking.status).toBe("no_clear_winner");
    expect(input).toEqual(before);
    expect(input[0].economics.map(({ id }) => id)).toEqual(["pessimistic", "base", "optimistic"]);
  });

  it("accepts zero but keeps null missing", () => {
    const result = scoreOpportunity(opportunity("easy_clean", { dimensions: dimensions({ demand: { value: 0 }, economics: { value: null, evidenceIds: [] } }) }), completeWeights());
    expect(result.status).toBe("incomplete");
    expect(result.issues.map(issueShape)).toEqual([{ kind: "dimension", code: "missing", key: undefined, dimension: "economics" }]);
  });

  it.each([
    ["invalid value", { demand: { value: 101 } }, [{ kind: "dimension", code: "invalid_value", dimension: "demand" }]],
    ["duplicate dimension", undefined, [{ kind: "dimension", code: "duplicate", dimension: "risk" }]],
    ["missing dimension", undefined, [{ kind: "dimension", code: "missing", dimension: "risk" }]],
    ["extra dimension", undefined, [{ kind: "dimension", code: "extra", dimension: "unknown" }]],
  ] as const)("returns incomplete for %s with exact issue", (_label, override, expected) => {
    let candidate = opportunity("easy_clean");
    if (override) candidate = opportunity("easy_clean", { dimensions: dimensions(override) });
    if (_label === "duplicate dimension") candidate = opportunity("easy_clean", { dimensions: [...dimensions(), dimensions()[4]] });
    if (_label === "missing dimension") candidate = opportunity("easy_clean", { dimensions: dimensions().filter(({ dimension }) => dimension !== "risk") });
    if (_label === "extra dimension") candidate = opportunity("easy_clean", { dimensions: [...dimensions(), { dimension: "unknown", value: 10, evidenceIds: ["x"], reasoning: "x", evidenceKind: "assumption" } as unknown as DimensionScore] });
    const result = scoreOpportunity(candidate, completeWeights());
    expect(result.status).toBe("incomplete");
    expect(result.issues.map(issueShape)).toEqual(expected.map((issue) => ({ kind: issue.kind, code: issue.code, key: undefined, dimension: issue.dimension })));
  });

  it("returns stable evidence issues for every malformed evidence shape without throwing", () => {
    const malformed = [undefined, null, "evidence", {}, [], ["  "], ["valid", 2]];
    for (const evidenceIds of malformed) {
      const candidate = opportunity("easy_clean", { dimensions: dimensions({ demand: { evidenceIds: evidenceIds as unknown as readonly string[] } }) });
      expect(() => scoreOpportunity(candidate, completeWeights())).not.toThrow();
      const result = scoreOpportunity(candidate, completeWeights());
      expect(result.status).toBe("incomplete");
      expect(result.issues.map(issueShape)).toEqual([{ kind: "dimension", code: "invalid_evidence", key: undefined, dimension: "demand" }]);
    }
  });

  it.each([
    ["malformed reasoning", { reasoning: "   " }, "invalid_reasoning"],
    ["malformed evidenceKind", { evidenceKind: "inferred" as EvidenceKind }, "invalid_evidence_kind"],
  ] as const)("returns incomplete for %s", (_label, override, code) => {
    const result = scoreOpportunity(opportunity("easy_clean", { dimensions: dimensions({ demand: override }) }), completeWeights());
    expect(result.status).toBe("incomplete");
    expect(result.issues.map(issueShape)).toEqual([{ kind: "dimension", code, key: undefined, dimension: "demand" }]);
    expect(result.contributions).toEqual([]);
  });

  it("does not create contributions for invalid weights or mutate nested input", () => {
    const candidate = opportunity("easy_clean");
    const before = structuredClone(candidate);
    const result = scoreOpportunity(candidate, { ...completeWeights(), risk: 11 });
    expect(result).toMatchObject({ status: "incomplete", contributions: [] });
    expect(result.issues.map(issueShape)).toEqual([{ kind: "weights", code: "total", key: undefined, dimension: undefined }]);
    expect(candidate).toEqual(before);
  });

  it("rejects malformed evidence before contribution construction", () => {
    const candidate = opportunity("easy_clean", { dimensions: dimensions({ demand: { evidenceIds: ["ok", ""] } }) });
    const before = structuredClone(candidate);
    const result = scoreOpportunity(candidate, completeWeights());
    expect(result.status).toBe("incomplete");
    expect(result.contributions).toEqual([]);
    expect(candidate).toEqual(before);
  });
});

describe("rankOpportunities", () => {
  it("does not forge an invalid opportunity ID", () => {
    const result = scoreOpportunity(opportunity("not-a-real-id"), completeWeights());
    expect(result).toMatchObject({ status: "incomplete", opportunityId: null, total: null, contributions: [] });
    expect(result.issues).toEqual([{ kind: "candidate", code: "invalid_id", id: "not-a-real-id", message: "Opportunity ID must be one of the fixed opportunity IDs." }]);
  });

  it.each([
    ["duplicate candidate", ["easy_clean", "easy_clean", "quiet_durable"], ["duplicate_id", "missing_id"]],
    ["missing candidate", ["easy_clean", "quiet_durable"], ["missing_id"]],
    ["extra candidate", ["easy_clean", "quiet_durable", "low_consumables", "extra"], ["invalid_id", "extra_candidate"]],
  ] as const)("returns incomplete for %s with candidate issues", (_label, ids, codes) => {
    const result = rankOpportunities(ids.map((id) => opportunity(id)), completeWeights());
    expect(result.status).toBe("incomplete");
    expect(result.issues.map((issue) => ({ kind: issue.kind, code: issue.code, id: "id" in issue ? issue.id : undefined }))).toEqual(codes.map((code) => ({ kind: "candidate", code, id: code === "duplicate_id" ? "easy_clean" : code === "missing_id" ? "low_consumables" : "extra" })));
  });

  it("returns a winner at an exact three-point lead", () => {
    const result = rankOpportunities(completeScores([60, 50, 40]), completeWeights());
    expect(result).toMatchObject({ status: "winner", winnerId: "easy_clean" });
  });

  it("returns no_clear_winner below three points and for an exact tie", () => {
    expect(rankOpportunities(completeScores([60, 50.00333333333333, 40]), completeWeights()).status).toBe("no_clear_winner");
    expect(rankOpportunities(completeScores([60, 60, 40]), completeWeights())).toMatchObject({ status: "no_clear_winner", winnerId: null });
  });

  it("keeps canonical score order and deeply preserves input", () => {
    const input = completeScores([50, 50, 50]);
    const before = structuredClone(input);
    const result = rankOpportunities([...input].reverse(), completeWeights());
    expect(result.status).toBe("no_clear_winner");
    expect(result.scores.map(({ opportunityId }) => opportunityId)).toEqual([...OPPORTUNITY_IDS]);
    expect(input).toEqual(before);
  });

  it("returns incomplete when weights or any score is incomplete", () => {
    expect(rankOpportunities(completeScores([50, 50, 50]), { ...completeWeights(), risk: 11 }).status).toBe("incomplete");
    const incomplete = completeScores([50, 50, 50]);
    incomplete[0] = opportunity("easy_clean", { dimensions: dimensions({ demand: { value: null, evidenceIds: [] } }) });
    expect(rankOpportunities(incomplete, completeWeights()).status).toBe("incomplete");
  });
});
