# TASK 06A — Unit-Economics Domain

## Status

Blocked until Task 5C is Codex `APPROVED` and Codex supplies the exact approved starting HEAD.

## Objective

Implement only the pure cents-based unit-economics contract for complete, incomplete, and invalid inputs.

## Required reading

Read completely: `AGENTS.md`; the product design and Product Task 6 plan; remaining-MVP design; Task 6 design; Task 6A plan; `workbuddy/README.md`; this sheet; `src/domain/types.ts`; all existing domain/test patterns; package/TS/Vitest config; Git log/diff/status.

Normative files are `docs/specs/2026-08-23-task-6-unit-economics-design.md` and `docs/plans/2026-08-23-task-6a-unit-economics-domain-implementation-plan.md`.

## Starting gate

Verify exact root, `main`, clean worktree, exact HEAD supplied by Codex, and ancestors `9a1936e55e0dcd6e470e7e6ce994bb034023d067`, `7af3ce5730fde66ae913a98f110aec115344a2d5`, and `af415cd568fb7f8087f273abc0a111dc4068682e`. Also verify the Task 5C approved commit supplied by Codex is an ancestor. Any failure/conflict means stop without changing state.

## Allowed files

Create only:

- `src/domain/economics.ts`
- `src/domain/economics.test.ts`

No existing file may change. UI, Context, types, quality, CSV, Demo data, Task 5, scoring, decisions, docs, dependencies, and lockfile are forbidden.

## Required execution

Follow the plan's RED/GREEN order and exact public contracts. Test the `$39.99` case, every missing field, invalid matrix, stable issue order, zero sale, negative contribution, rounding, repeated calls, and immutability. Never produce `NaN`, infinity, or a value for missing inputs.

Run focused economics tests, relevant existing domain tests, full test, build, lint, frozen install, and `git diff --check`. Scan the two new files for prohibited commercial/AI/network capabilities.

Commit once as `feat: add transparent unit economics`; finish clean and stop. Do not begin Task 6B.
