# Task 7A Opportunity Scoring Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pure opportunity-dimension validation, weighted scoring, and no-forced-winner ranking.

**Architecture:** `opportunities.ts` contains immutable types and pure functions. It accepts explicit evidence-bearing dimensions and never reads reviews, derives demand, or mutates weights.

**Tech Stack:** TypeScript, Vitest.

## Global Constraints

- Start only after Task 6B is `APPROVED`.
- Create only the two domain files; no UI, Context, fixtures, economics edits, or decisions.
- Create one ordinary commit `feat: add bounded opportunity scoring`.

---

### Task 1: Define and validate weights and dimensions

**Files:**
- Create: `src/domain/opportunities.ts`
- Create: `src/domain/opportunities.test.ts`

**Interfaces:**
- Produces `OpportunityId`, `OpportunityDimension`, `OpportunityWeights`, `DimensionScore`, `Opportunity`, `OpportunityScore`, `RankingResult`, `DEFAULT_OPPORTUNITY_WEIGHTS`, `validateWeights`, `scoreOpportunity`, and `rankOpportunities`.

- [ ] **Step 1: Write import RED and weight tests**

Assert exact defaults `30/25/20/15/10`, exact key set, total 100, custom valid totals, missing/extra keys, negative, fractional, `NaN`, infinity, and totals `99.99`/`100.01` rejected without tolerance.

- [ ] **Step 2: Run RED, implement validation, run GREEN**

Return a discriminated validation result with stable issue order; do not throw for user data.

### Task 2: Score without fabricating missing values

- [ ] **Step 1: Add scoring RED**

Cover a complete hand-calculated score, contribution per dimension, zero values, null dimension -> incomplete, invalid dimension -> incomplete with issue, evidence retention, stable order, and input immutability.

- [ ] **Step 2: Implement minimal scoring**

Use `value * weight / 100`; do not round domain totals. Invalid weights make every requested score incomplete with weight issues.

### Task 3: Rank with the exact threshold

- [ ] **Step 1: Add ranking RED**

Cover lead `3` -> winner, `2.999...` -> no clear winner, exact tie, stable candidate order, any incomplete score -> incomplete, duplicate/missing opportunity IDs, and non-mutation.

- [ ] **Step 2: Implement ranking and run all gates**

Return winner only when all three exact candidates are complete. Run focused, full, build, lint, frozen install, and diff check.

- [ ] **Step 3: Commit and stop**

Confirm only the two allowed files changed.
