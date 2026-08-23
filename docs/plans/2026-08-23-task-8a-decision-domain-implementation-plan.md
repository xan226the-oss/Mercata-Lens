# Task 8A Decision Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic, evidence-bounded decision report and validation-plan contract.

**Architecture:** `decision.ts` composes already calculated quality, availability, economics, and ranking inputs. It never reads React state, infers user conditions, or changes upstream calculations.

**Tech Stack:** TypeScript, Vitest.

## Global Constraints

- Start only after Task 7B is `APPROVED`.
- Create only `src/domain/decision.ts` and `.test.ts`.
- No UI, Context, export, persistence, scoring edits, or new status values.
- Create one ordinary commit `feat: add bounded decision reports`.

---

### Task 1: Lock types and precedence with RED

**Interfaces:**
- Produces `DecisionStatus`, `ValidationAction`, `DecisionConditions`, `DecisionInput`, `DecisionReport`, `normalizeDecisionConditions`, and `buildDecisionReport`.

- [ ] Write an import RED covering the six required truth-table cases and exact precedence.
- [ ] Run `pnpm vitest run src/domain/decision.test.ts`; expect missing-module failure.
- [ ] Implement types and the smallest truth-table function; run GREEN.

### Task 2: Complete report composition boundaries

- [ ] Add tests for stable evidence-ID deduplication, preserved source order, blank-condition removal with original non-blank text retained, exact stop-condition matching, unknown trigger ignored, no-clear-winner validation action, incomplete missing-data explanation, negative economics not auto-pausing, empty inputs, defensive copies, and repeated-call stability.
- [ ] Implement deterministic normalization and report composition. Every output limitation must be supplied or a fixed factual product limitation; do not generate persuasive prose.
- [ ] Run Task 8A plus Task 3–7 domain suites, then full test, build, lint, frozen install, and diff check.
- [ ] Confirm only two files changed, commit, and stop.

