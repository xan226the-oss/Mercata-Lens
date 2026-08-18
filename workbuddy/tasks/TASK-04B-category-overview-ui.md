# TASK 04B — Traceable Category Overview UI

## Status

Ready for WorkBuddy implementation only after the user supplies the exact approved starting HEAD from Codex.

## Objective

Render the approved Task 4A category analysis on Category Overview and connect the same truthful price/brand results to Home. Preserve all evidence, provenance, route locks, and product boundaries. Do not change statistics or begin Task 4C or Task 5.

## Required reading before any change

Read completely:

1. `AGENTS.md`;
2. `docs/specs/2026-08-13-mercata-lens-design.md`;
3. Product Task 4 in `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`;
4. `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`;
5. `docs/specs/2026-08-17-task-4a-category-analysis-design.md`;
6. `docs/specs/2026-08-18-task-4b-category-overview-ui-design.md`;
7. `docs/plans/2026-08-18-task-4b-category-overview-ui-implementation-plan.md`;
8. `workbuddy/README.md`;
9. `src/domain/category.ts` and `src/domain/category.test.ts`;
10. all existing pages/components/tests named in the Task 4B plan;
11. current `package.json`, Git log, diff, and status.

If these sources conflict, stop without editing and report the exact conflict.

## Starting gate

Before editing:

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git rev-parse HEAD
git merge-base --is-ancestor b859245ea75c602ea083c4f661935cee05f3f2e0 HEAD
git merge-base --is-ancestor 2e1c9b53ae6ab7c3b370979f8540c8b57cbc9efd HEAD
```

Requirements:

- root is exactly `/Users/xanthe/Documents/Mercata Lens`;
- branch is `main`;
- worktree is clean;
- HEAD exactly matches the approved task-sheet commit supplied by Codex;
- both ancestor checks exit `0`.

If any check fails, stop and report. Do not reset, stash, checkout, switch branches, or repair history.

## Allowed files

Create only:

- `src/components/MetricCard.tsx`;
- `src/components/MetricCard.test.tsx`;
- `src/components/SampleDistribution.tsx`;
- `src/components/SampleDistribution.test.tsx`;
- `src/components/DataSourceBadge.tsx`;
- `src/components/DataSourceBadge.test.tsx`;
- `src/components/EvidenceDrawer.tsx`;
- `src/components/EvidenceDrawer.test.tsx`;
- `src/pages/CategoryPage.test.tsx`.

Modify only:

- `src/pages/CategoryPage.tsx`;
- `src/pages/HomePage.tsx`;
- `src/pages/HomePage.test.tsx`;
- `src/components/MetricStrip.tsx`;
- `src/app/routes.test.tsx`;
- `src/app/styles.css`.

Any additional file requires stopping and requesting Codex scope review before modification.

## Required behavior

- Both Home and Category derive results with `useMemo(() => dataset ? analyzeCategory(dataset) : null, [dataset])`.
- Do not write analysis to Context or recalculate domain statistics in UI code.
- Category shows source/status, four metrics, price/rating/review distributions, brand sample shares, attribute coverage, native evidence disclosure, and every limitation.
- Home shows products, review evidence, observed price range, and provided-brand-label count.
- Home moves the active products' minimum/maximum `observedAt` range into visible `PageHeader` metadata so replacing the Imported metric does not erase time provenance.
- Home replaces the old Task 4 placeholder with the active sample's compact price distribution and Category link.
- Home shows that compact distribution and link only when category availability is `available`; a locked category keeps an evidence-insufficient message with no bars or active link.
- All progress scales begin at zero and show exact counts and denominator.
- Zero-count fixed bands remain visible.
- Evidence remains keyboard accessible through native `<details>/<summary>`.
- Rejected imports leave active metrics and distributions unchanged.
- Locked `/category` behavior remains unchanged.
- Demo and user-upload provenance remain explicit.

## Truth boundary

- Never use `market share`, `low competition`, `high demand`, `best price`, `recommended price`, `commercially attractive`, sales prediction, purchase advice, or bestseller language.
- `reviewCount` is review count only.
- Price and brand results describe only the active sample.
- `Continue research` means descriptive inspection may continue, not that the category should be entered.
- No result may claim Amazon, live-market coverage, verified-market coverage, profitability, or performance.

## TDD and verification

Follow the implementation plan's RED → GREEN groups exactly:

1. presentation components;
2. CategoryPage integration;
3. Home and route integration.

Do not fabricate RED. If a new test unexpectedly passes, report it honestly.

Required final commands:

```bash
pnpm vitest run \
  src/components/MetricCard.test.tsx \
  src/components/SampleDistribution.test.tsx \
  src/components/DataSourceBadge.test.tsx \
  src/components/EvidenceDrawer.test.tsx \
  src/pages/CategoryPage.test.tsx \
  src/pages/HomePage.test.tsx \
  src/app/routes.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
git diff --name-only
git status --short
```

Perform a real-browser smoke check on Home and `/category` at a normal desktop viewport and 390px width. This is not Task 4C final acceptance.

## Commit and stopping point

After all checks pass, create one ordinary commit:

```bash
git add \
  src/components/MetricCard.tsx \
  src/components/MetricCard.test.tsx \
  src/components/SampleDistribution.tsx \
  src/components/SampleDistribution.test.tsx \
  src/components/DataSourceBadge.tsx \
  src/components/DataSourceBadge.test.tsx \
  src/components/EvidenceDrawer.tsx \
  src/components/EvidenceDrawer.test.tsx \
  src/pages/CategoryPage.tsx \
  src/pages/CategoryPage.test.tsx \
  src/pages/HomePage.tsx \
  src/pages/HomePage.test.tsx \
  src/components/MetricStrip.tsx \
  src/app/routes.test.tsx \
  src/app/styles.css
git commit -m "feat: add traceable category overview"
```

Do not amend, push, deploy, create a PR, start Task 4C, or start Task 5.

## Delivery report

Report:

1. repository root, starting HEAD, branch, and clean starting status;
2. both ancestor-check exit codes;
3. exact RED → GREEN evidence for each behavior group;
4. every created/modified file and confirmation that no other file changed;
5. exact focused/full/build/lint/install/diff-check results;
6. desktop and 390px smoke observations, viewport sizes, overflow result, evidence disclosure behavior, and console state;
7. explicit sample-only, provenance, review-count, price, and brand boundaries;
8. final commit SHA/message and final clean Git status;
9. confirmation that Task 4A domain logic, Context, data, quality gates, Demo data, dependencies, Task 4C, Task 5, pain points, economics, scoring, AI, backend, persistence, scraping, push, deployment, and PR were not changed or started.
