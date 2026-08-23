# TASK 05C — Pain-Point Audit Handoff and Acceptance

## Status

Ready only after Codex supplies the exact approved task-sheet HEAD. This task closes Product Task 5 but does not complete the user's human audit.

## Objective

Create the deterministic blank 50-review audit handoff, rule changelog, acceptance record, and accurate README; verify the approved Task 5A/5B implementation without changing runtime behavior.

## Required reading

Read completely:

1. `AGENTS.md`;
2. `docs/specs/2026-08-13-mercata-lens-design.md`;
3. the Product Task 5 section of `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`;
4. `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`;
5. `docs/plans/2026-08-14-mercata-lens-visual-refresh-implementation-plan.md`;
6. `docs/specs/2026-08-20-task-5-pain-point-evidence-design.md`;
7. `docs/specs/2026-08-20-task-5a-pain-point-domain-design.md`;
8. `docs/plans/2026-08-21-task-5a-pain-point-domain-implementation-plan.md`;
9. `docs/specs/2026-08-21-task-5b-pain-point-workbench-design.md`;
10. `docs/plans/2026-08-21-task-5b-pain-point-workbench-implementation-plan.md`;
11. `docs/specs/2026-08-23-remaining-mvp-delivery-design.md`;
12. `docs/specs/2026-08-23-task-5c-pain-point-acceptance-design.md`;
13. `docs/plans/2026-08-23-task-5c-pain-point-acceptance-implementation-plan.md`;
14. `workbuddy/README.md`, this task sheet, and root `README.md`;
15. `public/demo/products.csv` and `public/demo/reviews.csv`;
16. all Task 5 domain/component/page/Context implementation and tests;
17. `src/app/styles.css`, routes, quality contracts, package/TypeScript/Vitest configuration, and current Git log/diff/status.

The Task 5C design and implementation plan at items 12–13 are normative. Do not invent alternate filenames for any required source.

If any required file is absent/conflicting, stop before editing.

## Starting gate

Verify exact root `/Users/xanthe/Documents/Mercata Lens`, branch `main`, clean worktree, exact HEAD supplied by Codex, and that `9a1936e55e0dcd6e470e7e6ce994bb034023d067`, `7af3ce5730fde66ae913a98f110aec115344a2d5`, and `af415cd568fb7f8087f273abc0a111dc4068682e` are ancestors. Failure means stop; never reset, stash, checkout, overwrite, delete, or repair history.

## Allowed files

Create only:

- `docs/evidence/review-audit.csv`
- `docs/evidence/review-rule-changelog.md`
- `docs/evidence/manual-pain-point-check.md`
- `src/domain/painPointAudit.test.ts`

Modify only `README.md`. Runtime TS/TSX, CSS, Task 5 rules, fixtures, Demo CSV, dependencies, lockfile, specs/plans/tasks, and all Task 6+ files are forbidden. A browser defect requires an immediate stop and Codex rescope.

## Required execution

Follow every plan checkbox in order. Create the missing-file RED, generate exactly 50 Demo-ordered rows, prove classifier/catalog ordering and blank human fields, create the unchanged `1.0.0` changelog baseline, separate automated/browser/human evidence, and state that human audit is incomplete.

Run:

```bash
pnpm vitest run src/domain/painPointAudit.test.ts
pnpm vitest run src/research/ResearchContext.test.tsx src/components/PainPointSummaryList.test.tsx src/components/ReviewQueue.test.tsx src/components/ReviewCorrectionPanel.test.tsx src/pages/PainPointsPage.test.tsx src/domain/painPointRules.test.ts src/domain/painPoints.test.ts src/domain/painPointAudit.test.ts src/research/ResearchLayout.test.tsx src/pages/HomePage.test.tsx src/app/routes.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Perform the exact browser/keyboard checks in the design at all three viewports, stop Vite, release its port, and report actual counts and observations separately.

Commit once as `test: complete pain point acceptance`; finish clean and stop. Do not begin Task 6A.
