# Task 8B — Manual MVP acceptance record

**Status:** Automated and browser-observed evidence is recorded below. Human exercises remain incomplete.

## Automated evidence

- Focused DecisionStatus, ValidationPlan, DecisionPage, export, Context, and upstream regression tests pass.
- Full Vitest suite passes with no skipped core tests.
- TypeScript compilation and lint pass. The standard `pnpm build` reached Vite but the host safe-delete guard blocked emptying the existing ignored `dist/assets` directory; the same production build completed successfully with Vite output redirected to `/tmp/mercata-lens-dist`.
- Frozen install and `git diff --check` pass.
- Export tests cover schema version, provenance, ruleset, corrections, economics scenarios, weights, conditions, report, limitations, deterministic serialization, defensive copies, and absence of browser-internal key strings.
- Playwright specs cover the Demo route path, invalid CSV diagnostics, failed-import preservation, download initiation, console/page-error capture, and 1440×900, 900×900, and 390×844 viewports.

## Browser-observed evidence

- The active source remains visibly labelled `Demo data`.
- `review_count` is displayed as review evidence, not sales.
- Decision status is exposed with a semantic `status` or `alert` region and is not conveyed by color alone.
- Decision conditions are editable as user-authored current-session text.
- Only explicitly checked exact stop conditions are sent to the approved decision domain as triggered conditions.
- Evidence references resolve to review records, named economics scenarios, or assumption explanations in a stable selected-evidence region.
- JSON download is initiated by a user click and uses a deterministic file name.
- The page includes a no-horizontal-overflow assertion at the minimum viewport.

## Human-incomplete evidence

The following are not completed by WorkBuddy and must not be represented as completed validation:

- 50-review human audit and classification accuracy baseline;
- user-authored weight sensitivity answers;
- user-authored continue/pause/stop threshold exercise and hindsight-bias reflection;
- external research, market validation, target-user sessions, business review, or production use;
- realized economics, persistence, recovery, deployment, or live data verification.

## Excluded claims

This local MVP does not claim sales, demand, popularity, market share, sourcing feasibility, recommended price, profitability, launch readiness, inventory advice, or commercial success.
