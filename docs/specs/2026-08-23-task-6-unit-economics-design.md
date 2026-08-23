# Mercata Lens Task 6: Transparent Unit Economics Design

**Date:** 2026-08-23
**Normative parent:** `docs/specs/2026-08-23-remaining-mvp-delivery-design.md`

## Goal

Let the user inspect pessimistic, base, and optimistic per-unit contribution scenarios using explicit local assumptions. The module teaches what is missing and how each amount contributes; it does not claim verified supplier costs, realized profit, or commercial feasibility.

## Domain contract

Use the existing `EconomicInputs` and `EconomicScenario` shapes from `src/domain/types.ts`. Define:

```ts
export type EconomicInputKey = keyof EconomicInputs;

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

export interface EconomicIssue {
  field: EconomicInputKey;
  code: "negative" | "not_finite" | "rate_out_of_range";
  message: string;
}

export function calculateContribution(inputs: EconomicInputs): EconomicResult;
```

All cent values must be finite, integer, and non-negative. `referralFeeRate` must be finite and within `0..1`. Missing means `null`, not zero. Referral fee cents are `Math.round(salePriceCents * referralFeeRate)`. Complete contribution is sale price minus all costs including the rounded referral fee; margin is contribution divided by sale price. A zero sale price with otherwise valid inputs returns a complete contribution and `marginRate: null`; it must never produce `NaN` or infinity.

## Scenario state

The UI always presents `pessimistic`, `base`, and `optimistic` in that order. Each scenario has its own complete input object and provenance record. No field inherits invisibly across scenarios.

Task 6B stores scenarios in `ResearchContext` for the current dataset only. Demo initialization may use explicit values labeled `Demo assumption`; user-upload initialization uses null inputs unless the user enters them. Successful import or Demo reload resets scenarios before the replacement becomes active. Failed import preserves them.

## UI contract

The existing `/opportunities` page gains a clearly separated Unit economics section before opportunity scoring exists. Each scenario exposes all eight inputs, their source labels, missing/invalid messages, contribution formula, known costs, and complete contribution only when permitted.

Inputs use dollar/rate presentation but convert to cents/decimal fractions at the boundary. Empty fields become `null`; malformed or negative fields remain visibly invalid and do not silently coerce to zero. Every input has a programmatic label and associated error/help text.

## Language boundary

Use `assumption`, `scenario`, `estimated per-unit contribution`, and `current-session input`. Do not use `market cost`, `verified margin`, `expected profit`, `recommended price`, `high potential`, or equivalent claims.

## Acceptance

Task 6A covers exact arithmetic, rounding, missing order, invalid values, zero handling, and immutability. Task 6B covers Demo/user provenance, independent scenario editing, failed-import preservation, successful-import reset, accessible fields, no application warnings, and desktop plus minimal narrow regression.
