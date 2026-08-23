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

function isFiniteInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value);
}

function isSafeCent(value: number): boolean {
  return Number.isSafeInteger(value);
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

    if (typeof value !== "number" || !isFiniteInteger(value) || !isSafeCent(value)) {
      issues.push({
        field,
        code: "not_finite",
        message: `${field} must be a finite safe integer.`,
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

function checkedAdd(total: number, value: number, field: EconomicInputKey): number | EconomicIssue {
  const next = total + value;
  return Number.isSafeInteger(next)
    ? next
    : {
        field,
        code: "not_finite",
        message: `${field} produces an unsafe total.`,
      };
}

function checkedReferralFee(salePriceCents: number, referralFeeRate: number): number | EconomicIssue {
  const rawFee = salePriceCents * referralFeeRate;
  if (!Number.isFinite(rawFee)) {
    return {
      field: "referralFeeRate",
      code: "not_finite",
      message: "referralFeeRate produces an unsafe referral fee.",
    };
  }

  const referralFeeCents = Math.round(rawFee);
  return Number.isSafeInteger(referralFeeCents)
    ? referralFeeCents
    : {
        field: "referralFeeRate",
        code: "not_finite",
        message: "referralFeeRate produces an unsafe referral fee.",
      };
}

function sumKnownCosts(inputs: EconomicInputs): number | EconomicIssue {
  let total = 0;
  for (const field of INPUT_KEYS) {
    if (field === "salePriceCents") continue;
    if (field === "referralFeeRate") {
      if (inputs.salePriceCents === null || inputs.referralFeeRate === null) continue;
      const referralFeeCents = checkedReferralFee(inputs.salePriceCents, inputs.referralFeeRate);
      if (typeof referralFeeCents !== "number") return referralFeeCents;
      const next = checkedAdd(total, referralFeeCents, "referralFeeRate");
      if (typeof next !== "number") return next;
      total = next;
      continue;
    }

    const value = inputs[field];
    if (value !== null) {
      const next = checkedAdd(total, value, field);
      if (typeof next !== "number") return next;
      total = next;
    }
  }

  return total;
}

export function calculateContribution(inputs: EconomicInputs): EconomicResult {
  const issues = validate(inputs);
  if (issues.length > 0) return { status: "invalid", issues };

  const missingFields = INPUT_KEYS.filter((field) => inputs[field] === null);
  const knownCosts = sumKnownCosts(inputs);
  if (typeof knownCosts !== "number") return { status: "invalid", issues: [knownCosts] };

  if (missingFields.length > 0) {
    return {
      status: "incomplete",
      missingFields,
      partialKnownCostsCents: knownCosts,
    };
  }

  const salePriceCents = inputs.salePriceCents as number;
  const referralFeeResult = checkedReferralFee(salePriceCents, inputs.referralFeeRate as number);
  if (typeof referralFeeResult !== "number") return { status: "invalid", issues: [referralFeeResult] };
  const referralFeeCents = referralFeeResult;
  const totalCostCents = knownCosts;
  const contributionCents = salePriceCents - totalCostCents;
  if (!Number.isSafeInteger(contributionCents)) {
    return {
      status: "invalid",
      issues: [{
        field: "salePriceCents",
        code: "not_finite",
        message: "salePriceCents produces an unsafe contribution.",
      }],
    };
  }

  return {
    status: "complete",
    contributionCents,
    marginRate: salePriceCents === 0 ? null : contributionCents / salePriceCents,
    referralFeeCents,
    totalCostCents,
    assumptions: [...INPUT_KEYS],
  };
}
