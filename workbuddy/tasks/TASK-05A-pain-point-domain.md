# TASK 05A — Deterministic Pain-Point Evidence Domain

## Status

Ready for WorkBuddy execution only after the user supplies the exact approved task-sheet commit from Codex.

## Objective

Implement the approved pure Task 5A domain contract: a conservative versioned phrase catalog, deterministic original-text span matching, correction precedence, and seven stable evidence summaries. This task creates no UI or stored state and does not begin Task 5B, Task 5C, Task 6, or the human audit.

## Required reading before any change

Read completely:

1. `AGENTS.md`;
2. `docs/specs/2026-08-13-mercata-lens-design.md`;
3. Product Task 5 in `docs/plans/2026-08-13-mercata-lens-implementation-plan.md`;
4. `docs/specs/2026-08-20-task-5-pain-point-evidence-design.md`;
5. `docs/specs/2026-08-20-task-5a-pain-point-domain-design.md`;
6. `docs/plans/2026-08-21-task-5a-pain-point-domain-implementation-plan.md`;
7. `workbuddy/README.md` and this task sheet;
8. `src/domain/types.ts`, `src/domain/dataset.ts`, `src/domain/schemas.ts`, `src/domain/schemas.test.ts`, `src/domain/quality.ts`, and `src/domain/quality.test.ts`;
9. `src/domain/category.ts` and `src/domain/category.test.ts` for existing domain style only, not for behavior reuse;
10. `src/fixtures/testDataset.ts`;
11. `public/demo/reviews.csv` to verify the approved phrases are fixture-grounded, without changing the fixture or tuning rules for a desired count;
12. `package.json`, TypeScript/Vitest configuration, current Git log, diff, and status.

The Task 5 and Task 5A designs are normative for product meaning. The Task 5A implementation plan is normative for interfaces, step order, tests, and algorithms. If any required source conflicts with another or current code makes an allowed-file-only implementation impossible, stop without editing and report the exact conflict.

## Starting gate

Before editing, run:

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git rev-parse HEAD
git merge-base --is-ancestor e77b7dfc684e31ed76f33a37d7658094e6ceed94 HEAD
git merge-base --is-ancestor ba970af5a77eac20695f012f1aa76ee2a8a7aac7 HEAD
git merge-base --is-ancestor f9de056af5f34f4cb36b90d9187fb52f6dc80510 HEAD
```

Requirements:

- working directory and Git root are exactly `/Users/xanthe/Documents/Mercata Lens`;
- branch is `main`;
- worktree is clean;
- HEAD exactly matches the approved task-sheet commit supplied by Codex;
- all three ancestor checks exit `0`.

If any condition fails, stop and report. Do not reset, stash, checkout, switch branches, delete files, overwrite changes, repair history, or bypass a failed gate.

## Allowed files

Create only:

- `src/domain/painPointRules.ts`;
- `src/domain/painPointRules.test.ts`;
- `src/domain/painPoints.ts`;
- `src/domain/painPoints.test.ts`.

Do not modify `src/domain/types.ts` or any existing file. If an existing-file change appears necessary, stop before making it and request Codex scope review.

Explicitly prohibited files include pages, components, `ResearchContext`, app routes/shell/styles, data loaders/import, existing domain modules, fixtures, Demo CSV, README, evidence/audit documents, specs/plans/tasks, dependencies, and the lockfile.

## Required public contract

Export the exact approved catalog and types from `painPointRules.ts`:

```ts
PAIN_POINT_RULESET_VERSION === "1.0.0"
PAIN_POINT_IDS
PainPointId
PainPointRule
PAIN_POINT_RULES
PainPointMatch
matchPainPointRule(reviewText, rule)
matchPainPointRules(reviewText)
```

Export the exact approved correction, classification, evidence, and summary contracts from `painPoints.ts`:

```ts
PainPointCorrection
PainPointCorrections
CorrectionValidity
ReviewClassification
PainPointEvidenceItem
PainPointSummary
classifyReview(review, corrections?)
summarizePainPoints(dataset, corrections?)
```

Use the property names and shapes in the implementation plan. Do not rename fields, omit original source offsets, add inferred scores, or create presentation-formatted percentages.

## Required execution

Follow every checkbox in `docs/plans/2026-08-21-task-5a-pain-point-domain-implementation-plan.md` in order. The following gates are mandatory summaries, not substitutes for the detailed plan.

### 1. Rule catalog RED → GREEN

Write the exact seven-rule catalog test first, then run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts
```

Expected genuine RED: `./painPointRules` is missing. Preserve the real failure and exit code.

Implement only the approved `1.0.0` catalog and obtain GREEN. Do not add phrases merely to increase Demo coverage.

### 2. Source-span matcher RED → GREEN

Add the approved tests for:

- case, punctuation, newline, tab, and repeated-whitespace normalization;
- exact `start`, end-exclusive `end`, and `sourceText` slicing;
- no stemming (`harder to clean` does not equal `hard to clean`);
- overlapping exclusion only (`not noisy`, `no leaks`);
- a later separate complaint in the same review remaining matched;
- pump lifetime, multi-label text, empty text, punctuation-only text;
- longest-overlap resolution, configured phrase tie order, stable source order, and catalog immutability.

Run the focused rule file before and after implementation. The existing catalog tests must remain GREEN while the missing matcher behavior provides the next genuine RED.

The matcher must tokenize with ASCII `[A-Za-z0-9]+`, lowercase only for comparison, retain original offsets, and return the exact original substring. Do not use stemming, fuzzy matching, semantic inference, regex sentiment shortcuts, translation, or AI.

### 3. Review classification RED → GREEN

Write classification tests before creating `painPoints.ts`. Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts src/domain/painPoints.test.ts
```

Expected genuine RED: `./painPoints` is missing while rule tests remain GREEN.

Implement correction behavior exactly:

- calculate automatic matches first;
- accept only the correction keyed by the current `reviewId`;
- stable-deduplicate correction arrays without mutating inputs;
- preserve the exact entered reason;
- a whitespace-only reason yields `ignored_blank_reason` and makes no label change;
- apply additions, then removals;
- removal wins if a label appears in both arrays;
- retain requested no-op additions/removals in the correction snapshot;
- report only actual differences in `addedLabels` and `removedLabels`;
- never delete or rewrite `automaticMatches`.

Obtain GREEN before adding summary tests.

### 4. Evidence summary RED → GREEN

Only after classification is GREEN, add summary imports, fixtures, and tests. The new genuine RED must come from missing summary behavior, not from an early missing export or unused import.

Implement exactly seven `PainPointSummary` rows in approved catalog order, including zero rows. For every row:

- count each effectively labelled review once even when it has multiple phrase spans;
- denominator is `dataset.reviews.length`, never product `reviewCount`;
- fraction is raw `count / denominator`, or `null` only when the denominator is zero;
- keep distinct product IDs in first-review occurrence order;
- keep evidence in dataset review order;
- retain review ID, product ID, rating, full English source text, nullable date, nullable verified-purchase value, URL, and automatic matches;
- a manual-only addition has no fabricated phrase or offset and exposes its non-blank reason;
- a manually removed label contributes to neither the active summary nor its count, while `classifyReview` retains the automatic match;
- one review may contribute once to several labels, so cross-label totals are not additive;
- empty-text review records remain in the denominator;
- do not silently deduplicate dataset review IDs or infer dataset validity inside Task 5A.

Run both focused files and obtain GREEN.

### 5. Coverage audit

Before the full gate, verify that focused tests explicitly cover:

- version and exact seven-rule order;
- all exact rule phrases and exact English/Chinese labels;
- original text slice invariant;
- local exclusion rather than whole-review veto;
- deterministic overlap and output ordering;
- empty and punctuation-only reviews;
- multi-label reviews;
- valid addition, valid removal, add/remove conflict, no-op correction, blank reason, other-review correction, and correction deduplication;
- manual-only evidence with no automatic phrase;
- seven stable summaries, zero rows, zero denominator, and finite non-null values;
- actual review denominator rather than displayed product review counts;
- distinct product coverage and evidence order;
- nullable review provenance;
- dataset, review, correction, and rule-catalog immutability.

An assertion that is already GREEN because earlier code covers it must be reported as coverage confirmation, not fabricated RED.

## Truth boundary

- These outputs are deterministic phrase matches and human corrections, not confirmed pain points.
- Counts and fractions describe only actual review records in the active local sample.
- Demo records are synthetic and cannot establish a real customer or market pattern.
- User-uploaded records inherit their own unverified collection and sourcing limitations.
- Positive topic mentions must not become complaint labels merely because they contain related words.
- Product `reviewCount` is not the classification denominator and is never sales.
- Task 5A emits no market prevalence, demand, severity score, opportunity rank, economics, recommendation, or commercial status.
- No rule may be tuned to achieve a desired Demo count.

## Required final verification

Run in this exact order:

```bash
pnpm vitest run src/domain/painPointRules.test.ts src/domain/painPoints.test.ts
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Every command must exit `0`. Do not replace the required build with a different command and describe it as equivalent. If an environment safety restriction blocks an exact command, stop and report its exact output.

Then run:

```bash
git status --short
git diff --name-status
git diff -- \
  src/domain/painPointRules.ts \
  src/domain/painPointRules.test.ts \
  src/domain/painPoints.ts \
  src/domain/painPoints.test.ts
rg -n "localStorage|indexedDB|fetch\(|axios|OpenAI|market share|sales|demand|opportunity|profit|recommend" \
  src/domain/painPointRules.ts \
  src/domain/painPointRules.test.ts \
  src/domain/painPoints.ts \
  src/domain/painPoints.test.ts
```

Expected changed paths before commit, and no others:

```text
A src/domain/painPointRules.test.ts
A src/domain/painPointRules.ts
A src/domain/painPoints.test.ts
A src/domain/painPoints.ts
```

Interpret truth-boundary words in negative assertions or limitation comments accurately; the scan prohibits runtime commercial inference, persistence, network, and AI behavior. If `rg` is unavailable, use `grep -Ein` with the same files and expressions, report the substitution, and do not skip the scan.

## Commit and stopping point

After every gate passes:

```bash
git add \
  src/domain/painPointRules.ts \
  src/domain/painPointRules.test.ts \
  src/domain/painPoints.ts \
  src/domain/painPoints.test.ts
git diff --cached --check
git diff --cached --name-status
git commit -m "feat: add traceable pain point evidence"
git status --short --branch
git rev-parse HEAD
```

Create one ordinary commit. Final worktree must be clean.

Stop immediately after the Task 5A commit. Do not amend, push, deploy, create a PR, modify this task sheet, fill human audit fields, or begin Task 5B, Task 5C, Task 6, UI, Context state, persistence, economics, opportunity scoring, or decisions.

## Delivery report

Report:

1. repository root, branch, exact starting HEAD, and clean starting status;
2. all three ancestor-check exit codes;
3. complete required-reading list and any conflict found;
4. exact files created and confirmation that no existing/prohibited file changed;
5. genuine RED output and exit code for catalog, matcher, classifier, and summary groups;
6. which additional assertions were already GREEN and therefore only strengthened coverage;
7. exact focused/full/build/lint/install/diff-check commands, exit codes, file/test counts, and summaries;
8. exact tokenization, original-offset, exclusion, overlap, and source-order behavior;
9. exact correction precedence, blank-reason, no-op, and immutability behavior;
10. exact summary denominator, zero-data, multi-label, product-coverage, and manual-only evidence behavior;
11. truth-boundary scan command/output and any `rg` substitution;
12. final commit SHA/message and final `git status --short --branch`;
13. explicit confirmation that Task 5B, Task 5C, Task 6, UI, Context, audit outcomes, persistence, economics, scoring, AI, backend, scraping, external APIs, push, deployment, and PR creation were not started.
