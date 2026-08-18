# Task 4B Category Overview UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the approved Task 4A category analysis on Category Overview and connect its truthful price and brand metrics to Home without changing analysis or route gating.

**Architecture:** Both pages derive `CategoryAnalysis` from the active `ResearchDataset` with `useMemo`; no derived state is stored in context. Small presentational components render metrics, fixed/sample-relative bands, source provenance, and native disclosure evidence. Existing Light Slate CSS and route locks remain authoritative.

**Tech Stack:** React 19, TypeScript 5, React Router 7, Vitest 3, Testing Library, native HTML `progress` and `details`; no new dependency.

## Global Constraints

- Base implementation is the approved Task 4A HEAD and its `analyzeCategory(dataset)` contract.
- The first-release product scope remains US Cat Water Fountain research only.
- Every number describes the active comparison sample, not the wider market.
- `reviewCount` means displayed review count, never sales, customers, demand, velocity, or market share.
- Brand results are represented sample share, never market share or wider-market concentration.
- Price bands do not establish a recommended price, best launch price, competition, or total-market distribution.
- Do not modify Task 4A domain analysis, CSV processing, quality thresholds, route locks, ResearchContext, Demo data, dependencies, or lockfile.
- Do not add manual-calculation evidence, README changes, final visual acceptance, pain points, economics, opportunity scoring, decisions, AI, scraping, persistence, backend, or external APIs.
- Create one ordinary implementation commit. Do not amend, push, deploy, or create a PR.

---

## File structure

**Create:**

- `src/components/MetricCard.tsx`
- `src/components/MetricCard.test.tsx`
- `src/components/SampleDistribution.tsx`
- `src/components/SampleDistribution.test.tsx`
- `src/components/DataSourceBadge.tsx`
- `src/components/DataSourceBadge.test.tsx`
- `src/components/EvidenceDrawer.tsx`
- `src/components/EvidenceDrawer.test.tsx`
- `src/pages/CategoryPage.test.tsx`

**Modify:**

- `src/pages/CategoryPage.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/HomePage.test.tsx`
- `src/components/MetricStrip.tsx`
- `src/app/routes.test.tsx`
- `src/app/styles.css`

No other file may change.

## Task 1: Build and integrate the complete Category Overview UI

**Consumes:**

```ts
import { analyzeCategory } from "../domain/category";
import type {
  CategoryAnalysis,
  CategoryBand,
} from "../domain/category";
import type { SourceKind } from "../domain/types";
```

**Produces:**

```ts
export interface MetricCardProps {
  id: string;
  label: string;
  value: string | number;
  evidenceNote: string;
  calculationNote?: string;
}

export interface SampleDistributionProps {
  id: string;
  title: string;
  description: string;
  bands: CategoryBand[];
  productCount: number;
  compact?: boolean;
  missingCount?: number;
}

export interface DataSourceBadgeProps {
  sourceKind: SourceKind;
}

export interface EvidenceDrawerProps {
  analysis: CategoryAnalysis;
}
```

- [ ] **Step 1: Write failing tests for the four presentation components**

Create component tests with exact semantic assertions.

`MetricCard.test.tsx` must render:

```tsx
render(
  <MetricCard
    id="median-price"
    label="Median observed price"
    value="$29.50"
    evidenceNote="Derived from 6 products"
    calculationNote="Middle two observed prices averaged"
  />,
);
expect(screen.getByTestId("metric-card-median-price")).toHaveTextContent("$29.50");
expect(screen.getByText("Derived from 6 products")).toBeVisible();
expect(screen.getByText("Middle two observed prices averaged")).toBeVisible();
```

`SampleDistribution.test.tsx` must use four fixed bands including a zero-count band and assert:

```tsx
expect(screen.getByText("Scale: 0 to 6 products in this sample")).toBeVisible();
expect(screen.getAllByRole("progressbar")).toHaveLength(4);
expect(screen.getByRole("progressbar", { name: /4 to below 4.5: 0 of 6 products/i }))
  .toHaveAttribute("value", "0");
expect(screen.getByTestId("distribution-rating_below_3")).toHaveTextContent("2");
```

Also assert band order is unchanged, percentages are formatted from `shareOfProducts`, missing count is visible when supplied, and compact mode retains exact counts and scale.

`DataSourceBadge.test.tsx` must assert `Synthetic demo` plus synthetic-evidence copy for `demo`, and `User upload` plus sourcing-limitation copy for `user_upload`. Assert neither state claims Amazon, live market, or verified market data.

`EvidenceDrawer.test.tsx` must use a real `analyzeCategory` result and assert:

```tsx
expect(screen.getByText("Calculation evidence").closest("summary")).toBeInTheDocument();
expect(screen.getByText("p1")).toBeInTheDocument();
expect(screen.getByText(/Q1:/)).toBeInTheDocument();
expect(screen.getByText(/Excluded products: None/)).toBeInTheDocument();
```

Open the native disclosure with `userEvent.click`. Assert all price/rating/review band IDs, brand groups, and attribute present/missing IDs are in the DOM.

- [ ] **Step 2: Run the component tests and record genuine RED**

Run:

```bash
pnpm vitest run \
  src/components/MetricCard.test.tsx \
  src/components/SampleDistribution.test.tsx \
  src/components/DataSourceBadge.test.tsx \
  src/components/EvidenceDrawer.test.tsx
```

Expected before implementation: FAIL because the four component modules do not exist. Do not weaken assertions to obtain RED.

- [ ] **Step 3: Implement MetricCard and DataSourceBadge**

`MetricCard` must render an `<article>` with `data-testid="metric-card-${id}"`, visible label/value/evidence note, and optional calculation note.

`DataSourceBadge` must use this exact content mapping:

```ts
const SOURCE_COPY = {
  demo: {
    label: "Synthetic demo",
    note: "Synthetic demonstration evidence; not a live market dataset.",
  },
  user_upload: {
    label: "User upload",
    note: "User-provided evidence retains its own sourcing limitations.",
  },
} satisfies Record<SourceKind, { label: string; note: string }>;
```

Use `data-testid="analysis-source-badge"` and visible note text. Do not reuse the shell's `source-badge` test ID.

- [ ] **Step 4: Implement SampleDistribution**

Render a labelled `<section data-testid="distribution-${id}">` containing an ordered `<ul>`. For each unchanged domain band render:

```tsx
<progress
  aria-label={`${band.label}: ${band.count} of ${productCount} products`}
  max={productCount || 1}
  value={band.count}
/>
```

Show band label, exact count, and percentage using:

```ts
const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});
```

If `shareOfProducts` is `null`, display `Unavailable`. Keep zero-count fixed bands. The scale statement must use the real `productCount`; an empty sample reads `Scale unavailable — no products in this sample` and must not imply a denominator of one despite the safe progress `max`.

- [ ] **Step 5: Implement EvidenceDrawer**

Use native markup:

```tsx
<details className="evidence-drawer" data-testid="category-evidence">
  <summary>Calculation evidence</summary>
  {/* visible structured sections */}
</details>
```

Render structured lists for included/excluded IDs, Q1/median/Q3, product denominator, each band and its IDs, each brand group and IDs, and each attribute's present/missing IDs. Use `None` for empty ID lists. Do not copy calculations into this component.

- [ ] **Step 6: Run component tests and obtain GREEN**

Run the four-component command from Step 2.

Expected: all component test files PASS with no accessibility-query failure.

- [ ] **Step 7: Write failing CategoryPage integration tests**

Create `src/pages/CategoryPage.test.tsx` following the existing real-provider/fetch pattern in `HomePage.test.tsx`. Load the actual synthetic Demo CSV and render `/category` inside `ResearchProvider`, `MemoryRouter`, and `ResearchLayout`.

Assert after provider settlement:

```tsx
expect(screen.getByRole("heading", { name: "Category overview" })).toBeVisible();
expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo");
expect(screen.getByTestId("metric-card-products")).toHaveTextContent("12");
expect(screen.getByTestId("metric-card-median-price")).toHaveTextContent("$");
expect(screen.getByTestId("metric-card-price-range")).toHaveTextContent("$");
expect(screen.getByTestId("metric-card-brands")).toBeVisible();
expect(screen.getByTestId("distribution-price")).toBeVisible();
expect(screen.getByTestId("distribution-rating")).toBeVisible();
expect(screen.getByTestId("distribution-reviews")).toBeVisible();
expect(screen.getByTestId("category-brand-share")).toHaveTextContent(/current sample/i);
expect(screen.getByTestId("category-attribute-coverage")).toBeVisible();
expect(screen.getByTestId("category-evidence")).toBeInTheDocument();
expect(screen.getByTestId("category-limitations")).toHaveTextContent(/not sales/i);
```

Also assert status copy is `Continue research`, every displayed brand row has count/denominator, every coverage row has present/missing/denominator, and the page contains no `market share`, `low competition`, `recommended price`, `best launch price`, or `commercially attractive` claim.

Add a user-upload test by importing valid Demo-shaped CSV files through the real Home workflow, navigating to `/category`, and asserting `User upload` provenance without a live-market claim.

- [ ] **Step 8: Run CategoryPage tests and record RED**

Run:

```bash
pnpm vitest run src/pages/CategoryPage.test.tsx
```

Expected: FAIL because `CategoryPage` is still a placeholder and required components are absent.

- [ ] **Step 9: Implement CategoryPage from the approved analysis**

Use:

```tsx
const { dataset } = useResearch();
const analysis = useMemo(
  () => (dataset ? analyzeCategory(dataset) : null),
  [dataset],
);
```

If `analysis` is `null`, render a polite `No active category evidence is available.` state without numbers. This is defensive; normal locked-route behavior remains in `ResearchLayout`.

Use `PageHeader`, `DataSourceBadge`, four `MetricCard` instances, three `SampleDistribution` instances, represented-brand rows, attribute-coverage rows, `EvidenceDrawer`, and all domain limitations in the exact reading order from the approved design.

Format currency only with:

```ts
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
```

Count provided brands with `analysis.brandShares.filter((row) => row.brand !== null).length`. Never recalculate medians, bands, shares, or coverage.

- [ ] **Step 10: Run CategoryPage tests and obtain GREEN**

Run `pnpm vitest run src/pages/CategoryPage.test.tsx`.

Expected: all CategoryPage tests PASS.

- [ ] **Step 11: Write failing Home integration tests**

Modify the existing approved-overview test in `src/pages/HomePage.test.tsx`:

```tsx
expect(screen.getByTestId("metric-products")).toHaveTextContent("12");
expect(screen.getByTestId("metric-reviews")).toHaveTextContent("76");
expect(screen.getByTestId("metric-price-range")).toHaveTextContent("$");
expect(screen.getByTestId("metric-brands")).toHaveTextContent(/provided brand/i);
expect(screen.queryByTestId("metric-source")).not.toBeInTheDocument();
expect(screen.queryByTestId("metric-updated")).not.toBeInTheDocument();
expect(screen.getByTestId("home-observation-range")).toHaveTextContent(/Observed/);
expect(screen.getByTestId("home-price-distribution")).toBeVisible();
expect(screen.getByRole("link", { name: /Open Category overview/i }))
  .toHaveAttribute("href", "/category");
expect(screen.queryByText(/after its tested analysis module is implemented/i))
  .not.toBeInTheDocument();
```

Extend the failed-import test to record the Demo price range and brand count before import, then assert both remain unchanged after the rejected import. Extend the successful-import test to assert the Home metrics and compact distribution change to the accepted user-upload dataset.

Use at least three valid products for the successful-import integration fixture so Category remains available. Add a two-product accepted-upload assertion that `home-price-distribution` is absent, the evidence-insufficient locked copy is visible, and there is no active Category link.

Update `MetricItem["id"]` expectations to `products | reviews | price-range | brands`.

- [ ] **Step 12: Run Home tests and record RED**

Run:

```bash
pnpm vitest run src/pages/HomePage.test.tsx
```

Expected: FAIL because Home still renders source/imported metrics and placeholder category copy.

- [ ] **Step 13: Integrate analysis into Home and MetricStrip**

In `MetricStrip.tsx`, change the ID union to:

```ts
id: "products" | "reviews" | "price-range" | "brands";
```

In `HomePage`, memoize `analyzeCategory(dataset)`. Build four metrics exactly as approved. Move the active product observation range into `PageHeader.meta` with `data-testid="home-observation-range"`: sort copied non-empty `observedAt` values, show `Observed YYYY-MM-DD` when min equals max, `Observed YYYY-MM-DD to YYYY-MM-DD` when they differ, and `Observation dates unavailable` when none exist. Do not label `dataset.importedAt` as an observation date.

When `qualityReport.moduleAvailability.category === "available"`, replace the `analysis-next-step` placeholder with a section carrying `data-testid="home-price-distribution"`, one compact `SampleDistribution`, the sample-only price caution, and an `Open Category overview` link. When category is locked, render the existing evidence-insufficient message without bars or an active Category link.

Keep existing source/date provenance elsewhere, all quality gates, cautions, import controls, import result behavior, and locked-category copy.

- [ ] **Step 14: Run Home and route tests and obtain GREEN**

Run:

```bash
pnpm vitest run src/pages/HomePage.test.tsx src/app/routes.test.tsx
```

Update only the stale route assertion that calls completed Category Overview a placeholder. Keep all six routes, shell, locks, and no-sales-prediction assertions intact.

Expected: both files PASS.

- [ ] **Step 15: Add scoped Light Slate styles**

Append focused classes for:

- `.category-page` and section spacing;
- `.category-metrics` responsive grid;
- `.metric-card` and its label/value/notes;
- `.sample-distribution`, rows, visible count/share, and `progress`;
- `.category-brand-share` rows;
- `.category-attribute-coverage` rows;
- `.evidence-drawer` and nested evidence lists;
- `.category-limitations`;
- compact Home distribution.

Use existing CSS variables and breakpoints. Do not change global tokens, shell geometry, import layout, IssueTable, or Quality styles. At narrow widths, grids become one column and long product IDs use `overflow-wrap: anywhere`; do not hide evidence or counts.

- [ ] **Step 16: Run focused Task 4B verification**

Run:

```bash
pnpm vitest run \
  src/components/MetricCard.test.tsx \
  src/components/SampleDistribution.test.tsx \
  src/components/DataSourceBadge.test.tsx \
  src/components/EvidenceDrawer.test.tsx \
  src/pages/CategoryPage.test.tsx \
  src/pages/HomePage.test.tsx \
  src/app/routes.test.tsx
```

Expected: all focused files and tests PASS.

- [ ] **Step 17: Run the complete quality gate**

Run:

```bash
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Expected: every command exits `0`; full suite has zero failures; frozen install reports the lockfile is current.

- [ ] **Step 18: Perform browser smoke validation without claiming Task 4C acceptance**

Run the local app and inspect Home and `/category` at one normal desktop viewport and one 390px-wide viewport. Confirm no horizontal overflow, native evidence disclosure works by keyboard/click, progress labels and counts remain visible, and console has no application error or warning.

This is a Task 4B smoke check only. Do not claim final responsive/accessibility/visual acceptance, which belongs to Task 4C.

- [ ] **Step 19: Audit scope and commit once**

Run:

```bash
git diff --name-only
git status --short
```

Only the allowed files listed in this plan may appear. Then:

```bash
git add \
  src/components/MetricCard.tsx \
  src/components/MetricCard.test.tsx \
  src/components/SampleDistribution.tsx \
  src/components/SampleDistribution.test.tsx \
  src/components/DataSourceBadge.tsx \
  src/components/DataSourceBadge.test.tsx \
  src/components/EvidenceDrawer.tsx \
  src/components/EvidenceDrawer.test.tsx \
  src/pages/CategoryPage.tsx \
  src/pages/CategoryPage.test.tsx \
  src/pages/HomePage.tsx \
  src/pages/HomePage.test.tsx \
  src/components/MetricStrip.tsx \
  src/app/routes.test.tsx \
  src/app/styles.css
git commit -m "feat: add traceable category overview"
git status --short --branch
```

Expected: one ordinary commit and a clean `main` worktree. Stop without starting Task 4C or Task 5.
