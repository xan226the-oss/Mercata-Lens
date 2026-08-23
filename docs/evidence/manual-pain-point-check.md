# Manual pain-point check

## Scope and status

This document is the Task 5C acceptance handoff for the deterministic pain-point workbench. It is not a completed human classification audit.

**Human audit status:** `Incomplete — awaiting user judgments`

The user must personally fill `human_labels`, `outcome`, `notes`, `auditor`, and `date` in [`review-audit.csv`](./review-audit.csv). WorkBuddy and Codex have not supplied those judgments.

## Sampling method and reproducibility

- Source: validated Demo dataset loaded through the existing `importResearchCsv` parser from `public/demo/products.csv` and `public/demo/reviews.csv`.
- Order: preserve `dataset.reviews` source order.
- Sample: first 50 distinct `review_id` values.
- Denominator: 50 audit rows; the active Demo dataset contains 76 review records.
- System labels: `classifyReview(review)` with no corrections, serialized in the approved catalog order and separated by `|`. An empty value means no automatic label matched.
- Ruleset: `PAIN_POINT_RULESET_VERSION = "1.0.0"`.
- Contract test: `src/domain/painPointAudit.test.ts` reads the committed CSV with Papa Parse and verifies headers, row count, uniqueness, Demo order, classifier-derived labels, label order, blank human fields, and Demo fixture immutability.

The artifact is reproducible locally with:

```bash
pnpm vitest run src/domain/painPointAudit.test.ts
```

## Automated evidence

- The initial artifact-contract run was a genuine RED because `docs/evidence/review-audit.csv` did not exist.
- After creating the artifact, the focused contract passed: 1 test file, 2 tests, 2 passed.
- The contract verifies exactly 50 distinct rows and leaves every human-audit field blank.
- The full Task 5C verification commands and their actual results are recorded in the delivery report accompanying this commit.

Automated classifier output is system evidence only. It is not a human outcome, accuracy result, market fact, demand signal, or prevalence estimate.

## Observed browser evidence

Real Chrome acceptance was run against the local Vite server at `/pain-points` with the following exact viewport sizes:

| Viewport | `scrollWidth` / `clientWidth` | Semantic tables | Workbench regions | Runtime errors/warnings |
| --- | ---: | ---: | --- | --- |
| `1440 x 900` | `1425 / 1425` | 1 | summary, queue, editor present | 0 / 0 |
| `900 x 900` | `885 / 885` | 1 | summary, queue, editor present | 0 / 0 |
| `390 x 844` | `375 / 375` | 1 | summary, queue, editor present | 0 / 0 |

The page had no horizontal overflow at any tested viewport. The same single review table DOM was retained and the summary, review queue, and evidence/editor regions were present. Long review evidence and identifiers were allowed to wrap through the existing `overflow-wrap` and narrow-table reflow styles.

Keyboard checks confirmed that the Cleaning difficulty summary button received focus, `Enter` activated the filter and switched the status filter to `All`, and the correction reason textarea was reachable with the stable field ID `correction-reason`. The Apply control remained disabled until the desired labels differed from the automatic labels, which is the required unchanged-state guard. Reset, Clear, Previous, and Next controls were inspected in the rendered page and retain their disabled/enabled state contracts based on draft dirtiness and queue adjacency.

Chrome reported no application `pageerror`, console error, console warning, React warning, or duplicate-key warning during the three viewport loads and keyboard interaction.

Any reproduced runtime or CSS defect would require stopping Task 5C and a separate Codex repair scope. No runtime or CSS file is changed by Task 5C.

## Human-audit evidence

No human labels, outcomes, notes, auditor name, or date have been entered. Therefore no correctness rate, false-positive count, missed-label count, or unresolved human-audit baseline is claimed.

**Human audit remains incomplete — awaiting user judgments.**
