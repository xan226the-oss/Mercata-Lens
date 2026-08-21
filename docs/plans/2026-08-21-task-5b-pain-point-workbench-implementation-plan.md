# Task 5B Pain-Point Evidence Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop-first pain-point evidence workbench that exposes every active review, keeps deterministic Task 5A evidence traceable, and stores reasoned human corrections only for the current browser session.

**Architecture:** `ResearchContext` owns only the correction record and its reset lifecycle. `PainPointsPage` derives classifications and seven summaries from the active dataset and corrections, then coordinates three focused presentational components: a summary filter, one semantic review queue, and a selected-review evidence/correction panel. Task 5A remains the sole classification and aggregation source of truth.

**Tech Stack:** React 19, TypeScript 5, React Router 7, Vitest 3, Testing Library, native HTML table/form controls; no new dependency.

## Global Constraints

- Approved base behavior is Task 5A commit `c58694e149669c828a2a02cc438a41f5d673056a` and the Task 5B design commit `ca5f2d03f1c8ab7223a9809b8aea137ff4834191`.
- The first-release product scope remains US Cat Water Fountain research only.
- Outputs are deterministic phrase signals and user-authored corrections, not confirmed pain points, demand, prevalence, severity, sales, or commercial opportunities.
- Use the exact Task 5A `PainPointCorrection`, `PainPointCorrections`, `ReviewClassification`, `PainPointSummary`, `classifyReview`, and `summarizePainPoints` contracts; do not duplicate or change them.
- Corrections live only in `ResearchContext` memory. Do not add localStorage, IndexedDB, URL persistence, files, cache, backend, login, network writes, or export/recovery behavior.
- Successful dataset replacement clears corrections; failed CSV import preserves the active dataset and corrections; starting Demo reload clears corrections even when the later load fails.
- Keep the existing minimum of 10 valid linked reviews and all route locks unchanged.
- Desktop review throughput is the priority. Narrow widths receive only regression safety and one-DOM reflow; do not create a second mobile review list.
- Do not modify Task 5A domain files, any other existing domain or data file, fixtures, Demo CSV, routes, shell, Home, Category, Quality, README, evidence/audit documents, dependencies, or lockfile.
- Do not begin Task 5C, the 50-review human audit, Task 6 economics, opportunity scoring, decisions, AI, scraping, external APIs, backend services, deployment, or a PR.
- The project requires one ordinary Task 5B implementation commit. Do not create intermediate commits, amend, push, deploy, or create a PR.

---

## File structure

**Create:**

- `src/components/PainPointSummaryList.tsx` — seven-row summary/filter control only.
- `src/components/PainPointSummaryList.test.tsx` — summary semantics, formatting, and activation tests.
- `src/components/ReviewQueue.tsx` — status filters and the single semantic review table.
- `src/components/ReviewQueue.test.tsx` — queue filtering, ordering, selection, and empty-state tests.
- `src/components/ReviewCorrectionPanel.tsx` — selected-review provenance, match evidence, and desired-label editor.
- `src/components/ReviewCorrectionPanel.test.tsx` — evidence, correction derivation, validation, and dirty-state tests.
- `src/pages/PainPointsPage.test.tsx` — real-provider Task 5B integration tests.
- `src/research/ResearchContext.test.tsx` — focused correction lifecycle tests.

**Modify:**

- `src/research/ResearchContext.tsx` — current-session correction state and actions.
- `src/pages/PainPointsPage.tsx` — page orchestration and derived state.
- `src/app/styles.css` — scoped desktop-first workbench styles and narrow-width safety.

No other file may change.

## Task 1: Add current-session correction state to ResearchContext

**Files:**

- Create: `src/research/ResearchContext.test.tsx`
- Modify: `src/research/ResearchContext.tsx`

**Interfaces:**

- Consumes:

```ts
import type {
  PainPointCorrection,
  PainPointCorrections,
} from "../domain/painPoints";
```

- Produces:

```ts
interface ResearchContextValue {
  corrections: PainPointCorrections;
  applyReviewCorrection: (
    reviewId: string,
    correction: PainPointCorrection,
  ) => boolean;
  clearReviewCorrection: (reviewId: string) => void;
}
```

- [ ] **Step 1: Write a failing Context probe test**

Create a probe component that exposes Context values and invokes actions through buttons. Stub Demo fetch with the real `public/demo` CSV text, following `ResearchLayout.test.tsx`.

The test sequence must assert:

```tsx
expect(screen.getByTestId("correction-count")).toHaveTextContent("0");
await userEvent.click(screen.getByRole("button", { name: "Apply valid correction" }));
expect(screen.getByTestId("apply-result")).toHaveTextContent("true");
expect(screen.getByTestId("stored-reason")).toHaveTextContent("  Reviewed against source  ");

await userEvent.click(screen.getByRole("button", { name: "Apply blank correction" }));
expect(screen.getByTestId("apply-result")).toHaveTextContent("false");
await userEvent.click(screen.getByRole("button", { name: "Apply unknown review correction" }));
expect(screen.getByTestId("apply-result")).toHaveTextContent("false");
expect(screen.getByTestId("correction-count")).toHaveTextContent("1");
```

Add separate tests for:

```tsx
// Clear removes only the named entry and clearing a missing ID is a no-op.
expect(screen.getByTestId("correction-count")).toHaveTextContent("0");

// A successful valid CSV import clears corrections.
await waitFor(() => expect(screen.getByTestId("source-kind")).toHaveTextContent("user_upload"));
expect(screen.getByTestId("correction-count")).toHaveTextContent("0");

// A rejected import preserves Demo data, source kind, and the correction.
expect(screen.getByTestId("source-kind")).toHaveTextContent("demo");
expect(screen.getByTestId("correction-count")).toHaveTextContent("1");

// Starting loadDemo clears before a deliberately rejected fetch settles.
await userEvent.click(screen.getByRole("button", { name: "Reload failing demo" }));
expect(screen.getByTestId("correction-count")).toHaveTextContent("0");
await waitFor(() => expect(screen.getByTestId("research-status")).toHaveTextContent("error"));
```

Use a real review ID read from the settled dataset rather than hard-coding an ID that is not present. Do not assert persistence across provider remounts; remount must start empty.

- [ ] **Step 2: Run the Context test and record genuine RED**

Run:

```bash
pnpm vitest run src/research/ResearchContext.test.tsx
```

Expected: FAIL because `ResearchContextValue` does not expose correction state or actions. Preserve the real output and exit code.

- [ ] **Step 3: Implement the minimal Context contract**

Add state:

```ts
const [corrections, setCorrections] = useState<PainPointCorrections>({});
```

Implement action semantics without mutating input arrays:

```ts
const applyReviewCorrection = useCallback(
  (reviewId: string, correction: PainPointCorrection): boolean => {
    if (!dataset?.reviews.some((review) => review.reviewId === reviewId)) return false;
    if (correction.reason.trim() === "") return false;
    setCorrections((current) => ({
      ...current,
      [reviewId]: {
        add: [...correction.add],
        remove: [...correction.remove],
        reason: correction.reason,
      },
    }));
    return true;
  },
  [dataset],
);

const clearReviewCorrection = useCallback((reviewId: string) => {
  setCorrections((current) => {
    if (!(reviewId in current)) return current;
    const next = { ...current };
    delete next[reviewId];
    return next;
  });
}, []);
```

Import `useCallback`. Call `setCorrections({})` synchronously at the beginning of `loadDemo`, and in the successful import branch immediately before activating the accepted dataset. Do not clear corrections in the failed import branch.

Expose the state/actions through the memoized Context value and include them in dependencies.

- [ ] **Step 4: Run the Context test and obtain GREEN**

Run the Step 2 command. Expected: all Context correction lifecycle tests PASS.

## Task 2: Build the three focused workbench components

**Files:**

- Create: `src/components/PainPointSummaryList.tsx`
- Create: `src/components/PainPointSummaryList.test.tsx`
- Create: `src/components/ReviewQueue.tsx`
- Create: `src/components/ReviewQueue.test.tsx`
- Create: `src/components/ReviewCorrectionPanel.tsx`
- Create: `src/components/ReviewCorrectionPanel.test.tsx`

**Interfaces:**

- `PainPointSummaryList` produces:

```ts
export interface PainPointSummaryListProps {
  summaries: PainPointSummary[];
  activeLabel: PainPointId | null;
  disabled: boolean;
  onActivate: (id: PainPointId) => void;
  onClear: () => void;
}
```

- `ReviewQueue` produces:

```ts
export type ReviewQueueStatus =
  | "rule_matched"
  | "corrected"
  | "no_automatic_match"
  | "all";

export interface ReviewQueueRow {
  review: ReviewRecord;
  productTitle: string | null;
  classification: ReviewClassification;
  corrected: boolean;
}

export interface ReviewQueueProps {
  rows: ReviewQueueRow[];
  status: ReviewQueueStatus;
  activeLabel: PainPointId | null;
  selectedReviewId: string | null;
  disabled: boolean;
  onStatusChange: (status: ReviewQueueStatus) => void;
  onSelect: (reviewId: string) => void;
  onShowAll: () => void;
}
```

- `ReviewCorrectionPanel` produces:

```ts
export interface ReviewCorrectionPanelProps {
  row: ReviewQueueRow | null;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onApply: (reviewId: string, correction: PainPointCorrection) => boolean;
  onClear: (reviewId: string) => void;
  onDirtyChange: (dirty: boolean) => void;
}
```

The panel owns only its draft. The page owns filters, selected review, correction records, and post-apply selection.

- [ ] **Step 1: Write failing PainPointSummaryList tests**

Use seven `PainPointSummary` fixtures in `PAIN_POINT_IDS` order, including a zero row and one `reviewFraction: null`. Assert:

```tsx
expect(screen.getAllByRole("button", { name: /reviews/i })).toHaveLength(7);
expect(screen.getByText("0 / 10 reviews")).toBeVisible();
expect(screen.getByText("0%")).toBeVisible();
expect(screen.getByText("Unavailable")).toBeVisible();
expect(screen.getByText("1 products")).toBeVisible();
expect(screen.getAllByText("Ruleset 1.0.0")).toHaveLength(7);
expect(screen.getByRole("button", { name: /Cleaning difficulty/i }))
  .toHaveAttribute("aria-pressed", "true");
```

Verify exact catalog order from the rendered buttons, activation callback, active-row toggle callback, visible `Clear signal filter`, and disabled controls when `disabled` is true.

- [ ] **Step 2: Write failing ReviewQueue tests**

Build four rows in dataset order: automatic-only, corrected automatic, corrected manual-only, and unmatched. Test a pure exported helper:

```ts
export function filterReviewQueueRows(
  rows: readonly ReviewQueueRow[],
  status: ReviewQueueStatus,
  activeLabel: PainPointId | null,
): ReviewQueueRow[];
```

Assert exact status semantics:

```ts
expect(filterReviewQueueRows(rows, "rule_matched", null).map(id)).toEqual(["r1", "r2"]);
expect(filterReviewQueueRows(rows, "corrected", null).map(id)).toEqual(["r2", "r3"]);
expect(filterReviewQueueRows(rows, "no_automatic_match", null).map(id)).toEqual(["r3", "r4"]);
expect(filterReviewQueueRows(rows, "all", "noise").map(id)).toEqual(["r2", "r3"]);
```

Render the component and assert exactly one `<table>`, dataset order, four pressed-state filter buttons, `Corrected` display priority, full effective-label text, selected review button `aria-pressed`, disabled controls, and the exact empty state plus Show all callback.

- [ ] **Step 3: Write failing ReviewCorrectionPanel tests**

Use real `classifyReview` outputs plus explicit review fixtures. Cover:

```tsx
expect(screen.getByText(review.reviewText)).toBeVisible();
expect(screen.getByText(review.reviewId)).toBeVisible();
expect(screen.getByText(/Recorded rating: 2/)).toBeVisible();
expect(screen.getByRole("link", { name: "Open supplied source URL" }))
  .toHaveAttribute("href", review.sourceUrl);
expect(screen.getByText(match.sourceText)).toBeVisible();
expect(screen.getByText(match.includePhrase)).toBeVisible();
expect(screen.getByText(`${match.start}–${match.end} (end exclusive)`)).toBeVisible();
```

Also assert missing product title/date/verified purchase copy, the external-source non-verification statement, `No automatic phrase match.`, and distinct Automatic/Manually added/Manually removed/Effective groups with `None` for empty groups.

For the form, assert one fieldset with seven checkboxes in catalog order. Toggle checkboxes to prove the submitted correction is derived as:

```ts
const add = PAIN_POINT_IDS.filter(
  (id) => selected.has(id) && !automaticLabels.includes(id),
);
const remove = PAIN_POINT_IDS.filter(
  (id) => !selected.has(id) && automaticLabels.includes(id),
);
```

Test removing all automatic labels, blank-reason inline error association, original untrimmed reason passed to `onApply`, unchanged-state disabled button, successful status announcement, rejected apply retaining the draft, Reset draft, Clear correction visibility/callback, and `onDirtyChange(true/false)` transitions. Also render `Previous review` and `Next review` buttons: each calls its callback when an adjacent row exists, respects `hasPrevious`/`hasNext`, and becomes disabled while the panel draft is dirty.

- [ ] **Step 4: Run all three component test files and record genuine RED**

Run:

```bash
pnpm vitest run \
  src/components/PainPointSummaryList.test.tsx \
  src/components/ReviewQueue.test.tsx \
  src/components/ReviewCorrectionPanel.test.tsx
```

Expected: FAIL because all three component modules are missing. Preserve the real failure and exit code.

- [ ] **Step 5: Implement PainPointSummaryList**

Use one section and one ordered list. Format fractions only for display:

```ts
const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});
```

Every row is a button with `aria-pressed={activeLabel === summary.id}` and disabled state. Clicking the active row calls `onClear`; clicking another calls `onActivate(summary.id)`. Keep all seven rows, including zero rows. Never sort, hide, or rank them.

- [ ] **Step 6: Implement ReviewQueue and its pure filter helper**

Filter without sorting:

```ts
const statusMatches = (row: ReviewQueueRow) => {
  if (status === "all") return true;
  if (status === "rule_matched") return row.classification.automaticLabels.length > 0;
  if (status === "corrected") return row.corrected;
  return row.classification.automaticLabels.length === 0;
};
return rows.filter((row) =>
  statusMatches(row) &&
  (activeLabel === null || row.classification.effectiveLabels.includes(activeLabel)),
);
```

Render four filter buttons, an empty state, or one semantic table. Use `data-label` on every `<td>` for narrow CSS reflow. Display state priority `Corrected`, then `Automatic match`, then `No automatic match`. Use the Review ID as a selection button with `aria-pressed`. Do not render a duplicate card list.

- [ ] **Step 7: Implement ReviewCorrectionPanel**

Initialize selected IDs and reason from `row.classification.effectiveLabels` and `row.classification.correction?.reason ?? ""` whenever `row.review.reviewId` or its classification correction/effective labels change.

Dirty state is exact set equality plus exact reason equality. Report dirty changes through `onDirtyChange` in an effect.

Render raw review/provenance and automatic matches without rewriting source content. The source link must use:

```tsx
<a href={row.review.sourceUrl} target="_blank" rel="noreferrer">
  Open supplied source URL
</a>
```

The Apply button is disabled when the draft is blank, equals automatic labels, equals current effective labels with unchanged reason, or no row exists. On click, validate blank reason, derive catalog-ordered `add`/`remove`, and call `onApply`. If it returns `false`, show `The correction could not be applied to the active dataset.` and keep the draft. If true, announce success through `role="status"`.

`Reset draft` restores the current effective labels/reason. `Clear correction` appears only for `correctionValidity === "applied"`, calls `onClear`, and announces the result. Do not fabricate an automatic match for manual-only evidence.

Render `Previous review` and `Next review` controls. Disable each when its adjacency flag is false and disable both whenever the panel draft is dirty. These controls only invoke the supplied callbacks; the page remains responsible for selection.

- [ ] **Step 8: Run component tests and obtain GREEN**

Run the Step 4 command. Expected: all three component files PASS.

## Task 3: Integrate the workbench into PainPointsPage

**Files:**

- Create: `src/pages/PainPointsPage.test.tsx`
- Modify: `src/pages/PainPointsPage.tsx`

**Interfaces:**

- Consumes all interfaces from Tasks 1 and 2 plus:

```ts
const summaries = summarizePainPoints(dataset, corrections);
const classifications = dataset.reviews.map((review) =>
  classifyReview(review, corrections),
);
```

- Produces no new shared domain or Context interface.

- [ ] **Step 1: Write failing real-provider integration tests**

Follow the existing `CategoryPage.test.tsx` pattern: real `ResearchProvider`, `MemoryRouter`, `ResearchLayout`, real local Demo CSV reads, and controlled valid/invalid CSV fixtures.

For settled Demo data assert:

```tsx
expect(screen.getByRole("heading", { name: "Customer pain-point evidence" })).toBeVisible();
expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo");
expect(screen.getByText(/76 review records/i)).toBeVisible();
expect(screen.getByText(/Ruleset 1.0.0/i)).toBeVisible();
expect(screen.getAllByRole("button", { name: /reviews/i })).toHaveLength(7);
expect(screen.getByRole("button", { name: "Rule-matched" }))
  .toHaveAttribute("aria-pressed", "true");
expect(screen.getByText(/actual review records/i)).toBeVisible();
```

Use UI interactions to cover:

1. activating a summary switches status to All and filters by effective label;
2. applying a correction updates its summary count and visible labels;
3. removing an automatic label keeps the review under Corrected;
4. adding a label to an unmatched review makes manual-only evidence visible without phrase/offset claims;
5. Apply & next selects the recorded next row, or the deterministic fallback when filtering removes the current row;
6. a failed CSV import preserves the correction and summary;
7. a successful import resets corrections and displays only new review evidence;
8. rendering `PainPointsPage` under a minimal mock provider with no dataset shows `No active review evidence is available.`;
9. page text does not claim market prevalence, sales, demand, severity, opportunity ranking, recommendation, AI classification, or source verification.

Use a valid upload with at least 3 products and at least 10 linked reviews so `/pain-points` remains available. Include automatic-match, multi-label, and no-match review text in that fixture. The failed import must be genuinely rejected by the existing parser without replacing current data.

- [ ] **Step 2: Run the page test and record genuine RED**

Run:

```bash
pnpm vitest run src/pages/PainPointsPage.test.tsx
```

Expected: FAIL because `PainPointsPage` is still a placeholder and does not render the workbench.

- [ ] **Step 3: Implement page-local derived state**

Create page state:

```ts
const [statusFilter, setStatusFilter] = useState<ReviewQueueStatus>("rule_matched");
const [labelFilter, setLabelFilter] = useState<PainPointId | null>(null);
const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
const [draftDirty, setDraftDirty] = useState(false);
```

Memoize summaries, classifications, product-title lookup, all rows, and the filtered queue. A row is `corrected` only when its review ID has a correction whose trimmed reason is non-empty and `classification.correctionValidity === "applied"`.

When the dataset object changes, reset status to `rule_matched`, clear the label filter, clear draft status, and select the first row in the recalculated default queue or `null`.

Do not store filtered rows, classifications, summaries, or selection in Context.

- [ ] **Step 4: Implement deterministic page coordination**

Summary activation sets the label and status `all`, then selects the first filtered review. Clicking the active summary clears only the label and selects the first row under the remaining status.

Status changes keep the selected review only when it remains in the newly filtered queue; otherwise select that queue's first row or `null`. `Show all reviews` clears the label, sets status to `all`, and selects the first dataset review when present. Previous/Next select the adjacent row in the current filtered queue and do nothing at its bounds.

While `draftDirty` is true, pass `disabled` to summary/queue controls and show:

```text
Apply the correction or reset this draft before moving to another review.
```

For Apply & next, record current index plus adjacent IDs before calling Context. After success and recalculation, choose in this exact order: old next ID, old prior ID, corrected review ID, row at old index, final row, or `null`.

For Clear, record old index; after clearing select the same review if present, otherwise the row at old index, then the new final row, or `null`.

Use an effect only to reconcile selection after correction-derived queue changes; guard it with the pending selection instruction so ordinary renders do not unexpectedly move the user.

- [ ] **Step 5: Render the approved page hierarchy and copy**

Use `PageHeader` and `DataSourceBadge`. Render metadata for category, actual review count, ruleset version, and source kind. Then render:

```tsx
<div className="pain-point-workbench">
  <PainPointSummaryList ... />
  <ReviewQueue ... />
  <ReviewCorrectionPanel ... />
</div>
```

Pass `hasPrevious`, `hasNext`, and exact adjacent-selection callbacks from the current filtered queue into `ReviewCorrectionPanel`.

Place a visible method/boundary section before the workbench. Copy must explicitly state phrase normalization limits, non-additive labels, actual review-record denominator, source limitations, and that signals do not establish sales, demand, wider-market prevalence, severity, or opportunity.

When dataset/source is absent, render only the page heading and `No active review evidence is available.` without running analysis on invented data.

- [ ] **Step 6: Run page and component/Context tests and obtain GREEN**

Run:

```bash
pnpm vitest run \
  src/research/ResearchContext.test.tsx \
  src/components/PainPointSummaryList.test.tsx \
  src/components/ReviewQueue.test.tsx \
  src/components/ReviewCorrectionPanel.test.tsx \
  src/pages/PainPointsPage.test.tsx
```

Expected: all five files PASS.

## Task 4: Add scoped layout, run regression gates, and create one commit

**Files:**

- Modify: `src/app/styles.css`
- Verify all Task 5B allowed files.

**Interfaces:**

- Consumes existing Light Slate variables and the class names created in Tasks 2–3.
- Produces no TypeScript interface.

- [ ] **Step 1: Add desktop-first scoped CSS**

Add only `.pain-point-*`, `.review-queue*`, and `.review-correction*` selectors. At wide desktop widths use:

```css
.pain-point-workbench {
  display: grid;
  grid-template-columns: minmax(210px, 230px) minmax(340px, 390px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
```

Use existing colors, borders, radii, typography, button, and focus tokens. Long IDs, URLs, source text, and reasons use `overflow-wrap: anywhere` where needed.

At an intermediate breakpoint where the workspace cannot hold three readable columns, place summary and queue in the first grid row and the editor full-width below. At `900px` and below, use one column.

At narrow widths, reflow the same queue table rows with `data-label` using the existing IssueTable approach. Keep one `<table>` DOM. Guarantee no horizontal page overflow, no clipped controls, and operable actions; do not optimize mobile throughput or add a second mobile layout.

- [ ] **Step 2: Run the focused Task 5B suite**

Run:

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

Expected: all listed files PASS. Record actual file and test counts; do not predict or invent them.

- [ ] **Step 3: Run the complete quality gate in exact order**

Run:

```bash
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Every command must exit `0`. The build command is exact and may not be replaced with another command described as equivalent. If Vite's ignored `dist` cleanup is blocked by the environment, stop and report the original output; do not delete or bypass without user approval.

- [ ] **Step 4: Inspect scope and forbidden capabilities**

Run:

```bash
git status --short
git diff --name-status
git diff --check
rg -n "localStorage|indexedDB|fetch\\(|axios|OpenAI|market share|sales prediction|high demand|opportunity score|profit|recommend" \
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

Only the 11 allowed paths may appear. Interpret limitation copy and negative test assertions accurately; the scan prohibits runtime persistence, network, AI, and commercial inference behavior. If `rg` is unavailable, use `grep -Ein` with the same expression/files and report the substitution.

- [ ] **Step 5: Perform the real-browser desktop smoke check**

Start the existing Vite app and use a real Chrome viewport of `1440 x 900`. Verify and report factual observations:

- `/pain-points` renders the summary, queue, and editor as a readable three-part hierarchy;
- the page has no horizontal overflow (`scrollWidth <= clientWidth`);
- selecting a summary filters the queue;
- selecting a review exposes its full evidence/provenance;
- one valid correction can be applied, updates the visible effective labels/summary, and advances deterministically;
- Clear correction restores automatic state;
- no React duplicate-key warning or application runtime error/warning occurs.

Stop Vite and verify its port is released. Do not claim complete `900 x 900`, `390 x 844`, keyboard, or human-audit acceptance; those belong to Task 5C.

- [ ] **Step 6: Create the single Task 5B commit**

Stage only:

```bash
git add \
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
git diff --cached --check
git diff --cached --name-status
git commit -m "feat: add pain point evidence workbench"
git status --short --branch
git rev-parse HEAD
```

Expected before commit: exactly eight added files and three modified files. Expected after commit: clean `main` worktree and one new ordinary commit.

## Self-review checklist

- [ ] Every Task 5B design section maps to a Context, component, page, CSS, test, or browser step above.
- [ ] Public property names and Task 5A types are unchanged across all tasks.
- [ ] Status filters use automatic labels for Rule-matched/No automatic match and stored valid corrections for Corrected.
- [ ] Summary filters use effective labels and preserve dataset review order.
- [ ] All reviews remain reachable through All, including unmatched reviews.
- [ ] Desired labels derive stable catalog-ordered `add` and `remove`; reason validation preserves original text.
- [ ] Dirty drafts cannot be silently discarded.
- [ ] Apply/Clear selection fallback is deterministic after queue recalculation.
- [ ] Failed import preserves corrections; successful replacement and Demo reload clear them.
- [ ] One semantic table DOM remains at every width.
- [ ] No plan step modifies Task 5A, quality gates, routing, other pages, README, audit evidence, dependencies, or lockfile.
- [ ] No Task 5C, Task 6, AI, persistence, backend, scraping, API, commercial inference, push, deployment, or PR work is included.
