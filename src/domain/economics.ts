import type { EconomicInputs } from "./types";

export type EconomicInputKey = keyof EconomicInputs;

export interface EconomicIssue {
  field: EconomicInputKey;
  code: "negative" | "not_finite" | "rate_out_of_range";
  message: string;
}

export type EconomicResult =
  | {
      status: "complete";
      contributionCents: number;
      marginRate: number | null;
      referralFeeCents: number;
      totalCostCents: number;
      assumptions: EconomicInputKey[];
    }
  | {
      status: "incomplete";
      missingFields: EconomicInputKey[];
      partialKnownCostsCents: number;
    }
  | { status: "invalid"; issues: EconomicIssue[] };

const INPUT_KEYS: readonly EconomicInputKey[] = [
  "salePriceCents",
  "sourcingCostCents",
  "inboundFreightCents",
  "referralFeeRate",
  "fulfillmentCostCents",
  "advertisingCostCents",
  "returnLossCents",
  "otherCostCents",
];

const COST_KEYS: readonly EconomicInputKey[] = [
  "sourcingCostCents",
  "inboundFreightCents",
  "fulfillmentCostCents",
  "advertisingCostCents",
  "returnLossCents",
  "otherCostCents",
];

function isFiniteInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value);
}

function validate(inputs: EconomicInputs): EconomicIssue[] {
  const issues: EconomicIssue[] = [];

  for (const field of INPUT_KEYS) {
    const value = inputs[field];
    if (value === null) continue;

    if (field === "referralFeeRate") {
      if (!Number.isFinite(value)) {
        issues.push({
          field,
          code: "not_finite",
          message: "referralFeeRate must be a finite number.",
        });
      } else if (value < 0 || value > 1) {
        issues.push({
          field,
          code: "rate_out_of_range",
          message: "referralFeeRate must be between 0 and 1.",
        });
      }
      continue;
    }

    if (typeof value !== "number" || !isFiniteInteger(value)) {
      issues.push({
        field,
        code: "not_finite",
        message: `${field} must be a finite integer.`,
      });
    } else if (value < 0) {
      issues.push({
        field,
        code: "negative",
        message: `${field} must be non-negative.`,
      });
    }
  }

  return issues;
}

function sumKnownCosts(inputs: EconomicInputs): number {
  let total = 0;
  for (const field of COST_KEYS) {
    const value = inputs[field];
    if (value !== null) total += value;
  }

  if (inputs.salePriceCents !== null && inputs.referralFeeRate !== null) {
    total += Math.round(inputs.salePriceCents * inputs.referralFeeRate);
  }

  return total;
}

export function calculateContribution(inputs: EconomicInputs): EconomicResult {
  const issues = validate(inputs);
  if (issues.length > 0) return { status: "invalid", issues };

  const missingFields = INPUT_KEYS.filter((field) => inputs[field] === null);
  if (missingFields.length > 0) {
    return {
      status: "incomplete",
      missingFields,
      partialKnownCostsCents: sumKnownCosts(inputs),
    };
  }

  const salePriceCents = inputs.salePriceCents as number;
  const referralFeeCents = Math.round(salePriceCents * (inputs.referralFeeRate as number));
  const totalCostCents = sumKnownCosts(inputs);
  const contributionCents = salePriceCents - totalCostCents;

  return {
    status: "complete",
    contributionCents,
    marginRate: salePriceCents === 0 ? null : contributionCents / salePriceCents,
    referralFeeCents,
    totalCostCents,
    assumptions: [...INPUT_KEYS],
  };
}
