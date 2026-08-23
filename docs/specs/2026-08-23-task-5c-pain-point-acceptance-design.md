# Mercata Lens Task 5C: Pain-Point Acceptance Design

**Date:** 2026-08-23  
**Normative parent:** `docs/specs/2026-08-23-remaining-mvp-delivery-design.md`

## Goal

Close Product Task 5 with reproducible audit materials, accurate documentation, and final semantic, keyboard, responsive, and runtime acceptance. Task 5C does not change classification meaning and does not claim the user has completed the human audit.

## Deliverables

- `docs/evidence/review-audit.csv`: exactly 50 deterministically selected Demo reviews with columns `review_id,system_labels,human_labels,outcome,notes,auditor,date`.
- `docs/evidence/review-rule-changelog.md`: ruleset `1.0.0` baseline plus the required structure for future reviewed rule changes.
- `docs/evidence/manual-pain-point-check.md`: sampling method, reproducibility evidence, automated results, browser observations, and an explicit human-audit status.
- README reconciliation for the implemented pain-point workbench and remaining limits.

## Sampling contract

Load the validated Demo dataset through the existing parser, preserve Demo review order, and select the first 50 distinct review IDs. Compute `system_labels` with the approved Task 5A classifier and no corrections. Serialize labels in catalog order using `|`; use an empty value when no automatic label matches.

Only `review_id` and `system_labels` may be populated. `human_labels`, `outcome`, `notes`, `auditor`, and `date` remain empty. Allowed future outcomes are `correct`, `false_positive`, `missed_label`, and `unclear`.

## Acceptance boundary

Automated tests must prove sample count, order, uniqueness, label ordering, header shape, and blank human fields. Browser acceptance covers `/pain-points` at `1440 x 900`, `900 x 900`, and minimal-regression `390 x 844`; keyboard operation of filters, review selection, correction fields, Apply, Reset, Clear, Previous, and Next; visible focus; one semantic table; long-content wrapping; and clean application runtime.

Observed browser evidence, automated evidence, and human-audit evidence are separate sections. The 50-review human-validation gate remains incomplete until the user supplies genuine judgments.

## Change boundary

Task 5C may add evidence documents and acceptance-only tests and update README. It may not change Task 5A rules, classification, correction semantics, dataset contracts, routing, or any Task 6 feature. If acceptance finds a runtime or CSS defect, WorkBuddy stops and reports it; a later Codex repair prompt must authorize exact files.

