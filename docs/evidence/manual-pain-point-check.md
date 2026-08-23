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

The complete keyboard-only acceptance was executed in real Chrome at `1440 x 900`; no mouse actions were used. Focus was moved with keyboard focus, activation used `Enter`, checkbox selection used `Space`, and the reason was entered by keyboard. The observed sequence was:

1. **Summary filter:** the `Cleaning difficulty` summary button received visible focus with a solid `3px` primary-color outline. Its initial `aria-pressed` value was `false`; pressing `Enter` changed it to `true`, changed the queue status filter to `All`, and displayed 9 matching review records. The page-level status region had `data-status-sequence="3"` and no message for this filter action.
2. **Review row:** the `r002` review-row button received the same visible focus outline. Pressing `Enter` selected `r002`, changed its row button to `aria-pressed="true"`, and changed the selected evidence panel from `r001` to `r002`.
3. **Checkbox and reason:** the `noise` desired-label checkbox received visible focus with the same outline. Pressing `Space` changed it from unchecked to checked. The dirty draft state then showed the safety message that the correction or reset was required before moving to another review; navigation controls were disabled while the draft was dirty. The `correction-reason` textarea received visible focus with the same outline, and keyboard entry produced the exact reason `Observed during keyboard acceptance`.
4. **Reset:** `Reset draft` received visible focus with the same outline. Pressing `Enter` cleared the checked `noise` draft label and cleared the reason, restored `r002`'s effective labels to the automatic `hard_to_clean` state, removed the dirty-draft navigation lock, and disabled both `Apply correction & next` and `Reset draft`.
5. **Apply:** the `noise` checkbox was selected again with `Space`, the same reason was typed again, and `Apply correction & next` received visible focus with the same outline. Pressing `Enter` applied the current-session correction to `r002`, produced the announcement `Correction applied to r002.` with `data-status-sequence="4"`, changed `r002` to `Corrected`, and changed its effective labels to `hard_to_clean, noise`. Apply also advanced selection to `r003`; the summary changed from 4 to 5 noise reviews and from 4 to 5 covered products.
6. **Next and Previous:** `Next review` received visible focus with the same outline. Pressing `Enter` changed the selected review from `r003` to `r004`. `Previous review` then received visible focus with the same outline; pressing `Enter` changed the selection back from `r004` to `r003`. Both controls were enabled when the queue had an adjacent review.
7. **Corrected queue:** the `Corrected` status-filter button received visible focus with the same outline. Pressing `Enter` set its `aria-pressed` value to `true`, showed exactly one review (`r002`), selected `r002`, and displayed the stored manual addition `noise` plus effective labels `hard_to_clean, noise`.
8. **Clear:** `Clear correction` received visible focus with the same outline. Pressing `Enter` removed the current-session correction, produced the announcement `Correction cleared for r002.` with `data-status-sequence="5"`, returned the summary noise signal from 5 reviews / 5 products to 4 reviews / 4 products, left the `Corrected` queue with 0 reviews, and cleared the selected review so the panel showed `No review selected.`

The visible focus outline was confirmed for the summary filter, review row, checkbox, reason textarea, Reset, Apply, Next, Previous, Corrected, and Clear controls. ARIA state changes were observed for the summary filter, review-row selection, and Corrected queue; the checkbox state change was observed directly. Corrections were observed as current-session state only: they changed the effective-label display and queue state during the session, then Clear removed them.

Chrome reported no `pageerror`, application console error, React warning, or duplicate-key warning during this run. The only console output was Vite connection debug messages and the standard React DevTools informational message. No favicon 404 or other resource 404 was observed in this run; a favicon 404, if encountered in another run, is a browser resource notice rather than an application runtime error.

Any reproduced runtime or CSS defect would require stopping Task 5C and a separate Codex repair scope. No runtime or CSS file is changed by Task 5C.

## Human-audit evidence

No human labels, outcomes, notes, auditor name, or date have been entered. Therefore no correctness rate, false-positive count, missed-label count, or unresolved human-audit baseline is claimed.

**Human audit remains incomplete — awaiting user judgments.**
