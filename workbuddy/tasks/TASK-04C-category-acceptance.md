# TASK 04C — Category Acceptance and Documentation

## Status

Ready for WorkBuddy execution only after the user supplies the exact approved task-sheet commit from Codex.

## Objective

Close Product Task 4 by verifying the approved Task 4A analysis and Task 4B interface. Produce an independent manual calculation, strengthen the native evidence-disclosure contract, reconcile README, and complete real-browser responsive and keyboard acceptance. Do not change category behavior and do not begin Task 5.

## Required reading before any change

Read completely:

1. `AGENTS.md`;
2. `docs/specs/2026-08-13-mercata-lens-design.md`;
3. Product Task 4 in `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`;
4. `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`;
5. `docs/specs/2026-08-17-task-4a-category-analysis-design.md`;
6. `docs/specs/2026-08-18-task-4b-category-overview-ui-design.md`;
7. `docs/specs/2026-08-20-task-4c-category-acceptance-design.md`;
8. `docs/plans/2026-08-20-task-4c-category-acceptance-implementation-plan.md`;
9. `workbuddy/README.md` and this task sheet;
10. `README.md`;
11. `public/demo/products.csv` and `public/demo/reviews.csv`;
12. `src/domain/category.ts` and `src/domain/category.test.ts`;
13. `src/pages/HomePage.tsx`, `src/pages/HomePage.test.tsx`, `src/pages/CategoryPage.tsx`, and `src/pages/CategoryPage.test.tsx`;
14. `src/components/SampleDistribution.tsx`, `src/components/SampleDistribution.test.tsx`, `src/components/EvidenceDrawer.tsx`, `src/components/EvidenceDrawer.test.tsx`, `src/components/DataSourceBadge.tsx`, and `src/components/DataSourceBadge.test.tsx`;
15. `src/research/ResearchLayout.tsx`, `src/research/ResearchLayout.test.tsx`, `src/app/routes.tsx`, and `src/app/routes.test.tsx`;
16. `src/app/styles.css` and `package.json`;
17. current Git log, diff, and status.

If these sources conflict, stop without editing and report the exact conflict.

## Starting gate

Before editing, run:

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git rev-parse HEAD
git merge-base --is-ancestor 9acd48bdf36d6a3d5681b0aa6c74fe45e85523cf HEAD
git merge-base --is-ancestor 261387b3f656200bf73627dee40dcb56f423c27b HEAD
git merge-base --is-ancestor 7210d3b347e1da0e121e2b5f83d598121eed4aae HEAD
```

Requirements:

- working directory and Git root are exactly `/Users/xanthe/Documents/Mercata Lens`;
- branch is `main`;
- worktree is clean;
- HEAD exactly matches the approved task-sheet commit supplied by Codex;
- all three ancestor checks exit `0`.

If any condition fails, stop and report. Do not reset, stash, checkout, switch branches, delete files, overwrite user work, or repair history.

## Allowed files

Create only:

- `docs/evidence/manual-category-check.md`.

Modify only:

- `src/components/EvidenceDrawer.test.tsx`;
- `README.md`.

Do not modify `src/app/styles.css` or any runtime TS/TSX file in this execution. The design permits a later evidence-scoped repair, but this task sheet requires WorkBuddy to stop first if browser acceptance finds a defect.

Any other required file means stop and request Codex scope review.

## Required work

### 1. Strengthen only the missing disclosure assertion

Run the current acceptance-focused tests before editing:

```bash
pnpm vitest run \
  src/components/SampleDistribution.test.tsx \
  src/components/EvidenceDrawer.test.tsx \
  src/components/DataSourceBadge.test.tsx \
  src/pages/CategoryPage.test.tsx \
  src/pages/HomePage.test.tsx \
  src/research/ResearchLayout.test.tsx \
  src/app/routes.test.tsx
```

Review existing assertions. Do not duplicate coverage for progress names, exact denominators, zero-count bands, source states, Category sections, or locked routes.

In the existing EvidenceDrawer test named `uses native details and exposes all calculation evidence after opening`, add:

```tsx
const disclosure = screen.getByTestId("category-evidence");
expect(disclosure.tagName).toBe("DETAILS");
expect(disclosure).not.toHaveAttribute("open");
expect(screen.getByText("Calculation evidence").closest("summary")).toBeInTheDocument();

await userEvent.click(screen.getByText("Calculation evidence"));

expect(disclosure).toHaveAttribute("open");
```

Retain the existing ID, cut-point, excluded-product, brand-group, and attribute-evidence assertions.

Run:

```bash
pnpm vitest run src/components/EvidenceDrawer.test.tsx
```

The approved implementation is expected to pass. Report it as strengthened coverage that was GREEN on first valid execution. Do not fabricate RED or change runtime code to manufacture one.

### 2. Complete real-browser acceptance before writing success evidence

Start one server:

```bash
pnpm dev --host 127.0.0.1
```

Use the printed URL in a real local browser. Explicitly set and observe all three viewports.

At `1440 x 900`, Home must show 12 products, 76 review evidence records with visible not-sales wording, `$24.99 – $44.99`, 6 provided brand labels, the `0 to 12 products` compact scale, a real Category link, four metric columns, and no horizontal overflow.

At `1440 x 900`, Category must show four metric columns, median `$35.99`, range `$24.99 – $44.99`, a `0 to 12 products in this sample` scale, four price bands each containing `3 / 12 products`, the other two distributions, brand and coverage sections, a visible Calculation evidence summary, and no horizontal overflow. Expand Calculation evidence and compare its cut points and price-band product IDs with the manual values below.

At `900 x 900`, verify the shell is single-column, navigation has no overlap, Home analysis stacks, Category metrics use two columns, Category distributions use one column, and neither page overflows horizontally.

At `390 x 844`, verify compact navigation, one-column Home and Category metrics, file inputs at least 40px high, unclipped distributions, wrapped evidence IDs and limitations, an operable disclosure, and no horizontal overflow.

At `1440 x 900` and `390 x 844`, use real keyboard input. Complete the Demo calculation comparison before selecting files. Use only the repository's synthetic `public/demo/products.csv` and `public/demo/reviews.csv` for the control-state check. Verify:

- available navigation links receive focus;
- `Open Category overview` receives focus;
- both file inputs receive focus;
- the disabled import button is visibly distinguishable and is skipped by normal Tab navigation;
- after both synthetic CSV files are selected, the enabled import button receives focus;
- Calculation evidence receives focus;
- Enter or Space toggles the disclosure from closed to open;
- focus indication is visually discernible.

Inspect Home and Category console output. There must be no application runtime error, React warning, or duplicate-key warning. Report resource-only messages separately and accurately.

If any browser requirement fails, stop without modifying CSS or runtime files. Report exact URL, state, viewport, reproduction, measurements, console output, and proposed file. Do not continue to a success document or commit.

After browser acceptance, stop the server and check its printed port. For the normal port run:

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Expected: no listener. If Vite used another port, check that exact port instead.

### 3. Create the independent manual calculation

Only after the browser values match, create `docs/evidence/manual-category-check.md` with the exact structure and content specified in Task 3 Step 1 of the implementation plan.

It must record approved application commit `9acd48bdf36d6a3d5681b0aa6c74fe45e85523cf` and include all 12 sorted products:

```text
p09 24.99
p05 27.99
p01 29.99
p11 30.99
p04 32.99
p02 34.99
p07 36.99
p10 37.99
p12 38.99
p03 39.99
p08 41.99
p06 44.99
```

It must show:

```text
Q1 = (29.99 + 30.99) / 2 = 30.49
Median = (34.99 + 36.99) / 2 = 35.99
Q3 = (38.99 + 39.99) / 2 = 39.49
Observed range = 24.99 to 44.99

Up to 30.49: p09, p05, p01
>30.49 to 35.99: p11, p04, p02
>35.99 to 39.49: p07, p10, p12
>39.49: p03, p08, p06
```

State that all four counts are 3, sum to 12, and contain every included product exactly once. Compare the calculation with the actual browser metric, distribution, scale, cut points, and evidence IDs. Preserve the synthetic-fixture and current-sample-only limitations.

If any manual result differs from the browser, stop and report. Do not edit the calculation to force agreement.

### 4. Reconcile README exactly

Follow Task 3 Steps 2–4 of the implementation plan.

Required outcomes:

- Visual workflow describes the shipped Home and Category behavior;
- README links to `docs/evidence/manual-category-check.md`;
- Product boundary says browser-memory data is not persisted;
- project structure includes `category.ts`, `MetricCard.tsx`, `SampleDistribution.tsx`, `DataSourceBadge.tsx`, and `EvidenceDrawer.tsx`;
- Running the Demo describes the actual 12-product/76-review-evidence Category experience;
- final status says Category statistics and traceability are implemented for the active local sample;
- pain points, economics, opportunity scoring, decisions, AI, backend, persistence, scraping, and production validation remain unimplemented;
- obsolete claims that price/category statistics remain unavailable are removed.

Do not broadly rewrite unrelated README sections or make production claims.

## Truth boundary

- All displayed numbers describe the active local comparison sample.
- Demo data is synthetic and is not live marketplace evidence.
- User upload identifies data origin only and does not validate that data.
- Review count is not sales.
- Price bands do not establish total-market distribution, competition, a best price, or purchase advice.
- Represented brand labels do not establish wider-market concentration.
- `Continue research` permits descriptive inspection only and is not an entry recommendation.
- Manual agreement proves deterministic calculation for this fixture only.

## Required final verification

Run in this exact order:

```bash
pnpm vitest run \
  src/components/SampleDistribution.test.tsx \
  src/components/EvidenceDrawer.test.tsx \
  src/components/DataSourceBadge.test.tsx \
  src/pages/CategoryPage.test.tsx \
  src/pages/HomePage.test.tsx \
  src/research/ResearchLayout.test.tsx \
  src/app/routes.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Then run:

```bash
test -f docs/evidence/manual-category-check.md
rg -n "manual-category-check|Category Overview|Customer pain points|review count|synthetic" README.md docs/evidence/manual-category-check.md
rg -n "Price distribution, brand structure, rating distribution.*remain unavailable|Data, statistics, CSV import.*land in later" README.md
git diff --name-status
git status --short
```

Expected:

- every test/build/lint/install/diff command exits `0`;
- the first documentation search finds the new descriptions;
- the obsolete-text search exits `1` with no output;
- only these paths changed:

```text
A docs/evidence/manual-category-check.md
M README.md
M src/components/EvidenceDrawer.test.tsx
```

No CSS, runtime TS/TSX, domain, data, Context, fixture, Demo, dependency, or lock file may change.

If `rg` is unavailable in WorkBuddy's shell, use `grep -Ein` with the same patterns and files, and report the substitution and exact outputs. Do not skip either documentation search.

## Commit and stopping point

After all automated, browser, manual, documentation, server, and scope checks pass:

```bash
git add \
  docs/evidence/manual-category-check.md \
  README.md \
  src/components/EvidenceDrawer.test.tsx
git diff --cached --check
git commit -m "test: complete category acceptance"
```

Do not amend, push, deploy, create a PR, or begin Task 5.

After committing:

```bash
git status --short --branch
git rev-parse HEAD
```

Final worktree must be clean.

## Delivery report

Report:

1. root, branch, exact starting HEAD, and clean starting status;
2. all three ancestor-check exit codes;
3. complete required-reading list;
4. baseline and final focused test counts;
5. honest disclosure-test RED/GREEN classification;
6. exact manual input rows, arithmetic, band memberships, browser comparison, and limitations;
7. exact `1440 x 900`, `900 x 900`, and `390 x 844` Home and Category observations, including clientWidth/scrollWidth and computed metric-column counts;
8. real keyboard sequence, activation key, focus visibility, and disclosure closed/open result at desktop and mobile widths;
9. console messages and their classification;
10. server PID/port and proof of shutdown;
11. README sections changed and obsolete claims removed;
12. focused/full/build/lint/install/diff-check commands, exit codes, and exact summaries;
13. exact changed files, final commit SHA/message, and clean final status;
14. which states came from browser observation and which came only from automated tests;
15. explicit confirmation that no CSS or runtime source changed and that Task 5, pain points, corrections, economics, scoring, decisions, AI, backend, persistence, scraping, push, deployment, and PR were not started.
