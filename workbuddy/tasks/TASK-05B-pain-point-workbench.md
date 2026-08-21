# TASK 05B — Pain-Point Evidence Workbench

## Status

Ready for WorkBuddy execution only after the user supplies the exact approved task-sheet HEAD from Codex.

## Objective

Implement the approved desktop-first pain-point evidence workbench on top of Task 5A: seven traceable signal summaries, one semantic review queue containing every active review, selected-review provenance and automatic match evidence, and one reasoned current-session correction per review. Do not change Task 5A classification or aggregation and do not begin Task 5C, the human audit, Task 6, or any commercial scoring.

## Required reading before any change

Read completely:

1. `AGENTS.md`;
2. `docs/specs/2026-08-13-mercata-lens-design.md`;
3. Product Task 5 in `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`;
4. `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`;
5. `docs/plans/2026-08-14-mercata-lens-visual-refresh-implementation-plan.md` for existing visual constraints only;
6. `docs/specs/2026-08-20-task-5-pain-point-evidence-design.md`;
7. `docs/specs/2026-08-20-task-5a-pain-point-domain-design.md`;
8. `docs/plans/2026-08-21-task-5a-pain-point-domain-implementation-plan.md`;
9. `docs/specs/2026-08-21-task-5b-pain-point-workbench-design.md`;
10. `docs/plans/2026-08-21-task-5b-pain-point-workbench-implementation-plan.md`;
11. `workbuddy/README.md` and this task sheet;
12. `src/domain/painPointRules.ts`, `src/domain/painPointRules.test.ts`, `src/domain/painPoints.ts`, and `src/domain/painPoints.test.ts`;
13. `src/domain/types.ts`, `src/domain/quality.ts`, and `src/domain/quality.test.ts` for current data and route-evidence contracts only;
14. `src/research/ResearchContext.tsx`, `src/research/ResearchLayout.tsx`, and `src/research/ResearchLayout.test.tsx`;
15. `src/pages/PainPointsPage.tsx`, `src/pages/CategoryPage.tsx`, and `src/pages/CategoryPage.test.tsx` for existing page/provider test patterns;
16. `src/components/PageHeader.tsx`, `src/components/DataSourceBadge.tsx`, `src/components/IssueTable.tsx`, and their relevant tests;
17. `src/app/styles.css`, `src/fixtures/testDataset.ts`, `public/demo/products.csv`, `public/demo/reviews.csv`, and `package.json`;
18. current Git log, diff, status, TypeScript/Vitest configuration, and every file named in the allowed-file list below if it already exists.

The Task 5B design is normative for product meaning and interaction. The Task 5B implementation plan is normative for interfaces, algorithms, TDD order, test coverage, and verification. If required sources conflict, an allowed path already exists with unexplained content, or the implementation cannot be completed within the allowed files, stop before editing and report the exact conflict.

## Starting gate

Before editing, run:

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git rev-parse HEAD
git merge-base --is-ancestor c58694e149669c828a2a02cc438a41f5d673056a HEAD
git merge-base --is-ancestor ca5f2d03f1c8ab7223a9809b8aea137ff4834191 HEAD
git merge-base --is-ancestor 8c30cb8ff60bc386933be722f05bb07b9ec1904b HEAD
```

Requirements:

- working directory and Git root are exactly `/Users/xanthe/Documents/Mercata Lens`;
- branch is `main`;
- worktree is clean;
- HEAD exactly matches the approved Task 5B task-sheet commit supplied by Codex;
- all three ancestor checks exit `0`.

If any condition fails, stop and report. Do not reset, stash, checkout, switch branches, delete files, overwrite changes, repair history, or bypass a gate.

## Allowed files

Create only:

- `src/research/ResearchContext.test.tsx`;
- `src/components/PainPointSummaryList.tsx`;
- `src/components/PainPointSummaryList.test.tsx`;
- `src/components/ReviewQueue.tsx`;
- `src/components/ReviewQueue.test.tsx`;
- `src/components/ReviewCorrectionPanel.tsx`;
- `src/components/ReviewCorrectionPanel.test.tsx`;
- `src/pages/PainPointsPage.test.tsx`.

Modify only:

- `src/research/ResearchContext.tsx`;
- `src/pages/PainPointsPage.tsx`;
- `src/app/styles.css`.

No other file may change. In particular, do not modify Task 5A domain code/tests, other domain/data modules, schemas, fixtures, Demo CSV, routes, shell, Home, Category, Quality, README, audit/evidence documents, specs/plans/tasks, `package.json`, or `pnpm-lock.yaml`.

## Required public contracts

Extend `ResearchContextValue` with the exact approved current-session contract:

```ts
corrections: PainPointCorrections;
applyReviewCorrection: (
  reviewId: string,
  correction: PainPointCorrection,
) => boolean;
clearReviewCorrection: (reviewId: string) => void;
```

Create the component contracts, status union, row type, and pure queue filter exactly as defined in the Task 5B implementation plan:

```ts
PainPointSummaryListProps
ReviewQueueStatus
ReviewQueueRow
ReviewQueueProps
filterReviewQueueRows(rows, status, activeLabel)
ReviewCorrectionPanelProps
```

Do not rename or duplicate Task 5A types. Do not add derived analysis to Context.

## Required execution

Follow every checkbox in `docs/plans/2026-08-21-task-5b-pain-point-workbench-implementation-plan.md` in order. The sections below are mandatory summaries, not substitutes for that plan.

### 1. ResearchContext correction lifecycle RED → GREEN

Create `src/research/ResearchContext.test.tsx` first. Cover initial empty corrections, valid apply with exact original reason, blank/unknown rejection without mutation, targeted clear, safe missing clear, successful CSV replacement reset, failed CSV import preservation, and Demo reload clearing before a later failure.

Run:

```bash
pnpm vitest run src/research/ResearchContext.test.tsx
```

Record genuine RED before implementation. Implement only in-memory correction state/actions. Copy incoming arrays. Validate against the current dataset and `reason.trim()`. Clear at Demo reload start and successful import; preserve on failed import. Obtain GREEN.

### 2. Workbench components RED → GREEN

Write all three component test files before creating their implementations. Run:

```bash
pnpm vitest run \
  src/components/PainPointSummaryList.test.tsx \
  src/components/ReviewQueue.test.tsx \
  src/components/ReviewCorrectionPanel.test.tsx
```

Expected genuine RED: the three modules are absent.

Implement exactly:

- seven stable summary rows including zero rows, accessible pressed buttons, and display-only fractions;
- four status filters with Task 5B semantics and logical-AND effective-label filtering;
- original dataset order and exactly one semantic review table DOM;
- every review reachable through All, including no-automatic-match reviews;
- selected-review raw source text, provenance, supplied URL caveat, exact automatic phrase/rule/version/end-exclusive offsets, and no fabricated evidence for manual-only labels;
- separate automatic, added, removed, and effective label groups;
- seven desired-effective-label checkboxes, catalog-ordered derived additions/removals, one non-blank original reason, Apply & next, Clear, Reset draft, Previous review, Next review, and status/error announcements;
- dirty draft preventing filters, row selection, previous/next movement, and Show all until Apply or Reset.

Obtain GREEN without weakening assertions.

### 3. PainPointsPage integration RED → GREEN

Create `src/pages/PainPointsPage.test.tsx` with the real `ResearchProvider`, real Task 5A functions, local Demo CSV, and controlled valid/invalid upload fixtures.

Run:

```bash
pnpm vitest run src/pages/PainPointsPage.test.tsx
```

Expected genuine RED: the page is still a placeholder.

Implement page-local derivation and coordination exactly as the plan specifies:

- default Rule-matched filter, no label filter, first matching review;
- seven summaries from `summarizePainPoints(dataset, corrections)`;
- classifications from `classifyReview(review, corrections)`;
- summary activation switches status to All and filters by effective label;
- status changes, Show all, row selection, Previous/Next, Apply & next, and Clear use deterministic selection rules;
- a successful correction immediately changes effective labels and summary counts;
- removed automatic evidence remains visible under Corrected;
- manual additions to no-match reviews never fabricate phrase evidence;
- failed import preserves corrections and summaries;
- successful import resets correction state and page-local selection/filter state;
- defensive no-data copy contains no invented counts;
- visible source/method/denominator/limitation copy remains truthful.

Obtain GREEN.

### 4. Desktop-first styling

Modify only scoped Task 5B selectors in `src/app/styles.css`.

- At `1440 x 900`, render a readable three-part workbench: approximately 210–230px summary, 340–390px queue, and remaining-width editor.
- At intermediate widths, allow the editor to move full-width below summary/queue.
- At `900px` and below, use one column.
- At `390px`, guarantee only regression safety: no page overflow or clipped content/actions, long text wraps, and the same semantic table DOM reflows. Do not build a second mobile UI or claim optimized mobile throughput.
- Reuse existing Light Slate tokens, focus treatment, borders, radii, and typography. Add no decorative chart or dependency.

### 5. Honest RED/GREEN accounting

Do not fabricate RED. If a new assertion is already satisfied by approved behavior, report it as added GREEN coverage. Test-writing mistakes, syntax errors, incorrect fixtures, or environment failures are not behavior RED.

## Truth boundary

- Rule matches are deterministic English phrase signals, not confirmed pain points.
- Human corrections are user-authored current-session annotations, not AI output or independently verified truth.
- Counts/fractions use actual active review records, never product `reviewCount`, sales, customers, demand, or market prevalence.
- A review may contribute to multiple labels; summary totals are not additive.
- Demo records are synthetic. User uploads retain their own unverified collection/sourcing limitations.
- Mercata Lens does not fetch or independently verify supplied review URLs.
- Do not rank signals as Top, Most important, High demand, Low competition, Recommended, commercially attractive, or equivalent.
- Do not add severity, sentiment, confidence, opportunity, economics, recommendation, or commercial status.

## Required final verification

Run the exact focused command from the implementation plan:

```bash
pnpm vitest run \
  src/research/ResearchContext.test.tsx \
  src/components/PainPointSummaryList.test.tsx \
  src/components/ReviewQueue.test.tsx \
  src/components/ReviewCorrectionPanel.test.tsx \
  src/pages/PainPointsPage.test.tsx \
  src/domain/painPointRules.test.ts \
  src/domain/painPoints.test.ts \
  src/research/ResearchLayout.test.tsx \
  src/pages/HomePage.test.tsx \
  src/app/routes.test.tsx
```

Then run in this exact order:

```bash
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Every command must exit `0`. Do not replace `pnpm build`. If an environment safety restriction blocks exact Vite cleanup, stop and report the exact output; do not bypass it without user approval.

Then inspect:

```bash
git status --short
git diff --name-status
git diff --check
rg -n "localStorage|indexedDB|fetch\(|axios|OpenAI|market share|sales prediction|high demand|opportunity score|profit|recommend" \
  src/research/ResearchContext.tsx \
  src/research/ResearchContext.test.tsx \
  src/components/PainPointSummaryList.tsx \
  src/components/PainPointSummaryList.test.tsx \
  src/components/ReviewQueue.tsx \
  src/components/ReviewQueue.test.tsx \
  src/components/ReviewCorrectionPanel.tsx \
  src/components/ReviewCorrectionPanel.test.tsx \
  src/pages/PainPointsPage.tsx \
  src/pages/PainPointsPage.test.tsx \
  src/app/styles.css
```

Expected changed paths before commit and no others:

```text
M src/app/styles.css
A src/components/PainPointSummaryList.test.tsx
A src/components/PainPointSummaryList.tsx
A src/components/ReviewCorrectionPanel.test.tsx
A src/components/ReviewCorrectionPanel.tsx
A src/components/ReviewQueue.test.tsx
A src/components/ReviewQueue.tsx
A src/pages/PainPointsPage.test.tsx
M src/pages/PainPointsPage.tsx
A src/research/ResearchContext.test.tsx
M src/research/ResearchContext.tsx
```

Interpret truthful limitation copy and negative test assertions accurately. If `rg` is unavailable, use `grep -Ein` with the same expression/files, report the substitution, and do not skip the scan.

## Required real-browser smoke check

Use real Chrome at `1440 x 900` with settled Demo data. Verify and report:

1. summary, queue, and editor form a readable three-part hierarchy;
2. `scrollWidth <= clientWidth` and no horizontal page overflow;
3. summary selection filters the queue;
4. selected raw review evidence and provenance are visible;
5. one valid correction applies, updates visible labels/summary, and advances deterministically;
6. Clear correction restores automatic state;
7. no React duplicate-key warning or application runtime error/warning appears.

Stop Vite and verify its port is released. This is only a Task 5B desktop smoke check. Do not claim full keyboard, `900 x 900`, `390 x 844`, human-audit, or final visual acceptance; Task 5C owns those gates.

## Commit and stopping point

After all gates pass, stage exactly the 11 allowed files and run:

```bash
git diff --cached --check
git diff --cached --name-status
git commit -m "feat: add pain point evidence workbench"
git status --short --branch
git rev-parse HEAD
```

Create one ordinary commit. Final worktree must be clean.

Stop immediately after the Task 5B commit. Do not amend, push, deploy, create a PR, modify this task sheet, write audit outcomes, start Task 5C, start Task 6, or add economics, opportunity scoring, recommendations, AI, persistence, backend, scraping, or external APIs.

## Delivery report

Report:

1. repository root, branch, exact starting HEAD, clean starting status, and all ancestor-check exit codes;
2. complete required-reading list and any conflict found;
3. exact files created/modified and confirmation that no prohibited path changed;
4. genuine RED output/exit code and final GREEN result for Context, components, and page integration;
5. any assertions that were GREEN coverage rather than genuine RED;
6. exact correction validation/copy/reset/preservation behavior;
7. exact summary, queue-filter, all-review reachability, desired-label derivation, dirty-draft, Apply/next/Clear selection behavior;
8. exact source/provenance and manual-only evidence boundaries;
9. exact focused/full/build/lint/install/diff-check commands, exits, and actual file/test counts;
10. exact scope/forbidden-capability scan output and any `rg` substitution;
11. factual `1440 x 900` browser observations, overflow values, interaction result, console state, Vite shutdown, and port release;
12. final commit SHA/message and final `git status --short --branch`;
13. explicit confirmation that Task 5A domain, route locks, data/fixtures, other pages, README/audit, dependencies, Task 5C, Task 6, economics, scoring, recommendation, AI, persistence, backend, scraping, APIs, push, deployment, and PR were not changed or started.
