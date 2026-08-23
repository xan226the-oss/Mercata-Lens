# Mercata Lens Task 8: Decision and Validation Flow Design

**Date:** 2026-08-23  
**Normative parent:** `docs/specs/2026-08-23-remaining-mvp-delivery-design.md`

## Goal

Compose the accepted quality, pain-point, economics, and opportunity evidence into a bounded research status and an actionable validation plan. The page must expose uncertainty and cannot turn a score into sourcing or launch advice.

## Decision contract

```ts
export type DecisionStatus =
  | "continue_research"
  | "insufficient_evidence"
  | "pause";

export interface ValidationAction {
  owner: string;
  action: string;
  evidenceExpected: string;
}
```

`buildDecisionReport(input)` returns status, ranking, support and opposition evidence IDs, assumptions, missing data, next actions, user-authored continue/pause/stop conditions, triggered stop conditions, and limitations.

Truth-table precedence is:

1. blocking quality issue -> `insufficient_evidence`;
2. unavailable pain-point module -> `insufficient_evidence`;
3. incomplete ranking or all relevant economics incomplete -> `insufficient_evidence`;
4. a non-empty triggered condition that exactly matches a user-authored stop condition -> `pause`;
5. otherwise -> `continue_research`.

`no_clear_winner` is not insufficient by itself. It produces `continue_research` with an explicit inability to prioritize and a validation action aimed at resolving the tie. Low score, negative contribution, or a risk dimension cannot independently manufacture `pause`.

## User conditions

Decision conditions are plain user-authored strings stored only in current-session Context. Blank normalized entries are removed; non-blank original text and stable order are preserved. Successful dataset replacement clears conditions; failed import preserves them.

The app may evaluate triggered stop conditions only from an explicit list supplied through the local interface. It does not infer triggers from review text or scores.

## Page contract

The Decision page shows the status in plain language, ranking or no-clear-winner result, evidence for and against, assumptions, missing data, conditions, limitations, and validation actions. Each evidence reference opens an existing record or calculation explanation. The page is print-safe and retains source and limitation labels.

The JSON export is a one-way local download with schema version, dataset provenance, ruleset version, corrections, scenarios, weights, conditions, report, and limitations. It excludes React state internals and offers no import or persistence claim.

## Final acceptance

Task 8B owns the complete Demo path, invalid-import path, keyboard/semantic checks, console and page-error failure behavior, desktop acceptance, and minimal `390 x 844` regression. It may add Playwright configuration and focused local fixtures without changing the validated public Demo CSV.

The final report separates automated results, observed browser results, incomplete user exercises, and excluded commercial claims. No deployment or production validation occurs.

