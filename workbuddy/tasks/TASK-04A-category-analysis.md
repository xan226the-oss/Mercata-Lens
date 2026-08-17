# TASK 04A — Traceable Category Analysis Contracts

## Status

Ready for WorkBuddy implementation only after the user supplies the exact approved starting HEAD from Codex.

## Objective

Implement the pure, deterministic category-analysis domain contract approved for Product Task 4A. The result must calculate descriptive sample statistics, expose product-ID evidence and exact boundaries, and preserve every factual limitation. This task does not build UI and does not start Task 4B, Task 4C, or Task 5.

## Required reading before any change

Read completely:

1. `AGENTS.md`;
2. `docs/specs/2026-08-13-mercata-lens-design.md`;
3. `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`, especially Product Task 4;
4. `docs/specs/2026-08-17-task-4a-category-analysis-design.md`;
5. `docs/plans/2026-08-17-task-4a-category-analysis-implementation-plan.md`;
6. `workbuddy/README.md`;
7. `src/domain/types.ts`, `src/domain/dataset.ts`, `src/domain/quality.ts`, and their tests;
8. `src/fixtures/testDataset.ts`;
9. current `package.json` scripts and current Git diff/status.

If these sources conflict, stop without editing and report the exact conflict.

## Starting gate

Before editing:

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git rev-parse HEAD
git merge-base --is-ancestor 84b85bab87986a173f03a9e3abd485e39711aac9 HEAD
git merge-base --is-ancestor d60d455c169587bd5c02d4769cfc36e6e7ab7416 HEAD
```

Requirements:

- root is exactly `/Users/xanthe/Documents/Mercata Lens`;
- branch is `main`;
- worktree is clean;
- HEAD exactly matches the approved task-sheet commit supplied by Codex;
- both ancestor checks exit `0`.

If any check fails, stop and report. Do not repair, reset, stash, or switch branches.

## Allowed files

Create only:

- `src/domain/category.ts`;
- `src/domain/category.test.ts`.

Do not modify `src/domain/types.ts` unless compilation proves that the approved contracts cannot remain in `category.ts`. If that exceptional change is genuinely necessary, stop before modifying it and request Codex review of the scope expansion.

All other files are prohibited, including pages, components, ResearchContext, app shell/styles/routes, data loaders/import, fixtures, Demo CSV, README, existing plans/specs/tasks, dependencies, and lockfile.

## Required interface and behavior

Export:

```ts
analyzeCategory(dataset: ResearchDataset): CategoryAnalysis
```

The returned analysis must include:

- product count;
- exact median, price range, Q1 and Q3;
- sample-relative price bands derived from deduplicated Q1/median/Q3;
- fixed rating bands `<3`, `3–<4`, `4–<4.5`, `4.5–5`;
- fixed review-count bands `0`, `1–99`, `100–499`, `500+`;
- null review-count total;
- exact trimmed brand groups, including `Not provided`;
- coverage of brand, material, capacity, filter cost, and review count;
- contributing product IDs for every band/group/coverage result;
- top-level included IDs, category, source kind, limitations, status, and status reasons.

Follow every calculation and edge-case rule in the approved Task 4A design and implementation plan. Those files are normative; do not substitute a library default or an assumed statistical convention.

## Truth and product boundaries

- Describe only products in the active dataset.
- Brand shares are sample shares, never market share.
- Price bands are comparison-set bands, never recommended prices or total-market distribution.
- `reviewCount` is never sales, customers, demand, velocity, popularity, or market share.
- `continue_research` only means at least three valid products allow descriptive inspection.
- Do not emit `pause`; there is no approved negative commercial threshold in Task 4A.
- Demo data is synthetic; user uploads retain their own source limitations.
- Never add sales, GMV, ROAS, profitability, competition, demand, best-seller, purchase, or launch-price conclusions.

## TDD execution

Follow the implementation plan exactly:

1. write the first price/median tests;
2. run focused tests and preserve genuine RED output;
3. implement only enough for GREEN;
4. repeat RED → GREEN for rating/review bands;
5. repeat RED → GREEN for brand/coverage;
6. repeat RED → GREEN for evidence/limitations/status;
7. run the full verification gate.

Do not fabricate a RED phase. If a test unexpectedly passes because existing behavior already covers it, report that fact and continue without claiming RED.

## Required tests

At minimum cover:

- six-product median `29.5`;
- price-band counts sum to six;
- `AquaPet` count `2`, share `2 / 6`;
- odd/even/empty/one/two/three product cases;
- same-price and repeated-boundary samples;
- all exact rating and review-count boundaries;
- null review count;
- missing, whitespace, trimmed, and case-distinct brands;
- stable brand ordering;
- zero numeric attribute values as present;
- all attribute counts, shares, denominators, and product IDs;
- Demo versus user-upload limitations;
- status threshold below and at three products;
- no `pause` result;
- no mutation, `NaN`, `Infinity`, or fabricated fallback.

## Verification gate

Run and report exact results:

```bash
pnpm vitest run src/domain/category.test.ts
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Also run:

```bash
git diff --name-only
git status --short
```

Before commit, only the two allowed new files may appear.

## Commit and stopping point

After every required check passes:

```bash
git add src/domain/category.ts src/domain/category.test.ts
git commit -m "feat: add traceable category analysis"
```

Create one ordinary commit. Do not amend, push, deploy, create a PR, or start UI work.

Stop immediately after the Task 4A commit and final clean-status check.

## Delivery report

Report:

1. repository root, starting HEAD, branch, and starting worktree state;
2. both ancestor-check exit codes;
3. files created and confirmation that no prohibited file changed;
4. exact RED evidence for each behavior group;
5. exact focused/full/build/lint/install/diff-check results;
6. important calculation decisions and edge-case behavior;
7. final commit SHA and message;
8. final `git status --short --branch`;
9. explicit confirmation that Task 4B, Task 4C, Task 5, UI, Home integration, pain points, economics, scoring, AI, backend, persistence, scraping, push, deployment, and PR creation were not started.
