# TASK 07B — Opportunity Comparison Workspace

## Status

Blocked until Task 7A is Codex `APPROVED` and Codex supplies the exact approved starting HEAD.

## Objective

Render three evidence-linked opportunity hypotheses, editable current-session weights, and honest winner/no-clear/incomplete states.

## Required reading

Read completely: all global/product/visual and remaining-MVP sources; Task 7 design; Task 7A/7B plans; approved Task 5–7 domain/UI files; Context and tests; Opportunity page and tests; styles; Demo/import/quality; package/config; Git history/status; `workbuddy/README.md`; this sheet.

## Starting gate

Verify exact root, `main`, clean worktree, exact supplied HEAD, documentation ancestors, and approved Task 7A commit. Stop on mismatch, conflict, or unexplained allowed-file content.

## Allowed files

Create only:

- `src/data/opportunityHypotheses.ts`
- `src/data/opportunityHypotheses.test.ts`
- `src/components/WeightEditor.tsx`
- `src/components/WeightEditor.test.tsx`
- `src/components/OpportunityCard.tsx`
- `src/components/OpportunityCard.test.tsx`
- `docs/evidence/weight-sensitivity.md`

Modify only:

- `src/research/ResearchContext.tsx`
- `src/research/ResearchContext.test.tsx`
- `src/pages/OpportunitiesPage.tsx`
- `src/pages/OpportunitiesPage.test.tsx`
- `src/app/styles.css`

Do not modify Task 5–7 domain calculations, economics editor, types, routes, CSV/quality/Demo fixtures, README, dependencies, lockfile, or Task 8 files.

## Required execution

Use the exact Demo values and evidence-ID rules in the Task 7B plan. All numeric scores are visibly curated assumptions; user uploads start incomplete. Prove Context reset/preservation, valid/invalid weight behavior, restore defaults, evidence resolution, no-forced-winner, and forbidden-language absence. The worksheet stays blank for user answers.

Run Task 7A/7B plus relevant Task 5/6/import/layout/route focused tests, then full test, build, lint, frozen install, diff check, and browser acceptance at the approved viewports. Append only scoped styles and verify all prior routes.

Commit once as `feat: compare evidence linked opportunities`; release the port, finish clean, and stop. Do not begin Task 8A.

