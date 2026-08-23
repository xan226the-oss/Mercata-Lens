import { describe, expect, it } from "vitest";
import { createEconomicScenarios } from "./economicScenarios";

const scenarioIds = ["pessimistic", "base", "optimistic"] as const;

describe("economic scenario factories", () => {
  it("creates the three independent Demo scenarios with explicit assumptions", () => {
    const scenarios = createEconomicScenarios("demo");

    expect(scenarios.map((scenario) => scenario.id)).toEqual([...scenarioIds]);
    expect(scenarios.map((scenario) => scenario.inputs)).toEqual([
      {
        salePriceCents: 2999,
        sourcingCostCents: 1400,
        inboundFreightCents: 450,
        referralFeeRate: 0.15,
        fulfillmentCostCents: 650,
        advertisingCostCents: 600,
        returnLossCents: 200,
        otherCostCents: 100,
      },
      {
        salePriceCents: 3999,
        sourcingCostCents: 1200,
        inboundFreightCents: 300,
        referralFeeRate: 0.15,
        fulfillmentCostCents: 650,
        advertisingCostCents: 400,
        returnLossCents: 100,
        otherCostCents: 49,
      },
      {
        salePriceCents: 4499,
        sourcingCostCents: 1000,
        inboundFreightCents: 250,
        referralFeeRate: 0.15,
        fulfillmentCostCents: 600,
        advertisingCostCents: 250,
        returnLossCents: 75,
        otherCostCents: 25,
      },
    ]);
    for (const scenario of scenarios) {
      expect(Object.values(scenario.provenance)).toHaveLength(8);
      expect(Object.values(scenario.provenance).every((value) => value?.note.startsWith("Demo assumption:"))).toBe(true);
      expect(Object.values(scenario.provenance).every((value) => value?.evidenceKind === "assumption")).toBe(true);
    }
  });

  it("creates independent empty user-upload scenarios without inheritance", () => {
    const scenarios = createEconomicScenarios("user_upload");

    expect(scenarios.map((scenario) => scenario.id)).toEqual([...scenarioIds]);
    expect(scenarios.every((scenario) => Object.values(scenario.inputs).every((value) => value === null))).toBe(true);
    expect(scenarios.every((scenario) => Object.values(scenario.provenance).every((value) => value === null))).toBe(true);
    scenarios[0].inputs.salePriceCents = 1234;
    expect(scenarios[1].inputs.salePriceCents).toBeNull();
    expect(scenarios[2].inputs.salePriceCents).toBeNull();
  });
});
