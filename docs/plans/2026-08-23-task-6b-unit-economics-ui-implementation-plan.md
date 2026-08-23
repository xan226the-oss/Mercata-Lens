# Task 6B Unit-Economics UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add current-session three-scenario inputs and an accessible economics workspace backed only by Task 6A.

**Architecture:** A data factory creates Demo-assumption or empty-upload scenarios; `ResearchContext` owns copied scenario inputs; `EconomicsEditor` renders controlled fields; `OpportunitiesPage` derives results with `calculateContribution`.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS, local Chrome.

## Global Constraints

- Start only after Task 6A is `APPROVED`.
- Do not change Task 6A formulas, Task 5 code, CSV schemas, quality thresholds, routes, dependencies, or lockfile.
- No opportunity scores or decision logic.
- Create one ordinary commit `feat: add unit economics workspace`.

---

### Task 1: Scenario factories and Context lifecycle

**Files:**
- Create: `src/data/economicScenarios.ts`
- Create: `src/data/economicScenarios.test.ts`
- Modify: `src/research/ResearchContext.tsx`
- Modify: `src/research/ResearchContext.test.tsx`

**Interfaces:**
- Produces `createEconomicScenarios(sourceKind): EconomicScenario[]`.
- Extends Context with `economicScenarios` and `replaceEconomicScenario(scenario): boolean`.

- [ ] **Step 1: Write RED for factories**

Assert three stable IDs, independent objects, empty user-upload inputs/provenance, and explicit Demo assumptions. Every Demo provenance note begins `Demo assumption:` and uses no live-market claim.

- [ ] **Step 2: Implement factories and run GREEN**

Use these exact local demonstration inputs, all labeled `Demo assumption`:

| Scenario | Sale | Sourcing | Freight | Referral | Fulfillment | Ads | Returns | Other |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| pessimistic | 2999 | 1400 | 450 | 0.15 | 650 | 600 | 200 | 100 |
| base | 3999 | 1200 | 300 | 0.15 | 650 | 400 | 100 | 49 |
| optimistic | 4499 | 1000 | 250 | 0.15 | 600 | 250 | 75 | 25 |

Values are integer cents except the decimal referral rate. Do not derive sourcing, advertising, or fulfillment costs from product data.

- [ ] **Step 3: Write Context lifecycle RED**

Cover defensive copies, known-ID acceptance, unknown-ID rejection, failed-import preservation, successful-upload reset to empty scenarios, and Demo reload reset to Demo assumptions.

- [ ] **Step 4: Implement Context lifecycle and run GREEN**

Reset scenarios at the same successful replacement boundary used for corrections.

### Task 2: Accessible editor and page integration

**Files:**
- Create: `src/components/EconomicsEditor.tsx`
- Create: `src/components/EconomicsEditor.test.tsx`
- Create: `src/pages/OpportunitiesPage.test.tsx`
- Modify: `src/pages/OpportunitiesPage.tsx`
- Modify: `src/app/styles.css`

**Interfaces:**
- `EconomicsEditor({ scenarios, onReplaceScenario })` receives controlled scenarios and emits a complete copied `EconomicScenario`.

- [ ] **Step 1: Write component RED**

Assert three named fieldsets, eight labeled fields each, visible provenance, empty-to-null conversion, dollars-to-cents conversion, percent-to-decimal conversion, associated invalid help, independent edits, and no hidden cross-scenario inheritance.

- [ ] **Step 2: Implement the editor and run GREEN**

Keep raw draft strings locally so malformed input remains visible. Emit only parseable nullable values; domain results remain the authority for business validation.

- [ ] **Step 3: Write page integration RED**

Cover Demo assumption labels, exact contribution explanation, incomplete upload state, failed-import preservation, successful-import reset, source badge, no forbidden profit/recommendation copy, and no-data fallback outside the shell.

- [ ] **Step 4: Integrate and add scoped styles**

Append only `.economics-*` selectors. Preserve the complete existing stylesheet and other pages.

### Task 3: Verification and acceptance

- [ ] Run Task 6A/6B focused tests, existing import/layout/route regressions, full test, build, lint, frozen install, and diff check.
- [ ] Browser-check `/`, `/quality`, `/category`, `/pain-points`, and `/opportunities` at `1440 x 900`, `900 x 900`, and minimal `390 x 844`; verify labels, keyboard input, wrapping, no overflow, and clean runtime.
- [ ] Confirm only allowed files changed, commit, release the port, and stop.
