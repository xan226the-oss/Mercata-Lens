# TASK 07A — Opportunity Scoring Domain

## Status

Blocked until Task 6B is Codex `APPROVED` and Codex supplies the exact approved starting HEAD.

## Objective

Implement only pure opportunity weight validation, contribution scoring, completeness, and no-forced-winner ranking.

## Required reading

Read completely: `AGENTS.md`; product Task 7; remaining-MVP and Task 7 designs; Task 7A plan; approved economics contracts; current types/domain test patterns; package/config; Git history/status; `workbuddy/README.md`; this sheet.

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
