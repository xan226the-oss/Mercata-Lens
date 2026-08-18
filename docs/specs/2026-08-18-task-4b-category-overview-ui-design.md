# Mercata Lens Task 4B: Category Overview UI Design

- Date: 2026-08-18
- Approved base HEAD: `b859245ea75c602ea083c4f661935cee05f3f2e0`
- Product task: Task 4, Traceable Category Overview
- This document covers: Task 4B Category Overview UI and Home integration

## 1. Goal

Render the approved Task 4A category analysis as a traceable, accessible product experience. Task 4B replaces the Category Overview placeholder, connects the same analysis to the Home page's previously reserved category metrics and price panel, and preserves every evidence boundary.

Task 4B does not change how statistics are calculated. `analyzeCategory(dataset)` remains the only source of category-analysis truth.

## 2. Scope boundary

Task 4B may:

- create focused presentational components for category metrics, distributions, source labelling, and evidence disclosure;
- replace the placeholder `CategoryPage` with the approved overview;
- update `HomePage` to show the now-available price range, represented brand count, and compact price distribution;
- update `MetricStrip` item IDs so the Home metrics have truthful semantics;
- add or update focused component/page/route tests;
- add only the CSS required by the new UI.

Task 4B must not:

- modify `src/domain/category.ts` or its tests;
- change parsing, quality thresholds, module availability, route gating, ResearchContext state, or Demo CSV data;
- persist analysis in context, local storage, a backend, or a cache;
- add a chart library or any dependency;
- implement manual-calculation evidence, README updates, final responsive acceptance, or final accessibility acceptance assigned to Task 4C;
- implement pain-point extraction, economics, opportunity scoring, decisions, AI, scraping, external APIs, deployment, or Task 5.

## 3. Data flow

`CategoryPage` and `HomePage` each read the active `dataset` from `useResearch()` and derive category analysis with:

```ts
const categoryAnalysis = useMemo(
  () => (dataset ? analyzeCategory(dataset) : null),
  [dataset],
);
```

The analysis is not written back to `ResearchContext`. A rejected import continues to leave the active dataset and its analysis unchanged, following the existing Task 3 behavior.

`ResearchLayout` remains responsible for locked routes. Task 4B must not render category results when `/category` is locked or bypass the current module-availability rules.

## 4. Component structure

### 4.1 MetricCard

Create `src/components/MetricCard.tsx` for one descriptive category metric. It receives an ID, label, formatted value, evidence note, and optional calculation note.

The component uses visible text rather than a tooltip-only explanation. It must not imply that a sample metric is a market KPI.

Category Overview uses it for:

- products in sample;
- median observed price;
- observed price range;
- provided brand labels.

### 4.2 SampleDistribution

Create `src/components/SampleDistribution.tsx` to display a titled list of `CategoryBand` values.

For every row show:

- the approved band label;
- exact product count;
- formatted share of all products when available;
- a progress indicator with `min=0`, `max=productCount`, and `value=count`;
- a visible scale statement: `Scale: 0 to N products in this sample`.

The component receives the domain boundaries and IDs unchanged. It may format numbers but cannot recalculate membership or invent different bands. Zero-count fixed bands remain visible. Empty price bands remain absent because Task 4A intentionally omits them.

The accessible name for each progress indicator must include the band label and exact count. No axis is truncated and no low-count band is labelled low competition.

The component supports a compact presentation for Home without changing content truth. The compact Home version still displays exact counts and the sample-scale statement.

### 4.3 DataSourceBadge

Create `src/components/DataSourceBadge.tsx` to label the analysis source:

- Demo: `Synthetic demo`;
- user upload: `User upload`.

The accompanying text states either that Demo evidence is synthetic or that a user upload retains its own sourcing limitations. The component must not say Amazon, live market, verified market, or production data.

### 4.4 EvidenceDrawer

Create `src/components/EvidenceDrawer.tsx` using native `<details>` and `<summary>` elements. It receives `CategoryAnalysis` and displays:

- all included product IDs;
- excluded products and reasons, or `None`;
- Q1, median, and Q3 cut points;
- the all-product denominator;
- exact product IDs contributing to each price, rating, and review-count band;
- exact product IDs in each brand group;
- present and missing product IDs for each tracked attribute.

Evidence content remains in the DOM when collapsed and is keyboard operable through native semantics. No custom drawer overlay, focus trap, or animation is required.

## 5. Category Overview page

The page reading order is:

1. `PageHeader` with category, US market, and source badge;
2. status panel derived from `CategoryAnalysis.status` and `statusReasons`;
3. four metric cards;
4. price distribution;
5. rating and displayed review-count distributions;
6. represented brand share in the current sample;
7. attribute completeness;
8. evidence drawer;
9. limitations.

### 5.1 Status copy

- `continue_research`: `Continue research` with the domain reason that the sample is large enough for descriptive inspection only;
- `insufficient_evidence`: `Insufficient evidence` with the exact domain reason;
- `pause`: `Pause` may be mapped defensively for type completeness but Task 4A does not emit it.

The page must not turn `continue_research` into a recommendation to enter the category.

### 5.2 Metrics

Formatting rules:

- USD uses `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`;
- median is not recalculated in the page;
- the price range displays the domain min and max;
- represented brand count equals the number of `brandShares` rows whose `brand` is not `null`;
- missing brand values are described separately and do not become a fake brand.

### 5.3 Brand share

For every `brandShares` row show label, count, denominator, formatted percentage, and contributing product IDs through the evidence drawer. The section title and supporting copy must use `represented brand share in this sample`, never market share or brand concentration in the wider market.

### 5.4 Attribute coverage

For brand, material, capacity, filter cost, and displayed review count, show present count, missing count, denominator, and formatted coverage. A `null` coverage displays `Unavailable`, not `0%`.

### 5.5 Limitations

Render all domain limitations as a list. Copy may add headings but cannot remove or weaken the supplied limitations. Persistent project cautions remain visible: current sample only, Demo or user source boundary, and review count is not sales.

## 6. Home integration

When an active dataset exists, the Home metric strip becomes:

1. `Products in sample` — `analysis.productCount`;
2. `Review evidence` — `dataset.reviews.length`, explicitly not sales;
3. `Observed price range` — formatted `analysis.priceRange`, or `Unavailable`;
4. `Provided brand labels` — count of non-null brand groups, explicitly limited to this sample.

The old Data source and Imported metric positions are removed from the strip. Source and date context remain elsewhere in the existing page/header workflow; Task 4B does not erase provenance from the product.

Replace `category-analysis-next-step` placeholder copy with a compact, truthful price-distribution panel derived from `analysis.priceBands`. Keep the link to `/category`. Supporting copy must state that this is the active comparison set and does not establish a recommended price or total-market distribution.

If no active dataset exists, do not render fabricated metric or distribution values. Existing loading/error handling remains intact.

## 7. Styling and responsive boundary

Use the existing Light Slate tokens, spacing, typography, borders, and status colours. Distribution graphics are CSS/native progress presentation, not decorative SVG or canvas charts.

Task 4B must remain usable at existing breakpoints and must not introduce horizontal overflow. Task 4C will perform the formal 1440/900/390 visual, keyboard, screen-reader, and final responsive acceptance, so Task 4B must not claim that final acceptance has occurred.

## 8. Testing

New behavior follows genuine RED → GREEN. Required coverage includes:

- `MetricCard` exposes label, value, and evidence note;
- `SampleDistribution` preserves order, shows zero-count bands, exact counts, scale, and accessible progress values;
- `DataSourceBadge` differentiates Demo and user upload without market claims;
- `EvidenceDrawer` uses native details semantics and exposes all required IDs and cut points;
- Category Overview renders the four metrics from `analyzeCategory`;
- price, rating, review-count, brand, coverage, evidence, status, and limitations are visible;
- no `market share`, `low competition`, `sales`, recommended-price, or commercial-attractiveness claim is introduced;
- Home replaces source/imported metric positions with price range and provided-brand count;
- Home price distribution uses the active analysis and links to Category Overview;
- rejected imports continue to leave active Home/category analysis unchanged through existing context behavior;
- locked `/category` behavior remains unchanged;
- Demo and user-upload states use truthful source copy;
- no-data/loading/error rendering contains no fabricated values.

Focused tests, the full test suite, build, lint, frozen-lockfile install, and `git diff --check` must pass.

## 9. Acceptance and stopping point

Task 4B is complete when the approved Task 4A result is rendered consistently on Category Overview and Home, every displayed number is traceable to the active dataset, and no route or evidence boundary regresses.

End with one ordinary commit and a clean worktree. Do not amend, push, deploy, create a PR, start Task 4C, or start Task 5.
