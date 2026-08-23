# Task 6A Unit-Economics Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pure, traceable, cents-based unit-economics calculation for complete, incomplete, and invalid inputs.

**Architecture:** `economics.ts` consumes existing nullable input contracts and returns a discriminated result without reading React state or mutating inputs.

**Tech Stack:** TypeScript, Vitest.

## Global Constraints

- Start only after Task 5C receives Codex `APPROVED`.
- Modify no existing file; create only the two domain files.
- No UI, Context, Demo assumptions, scoring, decisions, persistence, or dependencies.
- Create one ordinary commit `feat: add transparent unit economics`.

---

### Task 1: Lock result and validation contracts

**Files:**
- Create: `src/domain/economics.test.ts`
- Create: `src/domain/economics.ts`

**Interfaces:**
- Consumes: `EconomicInputs` from `src/domain/types.ts`.
- Produces: `EconomicInputKey`, `EconomicIssue`, `EconomicResult`, `calculateContribution(inputs)` exactly as specified by the Task 6 design.

- [ ] **Step 1: Write RED for a complete `$39.99` example**

Use `3999` sale, `1200` sourcing, `300` freight, `0.15` referral, `650` fulfillment, `400` ads, `100` returns, and `49` other. Assert referral fee `600`, total costs `3299`, contribution `700`, and margin `700 / 3999`.

- [ ] **Step 2: Run focused RED**

Run: `pnpm vitest run src/domain/economics.test.ts`  
Expected: FAIL because `./economics` does not exist.

- [ ] **Step 3: Implement minimal complete calculation**

Validate without coercion, round only the referral fee, and return an ordered assumptions list containing all eight input keys.

- [ ] **Step 4: Run focused GREEN**

Expected: the complete example passes exactly.

### Task 2: Complete the boundary matrix

- [ ] **Step 1: Add RED tests**

Cover every null field and stable missing order; partial known costs excluding sale price and referral fee when their operands are missing; negative cents; fractional cents; `NaN`/infinity; rates below 0 or above 1; zero costs; zero sale price returning `marginRate: null`; negative contribution; `.5` referral rounding; empty-input safety; repeated-call stability; and deep input immutability.

- [ ] **Step 2: Implement the minimal validation helpers**

Collect every issue in input-key order. Invalid takes precedence over incomplete. Never return `NaN`, infinity, or an invented amount.

- [ ] **Step 3: Run focused then repository gates**

Run the domain test, related types/quality tests, full test, build, lint, frozen install, and `git diff --check`.

- [ ] **Step 4: Commit**

Confirm only `src/domain/economics.ts` and `.test.ts` changed, commit, and stop.

