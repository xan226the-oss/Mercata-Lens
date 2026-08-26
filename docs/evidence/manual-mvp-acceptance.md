# Task 8B — Manual MVP acceptance record

**Status:** Automated, browser-observed, and human-incomplete evidence are separated below. This record describes the completed acceptance flow only where the automated evidence exercises the behavior.

## Automated evidence

- Task 8B focused tests cover Context condition normalization/lifecycle, defensive copies, DecisionStatus, ValidationPlan, DecisionPage, and export behavior: 5 files, 15 tests; the added export side-effect test brings the focused export coverage to 3 export tests.
- Full Vitest suite passes with no skipped core tests: 35 files, 284 tests.
- TypeScript compilation pass: `tsc --noEmit` completed successfully before the dependency-directory guard interrupted later pnpm commands.
- Export tests cover schema version, provenance, ruleset, corrections, economics scenarios, weights, conditions, report, limitations, deterministic serialization, deep defensive copies, and browser download side effects.
- Playwright uses one project and executes 3 tests: one complete Demo test that iterates through 1440×900, 900×900, and 390×844 sequentially, plus two invalid-CSV tests.
- Invalid CSV Playwright coverage includes exact file/row/field/reason diagnostics, active Demo preservation, and a separate no-active-data locked-route scenario.
- Console errors, page errors, React warnings, duplicate-key warnings, and resource failures fail the browser tests. Only an exact `/favicon.ico` request is tracked separately.

## Browser-observed evidence

- The active source remains visibly labelled `Demo data` during the complete Demo flow.
- `review_count` is displayed as review evidence, not sales.
- Pain-point correction is performed through the real review queue, non-blank reason field, and Apply action; the corrected state is then visible.
- Base economics is filled through the real editor and the calculated result is visible as an assumption-bound contribution, not realized profit.
- Weight edits affect the current comparison and Restore defaults restores the visible default values and ranking state.
- Decision conditions are entered through the page, including blank-line trimming, and only an explicitly checked exact stop condition produces Pause.
- Review, economics, assumption, and opposition evidence references resolve in the selected evidence region.
- Print mode retains source/status/limitations and hides the JSON interaction controls.
- Keyboard focus reaches the JSON download control and the minimum viewport has no horizontal overflow.
- The downloaded JSON is parsed from the actual downloaded file and includes the required top-level schema, provenance, ruleset, corrections, scenarios, weights, conditions, report, and limitations fields without React or browser-internal keys.

## Human-incomplete evidence

The following remain incomplete and must not be represented as completed validation:

- 50-review human audit and classification accuracy baseline;
- user-authored weight sensitivity answers;
- user-authored continue/pause/stop threshold exercise and hindsight-bias reflection;
- external research, market validation, target-user sessions, business review, or production use;
- realized economics, persistence, recovery, deployment, or live data verification.

## Excluded claims

This local MVP does not claim sales, demand, popularity, market share, sourcing feasibility, recommended price, profitability, launch readiness, inventory advice, or commercial success.
