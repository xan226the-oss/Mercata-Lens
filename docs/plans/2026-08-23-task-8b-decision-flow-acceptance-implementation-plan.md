# Task 8B Decision Flow and Final Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Decision page, one-way export, and end-to-end MVP acceptance without adding persistence or commercial claims.

**Architecture:** Context owns user-authored conditions only. `DecisionPage` derives the report from approved domain functions and composes status, evidence, conditions, and validation components. A pure serializer creates a versioned JSON download; Playwright protects the complete local flow.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Playwright, CSS, local Chrome.

## Global Constraints

- Start only after Task 8A is `APPROVED`.
- Do not change upstream formulas/rules, CSV contracts, dependencies, or lockfile.
- No JSON import, persistence, backend, AI summary, deployment, or recommendation.
- Runtime defect fixes must be reproduced by a test and stay inside the allowed task files.
- Create one ordinary commit `test: complete the local research decision flow`.

---

### Task 1: Conditions lifecycle and decision components

**Files:**
- Modify: `src/research/ResearchContext.tsx`
- Modify: `src/research/ResearchContext.test.tsx`
- Create: `src/components/DecisionStatus.tsx`
- Create: `src/components/DecisionStatus.test.tsx`
- Create: `src/components/ValidationPlan.tsx`
- Create: `src/components/ValidationPlan.test.tsx`

- [ ] Write Context RED for conditions, defensive copies, failed-import preservation, successful-import reset, and Demo reload reset; implement only the approved contract.
- [ ] Write component RED for three statuses, no-clear-winner, support/opposition, assumptions, missing data, limitations, condition fields, validation actions, evidence links, and accessible status/error semantics; implement minimal presentational components.

### Task 2: Page and one-way export

**Files:**
- Create: `src/data/researchExport.ts`
- Create: `src/data/researchExport.test.ts`
- Create: `src/pages/DecisionPage.test.tsx`
- Modify: `src/pages/DecisionPage.tsx`
- Modify: `src/app/styles.css`
- Modify: `README.md`

- [ ] Write serializer RED for stable schema version, source provenance, ruleset, corrections, scenarios, weights, conditions, report, limitations, deep copy, deterministic JSON, and absence of browser-internal keys.
- [ ] Implement `buildResearchExport` and `downloadResearchExport`; keep download side effects behind the click handler.
- [ ] Write real-provider page RED for insufficient, continue, no-clear-winner, and explicit pause; trace links; condition editing; failed/successful import lifecycle; export content; print labels; and forbidden claims.
- [ ] Integrate the page and append only `.decision-*` and print-scoped styles. Update README with the completed local workflow and explicit exclusions.

### Task 3: End-to-end and final acceptance

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/demo-research.spec.ts`
- Create: `e2e/import-errors.spec.ts`
- Create: `e2e/fixtures/invalid-products.csv`
- Create: `e2e/fixtures/invalid-reviews.csv`
- Create: `docs/evidence/manual-mvp-acceptance.md`
- Modify only if a reproduced acceptance defect requires it: Task 6B/7B/8B component tests and corresponding runtime files already listed by the Task 8B task sheet.

- [ ] Configure Playwright against local Vite with one desktop project. Fail on application `console.error`, `pageerror`, React warnings, and duplicate keys; treat an isolated favicon request separately and report it truthfully.
- [ ] Implement the Demo flow: load, quality, category, pain-point evidence and correction, complete base economics, edit/restore weights, decision report, and JSON download inspection.
- [ ] Implement invalid-import flow: exact file/row/field diagnostics, active-data preservation when applicable, and dependent route locking when no valid evidence exists.
- [ ] Run focused suites, full test, build, lint, frozen install, `git diff --check`, and `pnpm exec playwright test` with no skipped core spec.
- [ ] Perform keyboard and browser acceptance at `1440 x 900`, `900 x 900`, and minimal `390 x 844`; record automated, observed, and incomplete human exercises separately.
- [ ] Confirm allowed-file scope, stop Vite, release ports, commit once, and stop for final Codex review.
