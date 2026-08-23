# TASK 08A — Decision and Validation Domain

## Status

Blocked until Task 7B is Codex `APPROVED` and Codex supplies the exact approved starting HEAD.

## Objective

Implement only the deterministic decision truth table and evidence-bounded validation-plan report.

## Required reading

Read completely: `AGENTS.md`; `docs/specs/2026-08-13-mercata-lens-design.md`; the Product Task 8 section of `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`; `docs/specs/2026-08-23-remaining-mvp-delivery-design.md`; `docs/specs/2026-08-23-task-8-decision-flow-design.md`; `docs/plans/2026-08-23-task-8a-decision-domain-implementation-plan.md`; approved quality, pain-point, economics, and opportunity domain contracts/tests; `src/domain/types.ts`; package/configuration; Git history/status; `workbuddy/README.md`; this sheet. Do not invent alternate filenames.

## Starting gate

Verify exact root, `main`, clean worktree, exact supplied HEAD, documentation ancestors, and approved Task 7B commit. Stop on mismatch or conflict.

## Allowed files

Create only:

- `src/domain/decision.ts`
- `src/domain/decision.test.ts`

No existing file may change. UI, Context, export, upstream calculations, data, docs, dependencies, lockfile, persistence, and E2E are forbidden.

## Required execution

Follow Task 8A RED/GREEN order. Prove precedence, exact stop-condition matching, blank normalization, no-clear-winner handling, incomplete economics, stable evidence deduplication, no automatic pause from score/economics/risk, defensive copies, and deterministic outputs.

Run Task 8A plus all upstream domain focused tests, then full test, build, lint, frozen install, diff check, and prohibited-capability scan.

Commit once as `feat: add bounded decision reports`; finish clean and stop. Do not begin Task 8B.
