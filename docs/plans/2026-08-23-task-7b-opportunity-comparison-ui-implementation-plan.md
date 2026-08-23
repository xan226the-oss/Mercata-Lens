# Task 7B Opportunity Comparison UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present three traceable opportunity hypotheses with editable current-session weights and honest incomplete/no-clear-winner states.

**Architecture:** A dataset-aware factory creates explicit Demo hypotheses or incomplete upload hypotheses. Context owns weights only. The page derives scores and ranking through Task 7A and composes focused editor/card components.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS, Markdown, local Chrome.

## Global Constraints

- Start only after Task 7A is `APPROVED`.
- Do not modify Task 5/6 domain logic, quality thresholds, CSV, routes, dependencies, or lockfile.
- All Demo numeric dimensions are visibly labeled curated assumptions; uploads start incomplete.
- Create one ordinary commit `feat: compare evidence linked opportunities`.

---

### Task 1: Build traceable hypothesis inputs

**Files:**
- Create: `src/data/opportunityHypotheses.ts`
- Create: `src/data/opportunityHypotheses.test.ts`

- [ ] **Step 1: Write RED**

Assert exact three IDs/order/names, five dimensions each, evidence-kind labels, resolvable Demo review/product or economic references, explicit unknowns, and all-null user-upload dimensions. Assert the factory does not mutate dataset, summaries, or economic results.

- [ ] **Step 2: Implement GREEN**

Use these exact dimension values in `demand/supply_gap/economics/differentiation/risk` order:

- `easy_clean`: `70/60/65/75/55`;
- `quiet_durable`: `65/58/60/70/60`;
- `low_consumables`: `55/62/70/65/65`.

Every numeric value uses `evidenceKind: "assumption"` and visible reasoning beginning `Curated Demo assumption:`. Resolve support evidence from the first dataset-ordered evidence row for `hard_to_clean`, `noise` or `pump_failure`, and `replacement_cost` respectively; use IDs shaped `review:<reviewId>`. Economics references use `economics:<scenarioId>`. Assumption explanations use `assumption:<opportunityId>:<dimension>`. Never calculate demand or supply gap from counts.

### Task 2: Add weight lifecycle and components

**Files:**
- Modify: `src/research/ResearchContext.tsx`
- Modify: `src/research/ResearchContext.test.tsx`
- Create: `src/components/WeightEditor.tsx`
- Create: `src/components/WeightEditor.test.tsx`
- Create: `src/components/OpportunityCard.tsx`
- Create: `src/components/OpportunityCard.test.tsx`

**Interfaces:**
- Context produces `opportunityWeights`, `replaceOpportunityWeights(weights): boolean`, and `resetOpportunityWeights()`.
- Components receive Task 7A types without duplicating them.

- [ ] Write RED for default/custom/invalid weights, defensive copy, failed-import preservation, successful-import reset, and Demo reload reset; implement minimal Context support.
- [ ] Write RED for five labeled numeric weight fields, total, invalid association, Restore defaults, keyboard use, card support/opposition/unknowns, contributions, evidence links, and incomplete states; implement minimal components.

### Task 3: Integrate, document sensitivity, and accept

**Files:**
- Modify: `src/pages/OpportunitiesPage.tsx`
- Modify: `src/pages/OpportunitiesPage.test.tsx`
- Modify: `src/app/styles.css`
- Create: `docs/evidence/weight-sensitivity.md`

- [ ] Add page RED for exact three cards, hypothesis disclaimer, default score explanation, weight edit, restore, winner/no-clear/incomplete states, Demo/upload provenance, failed/successful import lifecycle, and absence of recommendations.
- [ ] Integrate with scoped `.opportunity-*` and `.weight-*` styles only.
- [ ] Create a blank user worksheet plus deterministic system examples. Mark user answers incomplete.
- [ ] Run focused/full/build/lint/install/diff gates and browser acceptance at the approved viewports; verify other routes and one-page semantic hierarchy.
- [ ] Commit only allowed files, release the port, and stop.
