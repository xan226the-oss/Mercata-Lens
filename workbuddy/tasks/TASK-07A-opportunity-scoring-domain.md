# TASK 07A — Opportunity Scoring Domain

## Status

Blocked until Task 6B is Codex `APPROVED` and Codex supplies the exact approved starting HEAD.

## Objective

Implement only pure opportunity weight validation, contribution scoring, completeness, and no-forced-winner ranking.

## Required reading

Read completely: `AGENTS.md`; `docs/specs/2026-08-13-mercata-lens-design.md`; the Product Task 7 section of `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`; `docs/specs/2026-08-23-remaining-mvp-delivery-design.md`; `docs/specs/2026-08-23-task-7-opportunity-comparison-design.md`; `docs/plans/2026-08-23-task-7a-opportunity-scoring-domain-implementation-plan.md`; approved economics contracts; current types/domain test patterns; package/configuration; Git history/status; `workbuddy/README.md`; this sheet. Do not invent alternate filenames.

## Starting gate

Verify exact root, `main`, clean worktree, exact supplied HEAD, documentation ancestors, and the Codex-approved Task 6B commit. Stop on mismatch or conflict.

## Allowed files

Create only:

- `src/domain/opportunities.ts`
- `src/domain/opportunities.test.ts`

No existing file may change. UI, Context, economics, pain points, quality, CSV, fixtures, docs, dependencies, lockfile, and decisions are forbidden.

## Required execution

Follow the Task 7A plan in order. Lock exact IDs/dimensions/default weights. Test invalid key sets and values, complete/incomplete contributions, exact 3-point boundary, stable ties/order, all-three completeness, evidence retention, and immutability. Missing values never become zero.

Run focused Task 7A plus Task 6A and relevant existing domain tests, then full test, build, lint, frozen install, diff check, and prohibited-capability scan.

Commit once as `feat: add bounded opportunity scoring`; finish clean and stop. Do not begin Task 7B.
