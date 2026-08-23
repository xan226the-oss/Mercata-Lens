import type { DataProvenance, EconomicInputs, EconomicScenario, SourceKind } from "../domain/types";

const SCENARIO_IDS = ["pessimistic", "base", "optimistic"] as const;

type ScenarioId = (typeof SCENARIO_IDS)[number];

const LABELS: Record<ScenarioId, string> = {
  pessimistic: "Pessimistic scenario",
  base: "Base scenario",
  optimistic: "Optimistic scenario",
};

const DEMO_INPUTS: Record<ScenarioId, EconomicInputs> = {
  pessimistic: {
    salePriceCents: 2999,
    sourcingCostCents: 1400,
    inboundFreightCents: 450,
    referralFeeRate: 0.15,
    fulfillmentCostCents: 650,
    advertisingCostCents: 600,
    returnLossCents: 200,
    otherCostCents: 100,
  },
  base: {
    salePriceCents: 3999,
    sourcingCostCents: 1200,
    inboundFreightCents: 300,
    referralFeeRate: 0.15,
    fulfillmentCostCents: 650,
    advertisingCostCents: 400,
    returnLossCents: 100,
    otherCostCents: 49,
  },
  optimistic: {
    salePriceCents: 4499,
    sourcingCostCents: 1000,
    inboundFreightCents: 250,
    referralFeeRate: 0.15,
    fulfillmentCostCents: 600,
    advertisingCostCents: 250,
    returnLossCents: 75,
    otherCostCents: 25,
  },
};

const INPUT_KEYS: (keyof EconomicInputs)[] = [
  "salePriceCents",
  "sourcingCostCents",
  "inboundFreightCents",
  "referralFeeRate",
  "fulfillmentCostCents",
  "advertisingCostCents",
  "returnLossCents",
  "otherCostCents",
];

function emptyInputs(): EconomicInputs {
  return Object.fromEntries(INPUT_KEYS.map((key) => [key, null])) as unknown as EconomicInputs;
}

function provenanceFor(sourceKind: SourceKind, scenario: ScenarioId): EconomicScenario["provenance"] {
  if (sourceKind === "user_upload") return emptyInputs() as EconomicScenario["provenance"];
  return Object.fromEntries(
    INPUT_KEYS.map((key) => [
      key,
      {
        sourceKind: "demo",
        evidenceKind: "assumption",
        sourceUrl: null,
        observedAt: null,
        note: `Demo assumption: ${scenario} scenario input supplied for local calculation practice.`,
      } satisfies DataProvenance,
    ]),
  ) as EconomicScenario["provenance"];
}

export function createEconomicScenarios(sourceKind: SourceKind): EconomicScenario[] {
  return SCENARIO_IDS.map((id) => ({
    id,
    label: LABELS[id],
    inputs: sourceKind === "demo" ? { ...DEMO_INPUTS[id] } : emptyInputs(),
    provenance: provenanceFor(sourceKind, id),
  }));
}

export function cloneEconomicScenario(scenario: EconomicScenario): EconomicScenario {
  return {
    ...scenario,
    inputs: { ...scenario.inputs },
    provenance: { ...scenario.provenance },
  };
}
