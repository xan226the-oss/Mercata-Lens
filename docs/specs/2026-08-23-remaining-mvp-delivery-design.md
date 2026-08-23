# Mercata Lens Remaining MVP Delivery Design

**Date:** 2026-08-23  
**Approved starting point:** `9a1936e55e0dcd6e470e7e6ce994bb034023d067`  
**Delivery scope:** Task 5C through a locally runnable, evidence-bounded decision and validation workflow

## 1. Goal

Complete the Mercata Lens MVP after the approved Task 5B workbench without weakening its evidence boundaries. The remaining product must let a user finish the pain-point acceptance handoff, enter transparent unit-economics assumptions, compare three evidence-linked opportunity hypotheses, and produce a deterministic research status plus validation plan.

The finished workflow remains a local research aid. It does not claim live-market coverage, verified customer demand, sales, market share, sourcing feasibility, realized profit, commercial attractiveness, or product success.

## 2. Completion boundary

This delivery includes:

1. Task 5C pain-point audit handoff and final acceptance;
2. three-scenario unit-economics calculation and UI;
3. evidence-linked opportunity scoring with editable weights and no-forced-winner behavior;
4. a deterministic decision report limited to `continue_research`, `insufficient_evidence`, or `pause`;
5. a validation plan and one-way local JSON export;
6. final automated, browser, keyboard, error-path, and end-to-end acceptance.

This delivery excludes:

- localStorage, IndexedDB, backend, login, cloud database, persistence, JSON import, or recovery;
- Amazon scraping, Amazon API access, third-party product databases, or live-market verification;
- cloud or local AI models, semantic classification, generated executive summaries, or AI recommendations;
- automatic sourcing, inventory, launch, purchase, advertising, or pricing recommendations;
- production deployment, analytics, PR creation, or portfolio claims;
- impersonating the user in the 50-review audit, weight challenge, business-threshold exercise, or any external user research.

Tasks 9, 11, and 12 from the original implementation plan are therefore not part of this MVP completion package. The necessary acceptance portions of original Task 10 are incorporated into Task 8B.

## 3. Delivery strategy

The remaining work uses seven independently reviewed gates. Each gate produces one ordinary commit and stops for Codex review. WorkBuddy may not continue to the next gate until the current gate receives `APPROVED`.

This balanced split keeps pure calculations separate from UI state while avoiding a separate handoff for every component:

1. **Task 5C — Pain-point audit handoff and acceptance**
2. **Task 6A — Unit-economics domain contracts**
3. **Task 6B — Unit-economics UI and acceptance**
4. **Task 7A — Opportunity scoring and ranking contracts**
5. **Task 7B — Opportunity comparison UI and acceptance**
6. **Task 8A — Decision and validation-plan contracts**
7. **Task 8B — Decision UI and complete-flow acceptance**

## 4. Shared data and state architecture

`ResearchDataset` remains the only active product-and-review evidence source. Existing CSV parsing and quality assessment stay authoritative. Failed import keeps the active dataset and its session analysis state; successful import or Demo reload replaces the dataset and clears every state object whose IDs or assumptions belong to the prior dataset.

New calculations are pure domain functions:

- `src/domain/economics.ts` owns money validation and contribution calculations;
- `src/domain/opportunities.ts` owns weight validation, score contributions, completeness, and ranking;
- `src/domain/decision.ts` owns the decision truth table and validation-plan composition.

`ResearchContext` may own only current-session user inputs required across pages: economic scenarios, opportunity weights, and decision conditions in addition to the approved pain-point corrections. Derived economics, scores, rankings, and decision reports are recalculated from domain functions and are not duplicated as mutable state.

No new state is persisted across a reload. A one-way JSON export is a user-triggered snapshot download only; it does not imply save, restore, or durable storage.

## 5. Provenance and factual language

Every displayed value must be classifiable as one of:

- observed record data from the active validated dataset;
- a user-entered assumption;
- a clearly labeled Demo assumption;
- a deterministic result derived from named inputs and a visible formula.

Money is represented as integer cents inside domain calculations. Percentage inputs use decimal fractions. Display formatting may use USD, but formatting must not change stored or calculated values.

Product `reviewCount` continues to mean review count only. It cannot be converted into sales, customers, velocity, demand, popularity, or market share. Actual imported `ReviewRecord` objects remain the denominator for pain-point evidence.

Opportunity dimensions may reference product records, review evidence, economic results, or explicit curated/user assumptions. The system must not derive a demand or supply-gap score solely from review counts or pain-point frequencies. Missing evidence stays missing and makes the relevant result incomplete; it is never silently converted to zero.

## 6. Task 5C contract

Task 5C closes Product Task 5 without pretending that a human audit has occurred. It creates:

- `docs/evidence/review-audit.csv` with exactly `review_id,system_labels,human_labels,outcome,notes,auditor,date`;
- a deterministic 50-review sampling order from the approved active Demo fixture;
- `docs/evidence/review-rule-changelog.md` with its required version, date, reason, phrase-change, and before/after structure;
- an acceptance record separating automated tests, observed browser states, and uncompleted human-audit evidence;
- an accurate README description of Task 5 capabilities and limits.

WorkBuddy may populate `review_id` and `system_labels` deterministically. It must leave `human_labels`, `outcome`, `notes`, `auditor`, and `date` blank. Only the user can complete those fields. Task 5C implementation may be approved while the 50-review human-validation gate remains explicitly incomplete.

Task 5C performs keyboard and semantic checks plus browser checks at `1440 x 900`, `900 x 900`, and `390 x 844`. The narrow viewport is regression protection only: readable content, operable controls, one semantic review table, wrapping, and no horizontal overflow. It is not a mobile-optimized workflow.

## 7. Task 6 contracts

### 7.1 Task 6A — domain

Task 6A defines and tests the three economic scenarios: pessimistic, base, and optimistic. Required inputs are sale price, sourcing cost, inbound freight, referral fee rate, fulfillment cost, advertising cost, return-loss allowance, and other cost.

The contribution formula is:

```text
sale price
- sourcing cost
- inbound freight
- referral fee
- fulfillment cost
- advertising cost
- return-loss allowance
- other cost
```

Complete inputs return contribution cents and margin rate. Missing required inputs return an ordered missing-field list and known partial costs without a definitive contribution or margin. Invalid values return explicit issues. Referral fees use a documented rounding rule and all functions preserve their inputs.

Task 6A changes no UI, Context, routing, Demo CSV, or pain-point behavior.

### 7.2 Task 6B — UI and session state

Task 6B provides an accessible three-scenario editor and calculation explanation inside the existing Opportunity comparison step. No scenario inherits a hidden value from another scenario. Each field displays its provenance and whether it is observed, user supplied, Demo assumption, or derived.

Current-session scenario inputs reset after successful dataset replacement and persist after failed import. Missing fields remain visible and prevent definitive profit wording. The UI must not call an assumption a market cost, verified fee, realized margin, recommendation, or commercial result.

## 8. Task 7 contracts

### 8.1 Task 7A — domain

Task 7A defines the exact opportunity hypotheses:

- `easy_clean` — Easy-clean design;
- `quiet_durable` — Quiet and durable design;
- `low_consumables` — Low consumables cost design.

It defines five dimensions with default weights totaling 100:

- demand evidence: 30;
- supply-gap evidence: 25;
- economics: 20;
- differentiation clarity: 15;
- risk controllability: 10.

Every dimension value is either `0..100` with evidence IDs, reasoning, and evidence kind, or `null`. Weight sets must be finite, non-negative, contain every dimension, and total exactly 100. A missing dimension makes the opportunity score incomplete. Complete scores within fewer than three points produce `no_clear_winner`; an incomplete candidate cannot be treated as zero or silently ranked last.

Task 7A changes no UI, Context, economics calculation, pain-point rules, or dataset contracts.

### 8.2 Task 7B — UI and session state

Task 7B renders all three hypotheses with target user, scenario, support, opposition, unknowns, economics, dimension contributions, and traceable evidence references. It labels the scoring model as a configurable hypothesis.

The user may edit weights and restore defaults. Invalid totals block recalculation and provide an associated explanation. Weight state is current-session only and resets after successful dataset replacement while surviving failed import.

The product may include a blank weight-sensitivity worksheet and deterministic before/after calculation examples. It must not claim that the user personally completed the challenge until the user supplies answers.

## 9. Task 8 contracts

### 9.1 Task 8A — domain

Task 8A implements the deterministic truth table:

- blocking quality issue -> `insufficient_evidence`;
- pain-point module unavailable -> `insufficient_evidence`;
- all relevant economics incomplete -> `insufficient_evidence`;
- complete evidence without a triggered stop condition -> `continue_research`;
- `no_clear_winner` remains `continue_research` with an explicit inability to rank;
- `pause` requires an explicit user-authored stop condition that is reported as triggered.

The report contains ranking status, support and opposition evidence IDs, assumptions, missing data, next validation actions, user-authored continue/pause/stop conditions, and limitations. Low score alone cannot trigger `pause`.

Task 8A changes no UI, Context, scoring formula, quality rules, or source data.

### 9.2 Task 8B — UI and final acceptance

Task 8B provides the decision page, condition editor, validation plan, trace links, print-safe presentation, and one-way JSON export. It does not generate an AI summary or hide disagreement, missing evidence, or incomplete economics.

The export includes a schema version, dataset provenance, ruleset version, user corrections, economic assumptions, weights, decision conditions, calculated result, and limitations. It contains no browser-internal keys and provides no import path.

Final acceptance covers:

1. Demo load through quality, category, pain points, economics, opportunity comparison, and decision;
2. a manual pain-point correction and its traceable effect;
3. economic input and incomplete/complete states;
4. weight change and default restoration;
5. decision result and JSON export;
6. invalid CSV diagnostics and dependent-route locking;
7. application `console.error`, `pageerror`, React warnings, duplicate keys, keyboard focus, form labels, table semantics, and non-color-only states;
8. desktop checks at `1440 x 900` and `900 x 900`, plus the same minimal `390 x 844` regression boundary used by Task 5C.

Task 8B may fix only defects reproduced by these gates and only in files explicitly allowed by its task sheet.

## 10. Testing and commit discipline

Every behavior change follows genuine RED -> GREEN. An assertion that passes before implementation is documented as added coverage, not a fabricated RED.

Every gate must run its exact focused tests, the full test suite, `pnpm build`, `pnpm lint`, `pnpm install --frozen-lockfile`, `git diff --check`, and changed-file inspection. UI gates also perform their specified real-browser checks and release the development port before committing.

Each gate creates one ordinary commit. WorkBuddy must not amend, push, deploy, create a PR, start the next gate, or modify an unlisted file. A missing required source, dirty starting tree, unexpected HEAD, scope conflict, or blocked exact verification command causes an immediate truthful stop.

## 11. WorkBuddy handoff protocol

For each gate, Codex supplies a copy-ready prompt naming one exact task sheet and one exact approved starting HEAD. The user sends that prompt to WorkBuddy without broadening it. WorkBuddy returns its full completion or blocking report. The user pastes the report back to Codex unchanged.

Codex independently inspects the commit and returns only `APPROVED`, `CHANGES_REQUESTED`, or `NEEDS_CONTEXT`. Only `APPROVED` authorizes Codex to issue the next gate's prompt.

This protocol minimizes user technical work while preserving attribution, reproducibility, and a review boundary between dependent calculations.

## 12. MVP completion statement

The remaining MVP is complete only when all seven gates receive Codex `APPROVED` and the final automated/browser acceptance passes. Even then:

- the 50-review human audit is incomplete until the user supplies genuine judgments;
- weight sensitivity and business thresholds remain user exercises until the user supplies them;
- no external user research, market validation, production usage, realized profit, or commercial result may be claimed;
- no deployment, persistence, or recovery capability is implied.
