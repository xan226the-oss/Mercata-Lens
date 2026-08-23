# Mercata Lens Task 7: Evidence-Linked Opportunity Comparison Design

**Date:** 2026-08-23  
**Normative parent:** `docs/specs/2026-08-23-remaining-mvp-delivery-design.md`

## Goal

Compare three fixed positioning hypotheses with inspectable inputs and configurable weights while preserving missing evidence and allowing no clear winner. The comparison is a hypothesis exercise, not market validation or a recommendation.

## Fixed opportunities

```ts
export type OpportunityId = "easy_clean" | "quiet_durable" | "low_consumables";
export type OpportunityDimension =
  | "demand"
  | "supply_gap"
  | "economics"
  | "differentiation"
  | "risk";
```

The exact display names are Easy-clean design, Quiet and durable design, and Low consumables cost design. Each hypothesis includes a target user, scenario, five dimensions, support evidence IDs, opposition evidence IDs, and unknowns.

Each dimension contains `value: number | null`, `evidenceIds`, `reasoning`, and `evidenceKind`. A numeric value must be finite and within `0..100`. Empty evidence IDs are permitted only when the value is null. Reasoning must distinguish observed records, Demo assumptions, user assumptions, and derived economics.

## Scoring contract

Default weights are demand 30, supply gap 25, economics 20, differentiation 15, and risk 10. All five weights must be finite, non-negative, and total exactly 100. A complete score is the sum of `value * weight / 100`, retaining each contribution. Any missing or invalid dimension makes that opportunity incomplete.

Ranking returns:

- `winner` only when every candidate is complete and the top score leads the second by at least 3 points;
- `no_clear_winner` when every candidate is complete and the difference is below 3 points;
- `incomplete` when any candidate is incomplete or weights are invalid.

Stable opportunity order resolves display ties but never converts a tie into a winner. Missing values are not zero and incomplete candidates are not ranked below complete candidates.

## Evidence construction

Task 7B may use the fixed three Demo hypotheses defined in the original design, but every non-observed dimension value must be explicitly marked as a curated Demo assumption. Review counts and rule-match counts may be shown as supporting records; neither automatically determines demand or supply gap. Evidence links resolve to an original product/review record, a named economic scenario, or a visible assumption explanation.

User-uploaded datasets do not inherit Demo opportunity scores. Until the user supplies values, the comparison remains incomplete and explains which dimension inputs are missing.

## UI and state

The Opportunity comparison page shows all three cards, a weight editor, calculation contributions, support, opposition, unknowns, and an explicit `Scoring model is a configurable hypothesis` statement. Weight changes recalculate immediately only when valid; invalid totals preserve the draft and explain why no ranking is available. Restore defaults is explicit.

Weights are current-session state and reset on successful dataset replacement while surviving failed import. A blank sensitivity worksheet may be created, but no agent may claim the user completed it.

## Acceptance

Task 7A tests validation, contribution math, threshold boundaries, incompleteness, order, and immutability. Task 7B tests evidence traceability, Demo/user behavior, weight reset lifecycle, no-forced-winner copy, keyboard controls, and runtime/layout regression.

