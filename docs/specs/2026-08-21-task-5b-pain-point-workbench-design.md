# Mercata Lens Task 5B: Pain-Point Evidence Workbench Design

- Date: 2026-08-21
- Approved base HEAD: `c58694e149669c828a2a02cc438a41f5d673056a`
- Product task: Task 5, Rule-Based Pain-Point Evidence and Human Corrections
- This document covers: Task 5B evidence page and current-session correction interaction only

## 1. Goal

Turn the approved Task 5A domain results into a desktop-first research workbench where the user can inspect every rule match, find reviews with no automatic match, and apply one reasoned correction per review with minimal repeated work.

The workbench is a review-triage interface. It presents **rule-matched review signals** and **pain-point evidence**, not confirmed customer needs, market prevalence, demand, sales, severity, product recommendations, or commercial opportunities.

## 2. Approved interaction direction

Task 5B uses a desktop master-detail workbench rather than nesting duplicate review cards under each signal:

1. a stable seven-row signal summary filters the evidence;
2. a compact review queue keeps all actual review records reachable;
3. one persistent detail/editor panel lets the user inspect and correct the selected review;
4. applying a correction advances to the next review in the current queue.

The user edits the **desired effective labels** once. The interface derives `add` and `remove` arrays relative to the review's automatic labels. One non-blank reason covers the complete review correction, matching the Task 5A domain contract.

No bulk editing, AI suggestion, generated reason, automatic correction, search engine, pagination system, or dedicated mobile workflow is added.

## 3. Scope and allowed files

Task 5B may create:

- `src/components/PainPointSummaryList.tsx`;
- `src/components/PainPointSummaryList.test.tsx`;
- `src/components/ReviewQueue.tsx`;
- `src/components/ReviewQueue.test.tsx`;
- `src/components/ReviewCorrectionPanel.tsx`;
- `src/components/ReviewCorrectionPanel.test.tsx`;
- `src/pages/PainPointsPage.test.tsx`;
- `src/research/ResearchContext.test.tsx`.

Task 5B may modify:

- `src/pages/PainPointsPage.tsx`;
- `src/research/ResearchContext.tsx`;
- `src/app/styles.css`.

Task 5B must not modify:

- `src/domain/painPointRules.ts`, `src/domain/painPoints.ts`, or their tests;
- any other existing domain module or type;
- CSV schemas, import parsing, Demo fixtures, quality thresholds, routes, shell locking, Home, Category, or Quality behavior;
- README or evidence/audit documents;
- dependencies or the lockfile.

It must not start Task 5C, the 50-review human audit, Task 6 economics, opportunity scoring, decisions, persistence, export/recovery, AI, scraping, external APIs, backend services, login, analytics, deployment, or a PR.

If implementation requires a file outside this list, WorkBuddy stops before editing and requests scope review.

## 4. ResearchContext contract

`ResearchContext` becomes the sole owner of current-session corrections. Import the approved `PainPointCorrection` and `PainPointCorrections` types from `src/domain/painPoints.ts`; do not duplicate their shape.

Extend `ResearchContextValue` with:

```ts
corrections: PainPointCorrections;
applyReviewCorrection: (
  reviewId: string,
  correction: PainPointCorrection,
) => boolean;
clearReviewCorrection: (reviewId: string) => void;
```

`applyReviewCorrection` returns `true` only when:

- the current dataset contains the exact `reviewId`;
- `correction.reason.trim()` is non-empty.

On success it stores copied `add` and `remove` arrays plus the original, untrimmed reason. On failure it returns `false` without changing state. This protects Context consumers from creating a dangling or blank-reason correction while preserving the Task 5A defensive domain behavior.

`clearReviewCorrection` removes only the specified review entry. Clearing a missing entry is a safe no-op.

### 4.1 Reset behavior

- Initial Context state has `{}` corrections.
- `loadDemo()` clears corrections when it begins, at the same time the current dataset is removed. If Demo loading later fails, old corrections are not restored.
- A successful CSV import clears all corrections before the new dataset becomes active.
- A failed CSV import preserves the active dataset, source kind, quality report, and corrections.
- Application reload recreates the provider and clears corrections.

Corrections never enter localStorage, IndexedDB, URL state, a file, a backend, a cache, or the `ResearchDataset` object. This is session state, not persistence.

## 5. Derived page data

`PainPointsPage` consumes `dataset`, `sourceKind`, `corrections`, and the two correction actions from `useResearch()`.

It derives, using `useMemo` where appropriate:

- seven summaries from `summarizePainPoints(dataset, corrections)`;
- one `ReviewClassification` per dataset review from `classifyReview(review, corrections)`;
- a product-title lookup from current dataset products for display only;
- the filtered queue from page-local status and label filters.

The Context does not store summaries, classifications, percentages, selected reviews, filters, or draft forms. Task 5A remains the only classification and aggregation source of truth.

When the active dataset object changes, page-local state resets to:

- status filter `rule_matched`;
- no label filter;
- first review in the resulting queue, or no selection if that queue is empty;
- no dirty correction draft;
- no previous save-status message.

## 6. Page header and factual boundary

Use the existing `PageHeader` and `DataSourceBadge` components.

The header uses:

- eyebrow: `Rule-matched review evidence`;
- title: `Customer pain-point evidence`;
- description: `Deterministic review signals for the active US cat water fountain sample.`;
- metadata: dataset category, actual review-record count, ruleset `1.0.0`, and source badge.

A visible method/boundary block states:

- matching uses explicit English phrases with case/punctuation/whitespace normalization only;
- one review can carry more than one label, so rows are not additive;
- the denominator is actual review records in the active dataset, not product `reviewCount`;
- Demo reviews are synthetic, or user-uploaded reviews retain their own sourcing limitations;
- matches do not establish sales, demand, wider-market prevalence, severity, or a business opportunity.

Do not use `Top pain point`, `Most important`, `High demand`, `Low competition`, `Recommended`, or equivalent ranking language.

## 7. PainPointSummaryList

`PainPointSummaryList` receives the seven `PainPointSummary` rows, the active label filter, and an activation callback.

It renders exactly seven rows in Task 5A catalog order, including zero rows. Each row displays:

- English label and Chinese label;
- `matchedReviewCount / reviewDenominator reviews`;
- a presentation-formatted percentage, or `Unavailable` only when `reviewFraction` is `null`;
- `productCount` and the word `products`;
- ruleset version.

Percentages are formatted in the component and are never written back into domain state. A zero count with a non-zero denominator displays `0%`, not unavailable.

Every row is an accessible button with `aria-pressed` reflecting the active label filter. Activating a row:

1. sets the label filter to that pain-point ID;
2. sets the status filter to `all`, so manually added evidence from reviews with no automatic match remains visible;
3. selects the first filtered review.

Activating the already-selected row clears the label filter. A separate `Clear signal filter` action is visible when a label filter is active. A zero-count row may produce an empty queue; the page must show that honestly rather than disabling or hiding the row.

## 8. ReviewQueue

### 8.1 Filters

The status filter has exactly four values:

- `rule_matched` — classifications with at least one automatic label;
- `corrected` — review IDs with a valid stored correction entry;
- `no_automatic_match` — classifications with zero automatic labels, including a review later given a manual label;
- `all` — every review record in dataset order.

Default is `rule_matched`. Filter controls are buttons with `aria-pressed`. Status and label filters combine with logical AND, except selecting a summary row first switches status to `all` as described above.

The queue always preserves original `dataset.reviews` order. It does not sort by rating, number of labels, correction status, or signal count.

### 8.2 Table

Use one semantic `<table>` with one DOM representation. Desktop columns are:

- state;
- review;
- product;
- rating;
- review excerpt;
- effective labels.

The state text is one of `Automatic match`, `Corrected`, or `No automatic match`. A corrected review may also have automatic evidence; `Corrected` takes display priority without erasing its automatic labels.

The Review ID cell contains an accessible selection button. The selected button uses `aria-pressed="true"`; the row also has a visible selected style. The excerpt is derived only by display truncation/CSS and must not replace the full review text in evidence.

At narrow widths, CSS may present the same table rows as stacked cards using data labels, following the existing IssueTable single-DOM pattern. Do not render a second mobile list.

### 8.3 Empty state

When filters return no reviews, show:

- `No reviews match the current filters.`;
- a `Show all reviews` button that clears the label filter, sets status to `all`, and selects the first dataset review when present.

Do not change the underlying corrections or summaries.

## 9. ReviewCorrectionPanel

### 9.1 Evidence view

For the selected review show:

- full original `reviewText` exactly as supplied; the configured rules match explicit English phrases, but the interface must not relabel an arbitrary user upload as verified English text;
- review ID and product ID;
- product title from the active dataset, or `Product title unavailable` without inventing a title;
- numeric rating labelled as the review's recorded rating, not severity;
- review date as recorded, or `Not provided`;
- verified purchase as `Yes`, `No`, or `Not provided`;
- an anchor to the supplied source URL labelled `Open supplied source URL`.

The link uses the record URL and safe external-link attributes. The interface states that Mercata Lens has not fetched or independently verified the destination.

For every automatic match show:

- exact `sourceText`;
- configured `includePhrase`;
- `ruleId`;
- `start–end` offsets with end described as exclusive;
- ruleset version.

When there are no automatic matches, state `No automatic phrase match.` Manual-only evidence never receives a fabricated phrase, rule, or offset.

Current classification displays separate labelled groups:

- `Automatic labels`;
- `Manually added`;
- `Manually removed`;
- `Effective labels`.

Empty groups display `None`. Removed automatic labels remain visible here and the review remains discoverable under `Corrected`.

### 9.2 Desired-label editor

Render one `fieldset` with legend `Desired effective labels` and seven labelled checkboxes in catalog order.

On selection, the draft initializes from `classification.effectiveLabels`. The reason initializes from the current correction reason, or empty text when none exists.

On submit derive:

```ts
add = selected labels not present in automaticLabels
remove = automaticLabels not present in selected labels
```

Both arrays follow catalog order. It is valid to select no labels and thereby remove every automatic label.

The reason uses a labelled textarea. Validation uses `reason.trim()` but stores the original input. Show an inline error associated with the textarea when the reason is blank.

The primary action is `Apply correction & next`. It is disabled when:

- the reason is blank;
- the desired effective labels equal `automaticLabels`, regardless of reason, because this state requires no new correction or should be restored through `Clear correction`;
- the desired effective labels equal the current effective labels and the reason is unchanged;
- there is no selected review.

For a review without a stored correction, a desired label set equal to the automatic set is not a correction and cannot be saved. For an existing correction, restoring the automatic set uses `Clear correction` instead of storing empty add/remove arrays.

### 9.3 Apply, advance, clear, and dirty state

Before applying, record the selected review's index and the adjacent review IDs in the current filtered queue. On successful `applyReviewCorrection`:

1. announce `Correction applied to <reviewId>.` through a `role="status"` region;
2. recalculate summaries and the queue;
3. select the previously recorded next review when it remains in the recalculated queue;
4. otherwise select the previously recorded prior review when it remains;
5. when neither adjacent review remains, keep the corrected review if it is still present;
6. otherwise select the row now occupying the old index, then the new final row, or clear selection when the queue is empty.

If Context rejects the correction, retain the draft and show a non-fabricated error without advancing.

`Clear correction` is shown only when a stored correction exists. It removes the correction, announces the result, recalculates the page, and keeps the same review selected when it remains in the queue. If clearing makes the review disappear from `Corrected` or an effective-label filter, select the row now occupying its old index, then the preceding final row, or clear selection when the queue is empty. It does not require a second reason or confirmation because the automatic evidence is recoverable and the operation is local-session only.

Draft changes are local and do not alter summaries until Apply succeeds. While the draft differs from its initialized values:

- review-row selection, status filters, signal filters, previous/next navigation, and Show all are disabled;
- a visible message says `Apply the correction or reset this draft before moving to another review.`;
- `Reset draft` restores the current effective labels and current correction reason.

No change is silently discarded.

## 10. Layout and styling

Use existing Light Slate tokens, fonts, borders, radii, focus outline, source badge, and page-header patterns. Add no dependency and no decorative chart.

At wide desktop widths, the workbench is a three-column grid within the existing workspace:

- summary: approximately 210–230px;
- review queue: approximately 340–390px;
- evidence/editor: remaining width with a practical minimum.

At intermediate widths where three columns cannot remain readable, use a two-stage layout with summary and queue above a full-width editor. At `900px` and below, use a single-column flow. This can happen before `900px` when the available workspace width requires it; readability takes precedence over preserving three columns.

At `390px`, Task 5B guarantees only baseline regression safety:

- no horizontal page overflow;
- no clipped evidence, IDs, URLs, reasons, or controls;
- a single table DOM reflows or wraps;
- all required actions remain operable.

Task 5B does not optimize review throughput for mobile. Full responsive and keyboard acceptance remains Task 5C.

## 11. Loading, missing, and locked states

The existing `ResearchLayout` remains authoritative for route locking. Task 5B does not change the minimum of 10 valid linked reviews.

If `PainPointsPage` is rendered without an active dataset or source kind in an isolated test, it shows one heading and `No active review evidence is available.` It does not call analysis with invented data.

The normal loading, failed Demo load, and low-sample locked-route states continue to be handled by the existing shell. Task 5B tests must not present a locked page as manually inspected evidence.

## 12. Required tests

### 12.1 ResearchContext

Create a focused Context probe test covering:

- initial empty corrections;
- successful apply and exact stored reason;
- blank reason and unknown review ID return `false` without mutation;
- clear one correction and safe clear of a missing ID;
- successful CSV import clears corrections;
- failed CSV import preserves dataset, source kind, and corrections;
- starting Demo reload clears corrections even if the later fetch fails.

### 12.2 PainPointSummaryList

Cover:

- exact seven-row catalog order including zero rows;
- count/denominator, zero percent, null fraction, product count, and version copy;
- accessible pressed state;
- activation and clearing callbacks.

### 12.3 ReviewQueue

Cover:

- all four status filters and their exact semantics;
- combination with an effective-label filter;
- original dataset order;
- corrected display priority without losing effective-label text;
- selected-review semantics;
- empty state and Show all callback;
- one semantic table DOM.

### 12.4 ReviewCorrectionPanel

Cover:

- full source/provenance fields and missing optional-value copy;
- exact automatic phrase, configured phrase, rule, version, and offsets;
- no-match and manual-only evidence without fabricated spans;
- separate automatic, added, removed, and effective label groups;
- desired-label checkboxes initialize from effective labels;
- correct derived add/remove arrays in catalog order;
- removing all automatic labels;
- required-reason validation and preservation of original reason text;
- unchanged/blank disabled state;
- successful apply callback;
- Reset draft;
- Clear correction visibility and callback;
- dirty-state navigation lock notification;
- accessible fieldset, textarea error association, buttons, and status announcement.

### 12.5 PainPointsPage integration

Using `ResearchProvider`, real Task 5A functions, and controlled local CSV fixtures, cover:

- Demo provenance, actual review denominator, ruleset, method boundary, seven summaries, and default matched queue;
- summary activation filtering by effective label;
- correction changing summary counts and label presentation;
- a removed automatic label remaining discoverable under Corrected;
- adding a label to a no-automatic-match review;
- Apply & next selection behavior;
- failed import preserving corrections and summaries;
- successful import resetting corrections and using new review evidence;
- direct no-data fallback;
- absence of market prevalence, sales, demand, severity, opportunity ranking, recommendation, AI, or verified-source claims.

Use genuine RED → GREEN for new Context and UI behavior. An assertion already satisfied by an approved existing component is reported as coverage confirmation, not fabricated RED.

## 13. Verification and browser boundary

Task 5B requires:

- focused new Context/component/page tests;
- relevant existing layout, quality, import, and Task 5A tests;
- full test suite;
- exact production build;
- TypeScript lint;
- frozen-lockfile installation;
- `git diff --check`;
- strict changed-file and forbidden-capability inspection;
- one ordinary commit and a clean worktree.

Run a real-browser smoke check at `1440 x 900` for Demo data:

- three-part hierarchy is readable;
- summary selection filters the queue;
- selected Review evidence is visible;
- a correction can be applied and cleared;
- no horizontal overflow or application runtime warning appears.

This smoke check is implementation evidence, not the final Task 5 acceptance. Task 5C owns complete keyboard, `900 x 900`, minimal `390 x 844` regression, README, audit handoff, and final visual acceptance.

## 14. Acceptance and stopping point

Task 5B is complete only when:

- every actual review can be reached, including reviews with no automatic match;
- summary counts always come from Task 5A effective labels;
- automatic and human evidence remain visibly distinct;
- correction add/remove arrays are derived correctly from one low-friction desired-label form;
- no invalid or dangling correction enters Context;
- dataset replacement and failed-import behavior follow the approved reset policy;
- the desktop workbench is usable without introducing a second mobile DOM;
- all tests, build, lint, install, diff, scope, and browser-smoke gates pass.

End with one ordinary Task 5B implementation commit and a clean worktree. Do not amend, push, deploy, create a PR, write human audit outcomes, start Task 5C, or begin Task 6.
