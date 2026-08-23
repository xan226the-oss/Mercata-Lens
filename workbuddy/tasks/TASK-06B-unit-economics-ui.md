# TASK 06B — Unit-Economics Workspace

## Status

Blocked until Task 6A is Codex `APPROVED` and Codex supplies the exact approved starting HEAD.

## Objective

Add current-session pessimistic/base/optimistic economic inputs and an accessible, provenance-first economics workspace on `/opportunities`. Do not add opportunity scoring.

## Required reading

Read completely: `AGENTS.md`; `docs/specs/2026-08-13-mercata-lens-design.md`; the Product Task 6 section of `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`; `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`; `docs/plans/2026-08-14-mercata-lens-visual-refresh-implementation-plan.md`; `docs/specs/2026-08-23-remaining-mvp-delivery-design.md`; `docs/specs/2026-08-23-task-6-unit-economics-design.md`; `docs/plans/2026-08-23-task-6a-unit-economics-domain-implementation-plan.md`; `docs/plans/2026-08-23-task-6b-unit-economics-ui-implementation-plan.md`; approved economics domain files; `src/research/ResearchContext.tsx` and its tests; `src/pages/OpportunitiesPage.tsx`; relevant components/tests; `src/app/styles.css`; Demo/import/quality contracts; package/configuration; Git log/diff/status; `workbuddy/README.md`; this sheet. Do not invent alternate filenames.

## Starting gate

Verify exact root, `main`, clean worktree, exact supplied HEAD, required documentation ancestors, and the Codex-approved Task 6A commit. Stop on any failure or unexplained allowed-file content.

## Allowed files

Create only:

- `src/data/economicScenarios.ts`
- `src/data/economicScenarios.test.ts`
- `src/components/EconomicsEditor.tsx`
- `src/components/EconomicsEditor.test.tsx`
- `src/pages/OpportunitiesPage.test.tsx`

Modify only:

- `src/research/ResearchContext.tsx`
- `src/research/ResearchContext.test.tsx`
- `src/pages/OpportunitiesPage.tsx`
- `src/app/styles.css`

Do not modify economics formulas/tests, types, routes, Task 5, CSV/quality/Demo fixtures, README, dependencies, lockfile, or Task 7+ files.

## Required execution

Follow the Task 6B plan exactly, including the fixed Demo values and provenance copy. Use genuine component/Context/page REDs. Prove failed-import preservation and successful-replacement reset with distinct data. Append scoped CSS; never replace or rewrite the baseline stylesheet.

Run Task 6A/6B focused tests plus import/layout/route regressions, then full test, build, lint, frozen install, and diff check. Browser-check all existing routes at the three approved viewports, with keyboard labels, wrapping, no overflow, and application-warning review.

Commit once as `feat: add unit economics workspace`; release the port, finish clean, and stop. Do not begin Task 7A.
