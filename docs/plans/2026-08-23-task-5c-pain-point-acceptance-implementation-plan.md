# Task 5C Pain-Point Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Product Task 5 with a deterministic blank audit handoff, accurate documentation, and final pain-point acceptance.

**Architecture:** Reuse the approved Demo parser and Task 5A classifier to verify a committed CSV artifact. Add no runtime behavior; browser findings stop the task unless Codex separately authorizes a repair.

**Tech Stack:** TypeScript, Vitest, React Testing Library, CSV/Markdown, local Chrome.

## Global Constraints

- Start from the exact clean HEAD supplied by Codex after Task 5B approval.
- Do not alter classification rules, corrections, Context, routes, runtime components, CSS, Demo CSV, dependencies, or lockfile.
- Human fields stay blank; no agent performs the audit.
- Create one ordinary commit `test: complete pain point acceptance`.

---

### Task 1: Create and verify the deterministic audit artifact

**Files:**
- Create: `docs/evidence/review-audit.csv`
- Create: `src/domain/painPointAudit.test.ts`

**Interfaces:**
- Consumes: `importResearchCsv`, `classifyReview`, `PAIN_POINT_RULES`, and the two public Demo CSV files.
- Produces: a 50-row evidence artifact; no runtime export.

- [ ] **Step 1: Write the artifact contract test before the CSV exists**

Read the evidence CSV with Papa Parse and assert the exact seven headers, 50 rows, unique IDs, Demo order `dataset.reviews.slice(0, 50)`, classifier-derived catalog-ordered `system_labels`, and empty human fields.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `pnpm vitest run src/domain/painPointAudit.test.ts`  
Expected: FAIL because `docs/evidence/review-audit.csv` does not exist.

- [ ] **Step 3: Create the exact CSV**

Use the validated Demo rows in source order. Serialize automatic labels with `|`; quote CSV fields only as required. Do not add corrections or human judgments.

- [ ] **Step 4: Run GREEN and immutability checks**

Run the focused test again. Expected: PASS with exactly 50 audit rows and no changed Demo fixture.

### Task 2: Create evidence records and reconcile README

**Files:**
- Create: `docs/evidence/review-rule-changelog.md`
- Create: `docs/evidence/manual-pain-point-check.md`
- Modify: `README.md`

- [ ] **Step 1: Record the unchanged ruleset baseline**

Document version `1.0.0`, its code-owned status, and a future-entry template containing version, date, reason, added/removed phrases, and concrete before/after examples. State that no post-audit rule change exists yet.

- [ ] **Step 2: Record reproducibility and evidence status**

Document sample order, 50-row denominator, system-label derivation, commands, browser viewport observations, and separate headings for automated, observed-browser, and human-audit evidence. Mark the human audit `Incomplete — awaiting user judgments`.

- [ ] **Step 3: Update README factually**

Describe the workbench, current-session corrections, deterministic rule version, audit-template location, reset behavior, and exclusions. Do not say the 50-review audit passed.

### Task 3: Final acceptance and commit

**Files:**
- Test: all Task 5 files and existing route/import/layout regressions.
- Observe only: runtime TS/TSX and `src/app/styles.css`.

- [ ] **Step 1: Run focused and full automated gates**

Run the exact Task 5B focused command plus `src/domain/painPointAudit.test.ts`, followed by full test, build, lint, frozen install, and `git diff --check`.

- [ ] **Step 2: Perform real-browser acceptance**

At `1440 x 900`, `900 x 900`, and `390 x 844`, verify the Task 5C design contract, keyboard flow, focus, one table, wrapping, no horizontal overflow, and no application runtime warnings. If a defect exists, stop without patching runtime files.

- [ ] **Step 3: Commit only after every gate passes**

Commit the four allowed files with `test: complete pain point acceptance`, stop the server, verify port release and a clean worktree.

