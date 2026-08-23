# TASK 08B — Decision Flow and Final MVP Acceptance

## Status

Blocked until Task 8A is Codex `APPROVED` and Codex supplies the exact approved starting HEAD.

## Objective

Complete the Decision page, current-session conditions, one-way JSON export, and complete local MVP acceptance. Do not add persistence, import, AI, deployment, or commercial recommendations.

## Required reading

Read completely: `AGENTS.md`; `docs/specs/2026-08-13-mercata-lens-design.md`; the Product Tasks 5–8 and Task 10 sections of `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`; `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`; `docs/plans/2026-08-14-mercata-lens-visual-refresh-implementation-plan.md`; `docs/specs/2026-08-23-remaining-mvp-delivery-design.md`; `docs/specs/2026-08-23-task-5c-pain-point-acceptance-design.md`; `docs/specs/2026-08-23-task-6-unit-economics-design.md`; `docs/specs/2026-08-23-task-7-opportunity-comparison-design.md`; `docs/specs/2026-08-23-task-8-decision-flow-design.md`; `docs/plans/2026-08-23-task-5c-pain-point-acceptance-implementation-plan.md`; `docs/plans/2026-08-23-task-6a-unit-economics-domain-implementation-plan.md`; `docs/plans/2026-08-23-task-6b-unit-economics-ui-implementation-plan.md`; `docs/plans/2026-08-23-task-7a-opportunity-scoring-domain-implementation-plan.md`; `docs/plans/2026-08-23-task-7b-opportunity-comparison-ui-implementation-plan.md`; `docs/plans/2026-08-23-task-8a-decision-domain-implementation-plan.md`; `docs/plans/2026-08-23-task-8b-decision-flow-acceptance-implementation-plan.md`; `workbuddy/README.md`; this sheet; root `README.md`; every approved domain/data/Context/page/component file and test used by the complete flow; styles/routes/quality/import/Demo files; package/Playwright/TypeScript/Vitest configuration; Git history/status. Do not invent alternate filenames.

## Starting gate

Verify exact root, `main`, clean worktree, exact supplied HEAD, documentation ancestors, and approved Task 8A commit. Stop on mismatch, conflict, missing material, or an implementation need outside allowed files.

## Allowed files

Create only:

- `src/components/DecisionStatus.tsx`
- `src/components/DecisionStatus.test.tsx`
- `src/components/ValidationPlan.tsx`
- `src/components/ValidationPlan.test.tsx`
- `src/data/researchExport.ts`
- `src/data/researchExport.test.ts`
- `src/pages/DecisionPage.test.tsx`
- `playwright.config.ts`
- `e2e/demo-research.spec.ts`
- `e2e/import-errors.spec.ts`
- `e2e/fixtures/invalid-products.csv`
- `e2e/fixtures/invalid-reviews.csv`
- `docs/evidence/manual-mvp-acceptance.md`

Modify only:

- `src/research/ResearchContext.tsx`
- `src/research/ResearchContext.test.tsx`
- `src/pages/DecisionPage.tsx`
- `src/app/styles.css`
- `README.md`

If a final acceptance defect exists in another runtime file, stop and request a separate exact Codex repair scope. Do not modify upstream domain formulas/rules, Demo CSV, dependencies, lockfile, specs/plans/tasks, or persistence/export-import infrastructure.

## Required execution

Follow every Task 8B plan checkbox. Prove conditions lifecycle, all three statuses, no-clear-winner, trace links, deterministic export schema, absence of internal keys, real download content, and forbidden-language absence. E2E must cover the complete Demo flow and genuinely invalid CSV flow and fail on application console/page errors.

Run all Task 8B focused tests, every upstream domain and integration regression, full test, build, lint, frozen install, diff check, and `pnpm exec playwright test` with no skipped core spec. Perform keyboard/semantic/browser acceptance at `1440 x 900`, `900 x 900`, and minimal `390 x 844`; report favicon separately rather than suppressing arbitrary errors.

Update README and `manual-mvp-acceptance.md` truthfully. Human audit, sensitivity answers, thresholds, external research, market validation, realized economics, persistence, deployment, and production use remain incomplete/not implemented.

Commit once as `test: complete the local research decision flow`; stop Vite, release ports, finish clean, and stop for final Codex review.
